#!/bin/bash

set -e

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null;
then
    echo "gcloud could not be found. Please install and configure the Google Cloud SDK."
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null;
then
    echo "terraform could not be found. Please install terraform."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null;
then
    echo "kubectl could not be found. Please install kubectl."
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
  export $(echo $(cat .env | sed 's/#.*//g'| xargs) | envsubst)
fi

# Check for required environment variables
if [ -z "$GCP_PROJECT_ID" ]; then
  echo "Error: GCP_PROJECT_ID is not set. Please set it in your .env file."
  exit 1
fi

GCP_REGION=${GCP_REGION:-us-central1}
CLUSTER_NAME="sih-solvers-compass-cluster"
REPO_NAME="sih-solver-compass"
ARTIFACT_REGISTRY_URL="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO_NAME}"

FRONTEND_IMAGE_NAME="frontend"
BACKEND_IMAGE_NAME="backend"

FRONTEND_IMAGE_URL="${ARTIFACT_REGISTRY_URL}/${FRONTEND_IMAGE_NAME}:latest"
BACKEND_IMAGE_URL="${ARTIFACT_REGISTRY_URL}/${BACKEND_IMAGE_NAME}:latest"

echo "--------------------------------------------------"
echo "GCP Project: $GCP_PROJECT_ID"
echo "GCP Region: $GCP_REGION"
echo "GKE Cluster: $CLUSTER_NAME"
echo "Artifact Registry: $ARTIFACT_REGISTRY_URL"
echo "Frontend Image: $FRONTEND_IMAGE_URL"
echo "Backend Image: $BACKEND_IMAGE_URL"
echo "--------------------------------------------------"

# Authenticate with GCP
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://${GCP_REGION}-docker.pkg.dev

# Enable required services
echo "Enabling required GCP services..."
gcloud services enable container.googleapis.com artifactregistry.googleapis.com

# Create Artifact Registry repository if it doesn't exist
if ! gcloud artifacts repositories describe ${REPO_NAME} --location=${GCP_REGION} --project=${GCP_PROJECT_ID} &> /dev/null;
then
  echo "Creating Artifact Registry repository..."
  gcloud artifacts repositories create ${REPO_NAME} --repository-format=docker --location=${GCP_REGION} --description="SIH Solver's Compass repository" --project=${GCP_PROJECT_ID}
fi

# Build and push Docker images
echo "Building and pushing frontend image..."
docker build -t ${FRONTEND_IMAGE_URL} ./frontend
docker push ${FRONTEND_IMAGE_URL}

echo "Building and pushing backend image..."
docker build -t ${BACKEND_IMAGE_URL} ./backend
docker push ${BACKEND_IMAGE_URL}

# Deploy GKE cluster with Terraform
echo "Initializing Terraform..."
cd infrastructure/terraform-gcp

terraform init

echo "Applying Terraform configuration to create GKE cluster..."
terraform apply -auto-approve \
  -var="gcp_project_id=${GCP_PROJECT_ID}" \
  -var="gcp_region=${GCP_REGION}" \
  -var="gke_cluster_name=${CLUSTER_NAME}"

cd ../..

# Get GKE credentials
echo "Fetching GKE cluster credentials..."
gcloud container clusters get-credentials ${CLUSTER_NAME} --region ${GCP_REGION} --project ${GCP_PROJECT_ID}

# Update Kubernetes manifests with the new image URLs
echo "Updating Kubernetes manifests with new image URLs..."
sed -i "s|image: .*frontend.*|image: ${FRONTEND_IMAGE_URL}|g" infrastructure/k8s/frontend.yaml
sed -i "s|image: .*backend.*|image: ${BACKEND_IMAGE_URL}|g" infrastructure/k8s/backend.yaml

echo "Applying Kubernetes manifests..."
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/secrets.yaml
kubectl apply -f infrastructure/k8s/chromadb.yaml
kubectl apply -f infrastructure/k8s/backend.yaml
kubectl apply -f infrastructure/k8s/frontend.yaml

echo "Waiting for frontend LoadBalancer to get an external IP address..."
echo "This may take a few minutes..."

EXTERNAL_IP=""
TIMEOUT=600  # 10 minutes timeout
SECONDS=0

while [ -z "$EXTERNAL_IP" ]; do
  EXTERNAL_IP=$(kubectl get svc frontend-service -n sih-solvers-compass -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
  if [ -z "$EXTERNAL_IP" ]; then
    if [ $SECONDS -gt $TIMEOUT ]; then
      echo "Error: Timed out waiting for external IP."
      echo "Please check the service status manually with: kubectl get svc frontend-service -n sih-solvers-compass"
      exit 1
    fi
    sleep 15
    SECONDS=$((SECONDS + 15))
    echo "Still waiting..."
  fi
done

FRONTEND_URL="http://${EXTERNAL_IP}"

echo "--------------------------------------------------"
echo "✅ Deployment Summary"
echo "--------------------------------------------------"
echo "GCP Project:      $GCP_PROJECT_ID"
echo "GKE Cluster:      $CLUSTER_NAME"
echo "Region:           $GCP_REGION"
echo ""
echo "🚀 Frontend URL: $FRONTEND_URL"
echo ""
echo "You can now access your application."
echo "--------------------------------------------------"
