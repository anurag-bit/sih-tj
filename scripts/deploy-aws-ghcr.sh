#!/usr/bin/env bash

# GHCR-Based AWS Deployment Script
# Usage: ./deploy-aws-ghcr.sh [options]
# Options:
#   --plan-only     : Only create and show the Terraform plan
#   --auto-approve  : Skip confirmation prompts
#   --destroy       : Destroy infrastructure instead of creating
#   --help          : Show this help message

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the absolute path of the script and the project root
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform-aws"
K8S_DIR="$PROJECT_ROOT/infrastructure/k8s"

# Default options
PLAN_ONLY=false
AUTO_APPROVE=false
DESTROY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --plan-only)
            PLAN_ONLY=true
            shift
            ;;
        --auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        --destroy)
            DESTROY=true
            shift
            ;;
        --help)
            echo "GHCR-Based AWS Deployment Script"
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --plan-only     Only create and show the Terraform plan"
            echo "  --auto-approve  Skip confirmation prompts"
            echo "  --destroy       Destroy infrastructure instead of creating"
            echo "  --help          Show this help message"
            echo ""
            echo "This script deploys infrastructure using GHCR images (no ECR building required)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to print colored output
print_status() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Main deployment function
main() {
    print_status "GHCR-Based AWS Deployment Script"
    echo "=================================="
    
    # Check required tools
    print_status "Checking required tools..."
    for tool in aws terraform kubectl; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool not found. Please install $tool first."
            exit 1
        fi
        print_success "$tool found"
    done
    
    # Load environment variables
    print_status "Loading environment variables from .env file..."
    # The script is in the 'scripts' directory, so we look for .env in the parent directory
    ENV_FILE="$PROJECT_ROOT/.env"
    if [ -f "$ENV_FILE" ]; then
        # shellcheck disable=SC1090
        set -o allexport; source "$ENV_FILE"; set +o allexport
        print_success "Environment variables loaded from $ENV_FILE"
    else
        print_error ".env file not found at $ENV_FILE. Please ensure it exists in the project root."
        exit 1
    fi
    
    # Verify required environment variables
    if [ -z "$AWS_REGION" ]; then
        print_error "AWS_REGION is not set. Please set it in your .env file."
        exit 1
    fi
    
    if [ -z "$OPENROUTER_API_KEY" ]; then
        print_error "OPENROUTER_API_KEY is not set. Please set it in your .env file."
        exit 1
    fi
    
    # Configure AWS credentials
    print_status "Configuring AWS credentials..."
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Verify AWS credentials
    print_status "Verifying AWS credentials..."
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS Account: $AWS_ACCOUNT_ID"
    
    # Terraform Operations
    print_status "Terraform Operations"
    echo "========================"
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    pushd "$TERRAFORM_DIR" >/dev/null
    terraform init -upgrade -input=false
    print_success "Terraform initialized"
    
    # Create Terraform execution plan
    if [ "$DESTROY" = true ]; then
        print_status "Creating Terraform destroy plan..."
    terraform plan -destroy -var="OPENROUTER_API_KEY=$OPENROUTER_API_KEY" -out=destroy-plan
        
        if [ "$PLAN_ONLY" = true ]; then
            print_success "Destroy plan created successfully. Review the plan above."
            exit 0
        fi
        
        # Confirmation for destroy
        if [ "$AUTO_APPROVE" = false ]; then
            echo
            print_warning "This will DESTROY all AWS resources!"
            read -p "Do you want to proceed with the destruction? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_warning "Destruction cancelled."
                exit 0
            fi
        fi
        
        print_status "Destroying AWS infrastructure..."
    terraform apply destroy-plan
        print_success "Infrastructure destroyed successfully!"
        exit 0
    else
        print_status "Creating Terraform execution plan..."
    terraform plan -var="OPENROUTER_API_KEY=$OPENROUTER_API_KEY" -out=tfplan
        
        if [ "$PLAN_ONLY" = true ]; then
            print_success "Plan created successfully. Review the plan above."
            exit 0
        fi
        
        # Show plan summary
        echo
        print_status "Terraform Plan Summary:"
        echo "=================================="
        terraform show -no-color tfplan | grep -E "Plan:|No changes"
        echo "=================================="
        
        # Confirmation
        if [ "$AUTO_APPROVE" = false ]; then
            echo
            read -p "Do you want to apply this Terraform plan? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_warning "Deployment cancelled."
                exit 0
            fi
        fi
        
        print_status "Applying Terraform configuration..."
        terraform apply tfplan
        print_success "Infrastructure deployed successfully!"
    fi
    
    # Get Terraform outputs
    print_status "Retrieving Terraform outputs..."
    EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name 2>/dev/null || echo "")
    AWS_REGION_OUTPUT=$(terraform output -raw aws_region 2>/dev/null || echo "")
    
    if [ -z "$EKS_CLUSTER_NAME" ]; then
        print_error "Could not retrieve Terraform outputs."
        exit 1
    fi
    
    popd >/dev/null
    
    # Kubernetes Deployment
    print_status "Kubernetes Deployment"
    echo "========================"
    
    # Wait for EKS cluster to be ACTIVE
    print_status "Waiting for EKS cluster to be ACTIVE..."
    for i in {1..60}; do
        STATUS=$(aws eks describe-cluster --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION" --query 'cluster.status' --output text || echo "UNKNOWN")
        [[ "$STATUS" == "ACTIVE" ]] && break
        sleep 10
    done
    if [[ "$STATUS" != "ACTIVE" ]]; then
        print_error "EKS cluster not ACTIVE (status=$STATUS)"
        exit 1
    fi

    # Configure kubectl
    print_status "Configuring kubectl for EKS cluster..."
    aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION"
    print_success "kubectl configured"
    
    # Verify cluster connectivity
    print_status "Verifying cluster connectivity..."
    kubectl get nodes
    print_success "Cluster connectivity verified"
    
    # Create namespace and secrets
    print_status "Creating Kubernetes namespace and secrets..."
        kubectl apply -f "$K8S_DIR/namespace.yaml"
        kubectl apply -f "$K8S_DIR/secrets.yaml"

        # Populate secrets from .env (base64-encode values)
        NAMESPACE="sih-solvers-compass"
        GEMINI_VAL="${GEMINI_API_KEY:-}"
        OPENROUTER_VAL="${OPENROUTER_API_KEY:-}"
        GITHUB_VAL="${GITHUB_TOKEN:-}"

        b64() { printf %s "$1" | base64 -w0 2>/dev/null || printf %s "$1" | base64 | tr -d '\n'; }
        GEMINI_B64=$(b64 "$GEMINI_VAL")
        OPENROUTER_B64=$(b64 "$OPENROUTER_VAL")
        GITHUB_B64=$(b64 "$GITHUB_VAL")

        print_status "Patching Kubernetes secret with provided API keys..."
        kubectl -n "$NAMESPACE" patch secret sih-secrets \
            --type merge -p "{\"data\":{\"gemini-api-key\":\"$GEMINI_B64\",\"openrouter-api-key\":\"$OPENROUTER_B64\",\"github-token\":\"$GITHUB_B64\"}}" || true
    print_success "Namespace and secrets created"
    
    # Ensure gp3 StorageClass is default
        print_status "Applying gp3 default StorageClass (inline)..."
        cat <<'EOF' | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
    name: gp3-default
    annotations:
        storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
allowVolumeExpansion: true
parameters:
    type: gp3
    iops: "3000"
    throughput: "125"
volumeBindingMode: WaitForFirstConsumer
EOF
    # Remove default annotation from any other StorageClass
    DEFAULT_SCS=$(kubectl get sc -o jsonpath='{range .items[?(@.metadata.annotations.storageclass\u002ekubernetes\u002eio/is-default-class=="true")]}{.metadata.name}{"\n"}{end}' || true)
    for sc in $DEFAULT_SCS; do
        if [ "$sc" != "gp3-default" ]; then
            print_status "Removing default annotation from StorageClass $sc"
            kubectl patch sc "$sc" -p '{"metadata": {"annotations": {"storageclass.kubernetes.io/is-default-class":"false"}}}' || true
        fi
    done

    # Prepare ChromaDB PVC (recreate if Pending) and wait for deployment
    print_status "Deploying ChromaDB (PVC + Deployment + Service)..."
    PVC_PHASE=$(kubectl get pvc chromadb-pvc -n sih-solvers-compass -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    if [ "$PVC_PHASE" = "Pending" ]; then
        print_status "Deleting Pending chromadb-pvc to rebind with default StorageClass..."
        kubectl delete pvc chromadb-pvc -n sih-solvers-compass --wait=true || true
    fi
    kubectl apply -f "$K8S_DIR/chromadb-optimal.yaml"
    print_status "Waiting for ChromaDB to be available..."
    kubectl -n sih-solvers-compass rollout status deploy/chromadb --timeout=10m

    # Deploy docgen-go service
    print_status "Deploying docgen-go service..."
    kubectl apply -f "$K8S_DIR/docgen-go.yaml"
    print_status "Waiting for docgen-go to be available..."
    kubectl -n sih-solvers-compass rollout status deploy/docgen-go --timeout=5m

    # Deploy backend and frontend
    print_status "Deploying backend and frontend with GHCR images..."
            # Apply frontend NGINX ConfigMap only if present AND non-empty to avoid kubectl 'no objects' error
            if [[ -s "$K8S_DIR/frontend-nginx-configmap.yaml" ]]; then
                kubectl apply -f "$K8S_DIR/frontend-nginx-configmap.yaml"
            else
                print_warning "Skipping frontend-nginx-configmap.yaml (missing or empty)."
            fi

        kubectl apply -f "$K8S_DIR/backend-fixed.yaml"
        kubectl apply -f "$K8S_DIR/frontend-fixed.yaml"
    print_success "Applications deployed"
    
    # Wait for deployments to be ready
    print_status "Waiting for deployments to be ready..."
    kubectl -n sih-solvers-compass rollout status deploy/backend --timeout=10m
    kubectl -n sih-solvers-compass rollout status deploy/frontend --timeout=10m
    print_success "All deployments are ready"
    
    # Get service information
    print_status "Getting service information..."
    kubectl get services -n sih-solvers-compass
    
    # Get LoadBalancer URL
    FRONTEND_URL=$(kubectl get service frontend -n sih-solvers-compass -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")
    
    # Final summary
    print_success "Deployment completed successfully!"
    echo
    echo "🎉 Summary:"
    echo "=========================="
    echo "AWS Region:       $AWS_REGION"
    echo "EKS Cluster:      $EKS_CLUSTER_NAME"
    echo "Frontend URL:     http://$FRONTEND_URL"
    echo "Image Registry:   GHCR (ghcr.io/anurag-bit/sih-tj-*:latest)"
    echo ""
    echo "🔧 Next Steps:"
    echo "- Wait for LoadBalancer to get external IP"
    echo "- Access your application at the Frontend URL"
    echo "- Monitor pods: kubectl get pods -n sih-solvers-compass"
    
    if [ "$FRONTEND_URL" = "pending" ]; then
        print_warning "LoadBalancer URL is still pending. Check status with:"
        echo "kubectl get service frontend -n sih-solvers-compass"
    fi
}

# Run main function
main "$@"
