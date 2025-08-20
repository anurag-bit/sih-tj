#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$ROOT_DIR/infrastructure/terraform-aws"
K8S_DIR="$ROOT_DIR/infrastructure/k8s"

AWS_REGION="${AWS_REGION:-us-east-1}"
NAMESPACE="${NAMESPACE:-sih-solvers-compass}"
CLUSTER_NAME="${CLUSTER_NAME:-}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing tool: $1"; exit 1; }; }
need aws; need kubectl; need terraform; need jq

echo "=== Safe destroy started ==="
echo "Region: ${AWS_REGION}"

# Try to detect cluster name from Terraform outputs
if [[ -z "${CLUSTER_NAME}" ]]; then
  if [[ -d "$TF_DIR" ]]; then
    pushd "$TF_DIR" >/dev/null
    terraform init -input=false >/dev/null 2>&1 || true
    CLUSTER_NAME="$(terraform output -raw eks_cluster_name 2>/dev/null || true)"
    popd >/dev/null
  fi
fi
CLUSTER_NAME="${CLUSTER_NAME:-sih-solvers-compass-eks}"
echo "Cluster: ${CLUSTER_NAME}"

# Configure kubectl (best-effort)
echo "Configuring kubectl for cluster..."
if aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "kubectl configured"
else
  echo "WARN: Could not configure kubectl (cluster may already be gone). Continuing to Terraform destroy."
fi

# Helper: wait for k8s resource deletion
wait_deleted() {
  local kind="$1" ns="$2" timeout="${3:-120}"
  echo "Waiting for $kind in ns=$ns to be deleted (timeout ${timeout}s)..."
  local end=$((SECONDS + timeout))
  while (( SECONDS < end )); do
    if ! kubectl get "$kind" -n "$ns" >/dev/null 2>&1; then
      break
    fi
    local cnt
    cnt=$(kubectl get "$kind" -n "$ns" --no-headers 2>/dev/null | wc -l | tr -d ' ')
    [[ "$cnt" == "0" ]] && break
    sleep 5
  done
}

# Helper: remove finalizers from stuck objects
remove_finalizers() {
  local kind="$1" ns="$2"
  echo "Removing finalizers from $kind in $ns (if any)..."
  kubectl get "$kind" -n "$ns" -o name 2>/dev/null | while read -r res; do
    kubectl patch "$res" -n "$ns" -p '{"metadata":{"finalizers":[]}}' --type=merge >/dev/null 2>&1 || true
  done
}

# Delete app namespace contents first to clean ELBs/ENIs/PVs
if kubectl get ns "$NAMESPACE" >/dev/null 2>&1; then
  echo "Namespace $NAMESPACE found. Draining workloads..."

  # Scale workloads to zero to detach ELB targets and EBS volumes cleanly
  kubectl -n "$NAMESPACE" scale deploy --all --replicas=0 >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" scale sts --all --replicas=0   >/dev/null 2>&1 || true

  # Delete HPAs, Ingresses, then LoadBalancer Services first (to remove ELBs/ENIs)
  kubectl -n "$NAMESPACE" delete hpa --all --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" delete ingress --all --ignore-not-found >/dev/null 2>&1 || true

  echo "Deleting Services of type LoadBalancer..."
  kubectl -n "$NAMESPACE" get svc -o json \
    | jq -r '.items[] | select(.spec.type=="LoadBalancer") | .metadata.name' \
    | xargs -r -n1 -I{} kubectl -n "$NAMESPACE" delete svc {} --ignore-not-found

  # Wait a bit for ELBs/ENIs to be released
  echo "Waiting for ELBs/ENIs to be released (90s)..."
  sleep 90

  # Delete remaining services, deployments, statefulsets, daemonsets, jobs, cronjobs, pods
  kubectl -n "$NAMESPACE" delete svc --all --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" delete deploy --all --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" delete sts --all --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" delete ds --all --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" delete job --all --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" delete cronjob --all --ignore-not-found >/dev/null 2>&1 || true
  kubectl -n "$NAMESPACE" delete pod --all --ignore-not-found >/dev/null 2>&1 || true

  # Delete PVCs so CSI can delete EBS volumes
  echo "Deleting PVCs..."
  kubectl -n "$NAMESPACE" delete pvc --all --ignore-not-found >/dev/null 2>&1 || true

  # Wait for PVCs/PVs cleanup
  wait_deleted "pvc" "$NAMESPACE" 120

  # Force-remove finalizers if anything is stuck
  remove_finalizers "pvc" "$NAMESPACE"

  # Attempt PV cleanup that belonged to this ns (best-effort)
  echo "Cleaning PVs bound to $NAMESPACE..."
  kubectl get pv -o json 2>/dev/null \
    | jq -r --arg ns "$NAMESPACE" '.items[] | select(.spec.claimRef.namespace==$ns) | .metadata.name' \
    | xargs -r -n1 -I{} kubectl delete pv {} --ignore-not-found >/dev/null 2>&1 || true

  # Finally, delete namespace (remove finalizers if stuck)
  echo "Deleting namespace $NAMESPACE..."
  kubectl delete ns "$NAMESPACE" --ignore-not-found >/dev/null 2>&1 || true

  # Wait for ns to terminate; if stuck, strip finalizers
  for i in {1..24}; do
    if ! kubectl get ns "$NAMESPACE" >/dev/null 2>&1; then
      break
    fi
    sleep 5
  done
  if kubectl get ns "$NAMESPACE" >/dev/null 2>&1; then
    echo "Namespace still terminating, removing finalizers..."
    kubectl get ns "$NAMESPACE" -o json \
      | jq 'del(.spec.finalizers)' \
      | kubectl replace --raw "/api/v1/namespaces/$NAMESPACE/finalize" -f - >/dev/null 2>&1 || true
  fi
else
  echo "Namespace $NAMESPACE not found; skipping k8s app cleanup."
fi

# Terraform destroy (EKS add-ons, nodegroups, cluster, OIDC, etc.)
echo "Running Terraform destroy..."
pushd "$TF_DIR" >/dev/null

terraform init -input=false >/dev/null
set +e
terraform destroy -auto-approve
TF_RC=$?
set -e

if [[ $TF_RC -ne 0 ]]; then
  echo "Terraform destroy failed; attempting to unblock EKS deletion (nodegroups/cluster)..."

  # Try deleting nodegroups if they still exist
  for ng in $(aws eks list-nodegroups --cluster-name "$CLUSTER_NAME" --region "$AWS_REGION" --query 'nodegroups[]' --output text 2>/dev/null || true); do
    echo "Deleting nodegroup: $ng"
    aws eks delete-nodegroup --cluster-name "$CLUSTER_NAME" --nodegroup-name "$ng" --region "$AWS_REGION" >/dev/null 2>&1 || true
    echo "Waiting for nodegroup $ng to delete..."
    for i in {1..60}; do
      state=$(aws eks describe-nodegroup --cluster-name "$CLUSTER_NAME" --nodegroup-name "$ng" --region "$AWS_REGION" --query 'nodegroup.status' --output text 2>/dev/null || echo "MISSING")
      [[ "$state" == "MISSING" ]] && break
      sleep 10
    done
  done

  # Retry terraform destroy
  set +e
  terraform destroy -auto-approve
  TF_RC=$?
  set -e

  if [[ $TF_RC -ne 0 ]]; then
    echo "Final terraform destroy attempt failed. Manual cleanup may be required."
    exit $TF_RC
  fi
fi

popd >/dev/null

echo "=== Safe destroy completed ==="
