#!/bin/bash

# SIH Solver's Compass - One-Click AWS Deployment Script
# This script deploys the entire application to AWS EKS using Terraform and Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="infrastructure/terraform-aws"
K8S_DIR="infrastructure/k8s"

echo -e "${BLUE}🚀 SIH Solver's Compass - One-Click AWS Deployment${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Login to AWS
echo -e "${YELLOW}🔐 Checking AWS login status...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Not logged into AWS. Please run 'aws configure' and set up your credentials.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Logged into AWS as: $(aws sts get-caller-identity --query "Arn" --output text)${NC}"

# Get Gemini API Key
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}🔑 Please enter your Gemini API Key:${NC}"
    read -s GEMINI_API_KEY
    export GEMINI_API_KEY
fi

# Initialize and apply Terraform
echo -e "${YELLOW}🏗️  Deploying AWS infrastructure with Terraform...${NC}"
cd $TERRAFORM_DIR

terraform init
terraform plan -var="gemini_api_key=$GEMINI_API_KEY"
terraform apply -var="gemini_api_key=$GEMINI_API_KEY" -auto-approve

# Get Terraform outputs
echo -e "${YELLOW}📤 Getting Terraform outputs...${NC}"
EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
ECR_BACKEND_URL=$(terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND_URL=$(terraform output -raw ecr_frontend_repository_url)
AWS_REGION=$(terraform output -raw aws_region)

cd ../..

# Configure kubectl
echo -e "${YELLOW}⚙️  Configuring kubectl...${NC}"
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION

# Docker build and push
echo -e "${YELLOW}🐳 Building and pushing Docker images to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_BACKEND_URL

docker build -t $ECR_BACKEND_URL:latest ./backend
docker push $ECR_BACKEND_URL:latest

docker build -t $ECR_FRONTEND_URL:latest ./frontend
docker push $ECR_FRONTEND_URL:latest

# Create namespace
echo -e "${YELLOW}📦 Creating Kubernetes namespace...${NC}"
kubectl apply -f $K8S_DIR/namespace.yaml

# Create secrets
echo -e "${YELLOW}🔐 Creating Kubernetes secrets...${NC}"
kubectl create secret generic sih-secrets \
    --from-literal=gemini-api-key="$GEMINI_API_KEY" \
    --namespace=sih-solvers-compass \
    --dry-run=client -o yaml | kubectl apply -f -

# Modify k8s manifests for AWS
echo -e "${YELLOW}✏️  Adapting Kubernetes manifests for AWS...${NC}"

# Backend
BACKEND_MANIFEST_TMP=$(mktemp)
cp $K8S_DIR/backend.yaml $BACKEND_MANIFEST_TMP
sed -i "s|image:.*|image: $ECR_BACKEND_URL:latest|" $BACKEND_MANIFEST_TMP

# Frontend
FRONTEND_MANIFEST_TMP=$(mktemp)
cp $K8S_DIR/frontend.yaml $FRONTEND_MANIFEST_TMP
sed -i "s|image:.*|image: $ECR_FRONTEND_URL:latest|" $FRONTEND_MANIFEST_TMP

# Add AWS Load Balancer Controller annotation for health check
ANNOTATION='service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: "/"'
sed -i "/type: LoadBalancer/a\  annotations:\n    $ANNOTATION" $FRONTEND_MANIFEST_TMP

# Deploy services
echo -e "${YELLOW}🚀 Deploying services to EKS...${NC}"

kubectl apply -f $K8S_DIR/chromadb.yaml
kubectl apply -f $BACKEND_MANIFEST_TMP
kubectl apply -f $FRONTEND_MANIFEST_TMP

# Wait for deployments
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/chromadb -n sih-solvers-compass
kubectl wait --for=condition=available --timeout=300s deployment/backend -n sih-solvers-compass
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n sih-solvers-compass

# Get external hostname
echo -e "${YELLOW}🌍 Getting external hostname...${NC}"
EXTERNAL_HOSTNAME=""
while [ -z $EXTERNAL_HOSTNAME ]; do
    echo "Waiting for LoadBalancer to assign hostname..."
    EXTERNAL_HOSTNAME=$(kubectl get svc frontend-service -n sih-solvers-compass --template="{{range .status.loadBalancer.ingress}}{{.hostname}}{{end}}")
    [ -z "$EXTERNAL_HOSTNAME" ] && sleep 10
done

# Run data ingestion
echo -e "${YELLOW}📊 Running data ingestion...${NC}"
BACKEND_POD=$(kubectl get pods -n sih-solvers-compass -l app=backend -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n sih-solvers-compass $BACKEND_POD -- python scripts/ingest_data.py

# Deployment complete
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Application URL: http://$EXTERNAL_HOSTNAME${NC}"
echo -e "${GREEN}✅ Backend API: http://$EXTERNAL_HOSTNAME/api/docs${NC}"
echo -e "${GREEN}✅ EKS Cluster: $EKS_CLUSTER_NAME${NC}"

echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "  kubectl get pods -n sih-solvers-compass"

echo ""
echo -e "${YELLOW}💡 To clean up resources, run:${NC}"
echo "  cd $TERRAFORM_DIR && terraform destroy"
