#!/bin/bash

# SIH Recovery Deployment Script
# Continue deployment from where it left off without rebuilding Docker images
# Usage: ./recover-deployment.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔄 SIH Recovery Deployment Script${NC}"
echo "=================================="

# Get Terraform outputs
cd infrastructure/terraform-aws

echo -e "${BLUE}📤 Getting deployment information from Terraform...${NC}"
EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
ECR_BACKEND_URL=$(terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND_URL=$(terraform output -raw ecr_frontend_repository_url)
AWS_REGION=$(terraform output -raw aws_region)

cd ../..

echo -e "${GREEN}📋 Deployment Configuration:${NC}"
echo "AWS Region:       $AWS_REGION"
echo "EKS Cluster:      $EKS_CLUSTER_NAME" 
echo "Backend Image:    $ECR_BACKEND_URL:latest"
echo "Frontend Image:   $ECR_FRONTEND_URL:latest"
echo "=================================="

# Verify kubectl is configured
echo -e "${YELLOW}🔧 Verifying kubectl configuration...${NC}"
if ! kubectl get nodes > /dev/null 2>&1; then
    echo -e "${BLUE}⚙️  Configuring kubectl...${NC}"
    aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION
fi

kubectl get nodes
echo -e "${GREEN}✅ Cluster is accessible${NC}"

# Check for required API keys
echo -e "${YELLOW}🔑 Checking API keys...${NC}"
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENROUTER_API_KEY not found in environment${NC}"
    if [ -f .env ]; then
        echo -e "${BLUE}📄 Loading from .env file...${NC}"
        export $(grep -v '^#' .env | xargs)
    fi
    
    if [ -z "$OPENROUTER_API_KEY" ]; then
        echo -e "${YELLOW}🔑 Please enter your OpenRouter API Key:${NC}"
        read -s OPENROUTER_API_KEY
        export OPENROUTER_API_KEY
    fi
fi

# Create namespace
echo -e "${YELLOW}📦 Creating Kubernetes namespace...${NC}"
kubectl apply -f infrastructure/k8s/namespace.yaml

# Wait for namespace to be ready
echo -e "${BLUE}⏳ Waiting for namespace to be ready...${NC}"
kubectl wait --for=condition=ready namespace sih-solvers-compass --timeout=30s

# Create secrets
echo -e "${YELLOW}🔐 Creating Kubernetes secrets...${NC}"
kubectl create secret generic sih-secrets \
    --from-literal=openrouter-api-key="$OPENROUTER_API_KEY" \
    --from-literal=gemini-api-key="${GEMINI_API_KEY:-}" \
    --from-literal=github-token="${GITHUB_TOKEN:-}" \
    --namespace=sih-solvers-compass \
    --dry-run=client -o yaml | kubectl apply -f -

# Create temporary manifests with correct image URLs
echo -e "${YELLOW}📝 Preparing deployment manifests...${NC}"

BACKEND_MANIFEST=$(mktemp)
FRONTEND_MANIFEST=$(mktemp)

# Prepare backend manifest
cp infrastructure/k8s/backend.yaml $BACKEND_MANIFEST
sed -i "s|image:.*backend.*|image: $ECR_BACKEND_URL:latest|g" $BACKEND_MANIFEST

# Prepare frontend manifest
cp infrastructure/k8s/frontend.yaml $FRONTEND_MANIFEST
sed -i "s|image:.*frontend.*|image: $ECR_FRONTEND_URL:latest|g" $FRONTEND_MANIFEST

# Deploy ChromaDB first
echo -e "${YELLOW}🗄️  Deploying ChromaDB...${NC}"
kubectl apply -f infrastructure/k8s/chromadb.yaml

# Wait for ChromaDB to be ready
echo -e "${BLUE}⏳ Waiting for ChromaDB to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/chromadb-deployment -n sih-solvers-compass

# Deploy backend
echo -e "${YELLOW}🔧 Deploying backend...${NC}"
kubectl apply -f $BACKEND_MANIFEST

# Deploy frontend
echo -e "${YELLOW}🎨 Deploying frontend...${NC}"
kubectl apply -f $FRONTEND_MANIFEST

# Wait for deployments
echo -e "${BLUE}⏳ Waiting for backend deployment...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n sih-solvers-compass

echo -e "${BLUE}⏳ Waiting for frontend deployment...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n sih-solvers-compass

# Check deployment status
echo -e "${YELLOW}📊 Checking deployment status...${NC}"
kubectl get pods -n sih-solvers-compass

# Get LoadBalancer URL
echo -e "${YELLOW}🌍 Getting external URL...${NC}"
echo "Waiting for LoadBalancer to assign external IP/hostname..."

EXTERNAL_HOSTNAME=""
TIMEOUT=300  # 5 minutes timeout
SECONDS=0

while [ -z "$EXTERNAL_HOSTNAME" ]; do
    EXTERNAL_HOSTNAME=$(kubectl get svc frontend-service -n sih-solvers-compass -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
    if [ -z "$EXTERNAL_HOSTNAME" ]; then
        if [ $SECONDS -gt $TIMEOUT ]; then
            echo -e "${RED}⏰ Timeout waiting for LoadBalancer. Checking service status...${NC}"
            kubectl get svc frontend-service -n sih-solvers-compass
            echo -e "${YELLOW}💡 The service might still be provisioning. Check back in a few minutes.${NC}"
            break
        fi
        sleep 10
        SECONDS=$((SECONDS + 10))
        echo -e "${BLUE}⏳ Still waiting... ($SECONDS/$TIMEOUT seconds)${NC}"
    fi
done

# Clean up temporary files
rm -f $BACKEND_MANIFEST $FRONTEND_MANIFEST

# Final status
echo ""
echo -e "${GREEN}🎉 Recovery Deployment Completed!${NC}"
echo "=================================="

if [ ! -z "$EXTERNAL_HOSTNAME" ]; then
    echo -e "${GREEN}✅ Frontend URL:${NC} http://$EXTERNAL_HOSTNAME"
    echo -e "${GREEN}✅ API Documentation:${NC} http://$EXTERNAL_HOSTNAME/docs"
else
    echo -e "${YELLOW}⏳ LoadBalancer is still provisioning...${NC}"
    echo -e "${BLUE}💡 Check the external URL with:${NC}"
    echo "kubectl get svc frontend-service -n sih-solvers-compass"
fi

echo -e "${GREEN}✅ Cluster:${NC} $EKS_CLUSTER_NAME"
echo -e "${GREEN}✅ Region:${NC} $AWS_REGION"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "kubectl get pods -n sih-solvers-compass"
echo "kubectl logs -f deployment/backend-deployment -n sih-solvers-compass"
echo "kubectl logs -f deployment/frontend-deployment -n sih-solvers-compass"
echo "kubectl get svc -n sih-solvers-compass"
echo "=================================="

echo -e "${GREEN}✅ Your existing 7GB Docker images have been deployed successfully!${NC}"
