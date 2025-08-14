#!/bin/bash

# SIH Solver's Compass - One-Click Azure Deployment Script
# This script deploys the entire application to Azure AKS using Terraform and Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="infrastructure/terraform"
K8S_DIR="infrastructure/k8s"
RESOURCE_GROUP_NAME="sih-solvers-compass-rg"
AKS_CLUSTER_NAME="sih-solvers-compass-aks"

echo -e "${BLUE}🚀 SIH Solver's Compass - One-Click Azure Deployment${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Login to Azure
echo -e "${YELLOW}🔐 Logging into Azure...${NC}"
az login

# Get Gemini API Key
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}🔑 Please enter your Gemini API Key:${NC}"
    read -s GEMINI_API_KEY
    export GEMINI_API_KEY
fi

# Initialize and apply Terraform
echo -e "${YELLOW}🏗️  Deploying Azure infrastructure with Terraform...${NC}"
cd $TERRAFORM_DIR

terraform init
terraform plan -var="gemini_api_key=$GEMINI_API_KEY"
terraform apply -var="gemini_api_key=$GEMINI_API_KEY" -auto-approve

# Get Terraform outputs
echo -e "${YELLOW}📤 Getting Terraform outputs...${NC}"
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
AKS_CLUSTER=$(terraform output -raw aks_cluster_name)
ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server)
STORAGE_ACCOUNT_NAME=$(terraform output -raw storage_account_name)
STORAGE_ACCOUNT_KEY=$(terraform output -raw storage_account_key)

cd ../..

# Configure kubectl
echo -e "${YELLOW}⚙️  Configuring kubectl...${NC}"
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_CLUSTER --overwrite-existing

# Create namespace
echo -e "${YELLOW}📦 Creating Kubernetes namespace...${NC}"
kubectl apply -f $K8S_DIR/namespace.yaml

# Create secrets
echo -e "${YELLOW}🔐 Creating Kubernetes secrets...${NC}"
kubectl create secret generic sih-secrets \
    --from-literal=gemini-api-key="$GEMINI_API_KEY" \
    --namespace=sih-solvers-compass \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic azure-storage-secret \
    --from-literal=azurestorageaccountname="$STORAGE_ACCOUNT_NAME" \
    --from-literal=azurestorageaccountkey="$STORAGE_ACCOUNT_KEY" \
    --namespace=sih-solvers-compass \
    --dry-run=client -o yaml | kubectl apply -f -

# Deploy ChromaDB
echo -e "${YELLOW}🗄️  Deploying ChromaDB...${NC}"
kubectl apply -f $K8S_DIR/chromadb.yaml

# Wait for ChromaDB to be ready
echo -e "${YELLOW}⏳ Waiting for ChromaDB to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/chromadb -n sih-solvers-compass

# Deploy Backend
echo -e "${YELLOW}🔧 Deploying Backend...${NC}"
kubectl apply -f $K8S_DIR/backend.yaml

# Wait for Backend to be ready
echo -e "${YELLOW}⏳ Waiting for Backend to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/backend -n sih-solvers-compass

# Deploy Frontend
echo -e "${YELLOW}🌐 Deploying Frontend...${NC}"
kubectl apply -f $K8S_DIR/frontend.yaml

# Wait for Frontend to be ready
echo -e "${YELLOW}⏳ Waiting for Frontend to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n sih-solvers-compass

# Get external IP
echo -e "${YELLOW}🌍 Getting external IP address...${NC}"
echo "Waiting for LoadBalancer to assign external IP..."
EXTERNAL_IP=""
while [ -z $EXTERNAL_IP ]; do
    echo "Waiting for external IP..."
    EXTERNAL_IP=$(kubectl get svc frontend-service -n sih-solvers-compass --template="{{range .status.loadBalancer.ingress}}{{.ip}}{{end}}")
    [ -z "$EXTERNAL_IP" ] && sleep 10
done

# Run data ingestion
echo -e "${YELLOW}📊 Running data ingestion...${NC}"
BACKEND_POD=$(kubectl get pods -n sih-solvers-compass -l app=backend -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n sih-solvers-compass $BACKEND_POD -- python scripts/ingest_data.py

# Deployment complete
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Application URL: http://$EXTERNAL_IP${NC}"
echo -e "${GREEN}✅ Backend API: http://$EXTERNAL_IP/api/docs${NC}"
echo -e "${GREEN}✅ Resource Group: $RESOURCE_GROUP${NC}"
echo -e "${GREEN}✅ AKS Cluster: $AKS_CLUSTER${NC}"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "  kubectl get pods -n sih-solvers-compass"
echo "  kubectl logs -f deployment/backend -n sih-solvers-compass"
echo "  kubectl logs -f deployment/frontend -n sih-solvers-compass"
echo ""
echo -e "${YELLOW}💡 To clean up resources, run:${NC}"
echo "  cd $TERRAFORM_DIR && terraform destroy"