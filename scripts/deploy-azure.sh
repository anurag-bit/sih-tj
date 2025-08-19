#!/bin/bash

set -e

# Check for required tools
if ! command -v az &> /dev/null || ! command -v terraform &> /dev/null || ! command -v kubectl &> /dev/null; then
    echo "Error: Required tools (az, terraform, kubectl) are not installed."
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
  export $(echo $(cat .env | sed 's/#.*//g'| xargs) | envsubst)
fi

# Check for required environment variables
if [ -z "$AZURE_LOCATION" ]; then
  echo "Error: AZURE_LOCATION is not set. Please set it in your .env file."
  exit 1
fi
if [ -z "$AZURE_RESOURCE_GROUP" ]; then
  echo "Error: AZURE_RESOURCE_GROUP is not set. Please set it in your .env file."
  exit 1
fi

# Login to Azure
echo "Logging in to Azure..."
az login --use-device-code

# Terraform deployment with proper plan/apply workflow
echo "Initializing Terraform for Azure..."
cd infrastructure/terraform-azure

# Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

# Generate and save execution plan
echo "📋 Creating Terraform execution plan..."
terraform plan -out=tfplan

# Show plan summary
echo ""
echo "📊 Terraform Plan Summary:"
echo "=================================="
terraform show -no-color tfplan | head -20
echo "=================================="
echo ""

# Confirmation prompt
read -p "Do you want to apply this Terraform plan? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled by user."
    rm -f tfplan
    exit 1
fi

# Apply the saved plan
echo "🚀 Applying Terraform configuration..."
terraform apply tfplan

# Clean up plan file
rm -f tfplan

# Get outputs
echo "📤 Retrieving Terraform outputs..." \
  -var="resource_group_name=${AZURE_RESOURCE_GROUP}" \
  -var="location=${AZURE_LOCATION}"

ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server)
AKS_CLUSTER_NAME=$(terraform output -raw aks_cluster_name)
RESOURCE_GROUP_NAME=$(terraform output -raw resource_group_name)

cd ../..

# Login to ACR
echo "Logging in to Azure Container Registry..."
az acr login --name $(echo $ACR_LOGIN_SERVER | cut -d. -f1)

# Image URLs
FRONTEND_IMAGE_URL="${ACR_LOGIN_SERVER}/frontend:latest"
BACKEND_IMAGE_URL="${ACR_LOGIN_SERVER}/backend:latest"

echo "--------------------------------------------------"
echo "Azure Location: $AZURE_LOCATION"
echo "Azure Resource Group: $RESOURCE_GROUP_NAME"
echo "AKS Cluster: $AKS_CLUSTER_NAME"
echo "ACR: $ACR_LOGIN_SERVER"
echo "Frontend Image: $FRONTEND_IMAGE_URL"
echo "Backend Image: $BACKEND_IMAGE_URL"
echo "--------------------------------------------------"

# Build and push Docker images
echo "Building and pushing frontend image..."
docker build -t ${FRONTEND_IMAGE_URL} ./frontend
docker push ${FRONTEND_IMAGE_URL}

echo "Building and pushing backend image..."
docker build -t ${BACKEND_IMAGE_URL} ./backend
docker push ${BACKEND_IMAGE_URL}

# Configure kubectl for AKS
echo "Configuring kubectl for AKS cluster..."
az aks get-credentials --resource-group $RESOURCE_GROUP_NAME --name $AKS_CLUSTER_NAME --overwrite-existing

# Update Kubernetes manifests
echo "Updating Kubernetes manifests with new image URLs..."
sed -i "s|image: .*frontend.*|image: ${FRONTEND_IMAGE_URL}|g" infrastructure/k8s/frontend.yaml
sed -i "s|image: .*backend.*|image: ${BACKEND_IMAGE_URL}|g" infrastructure/k8s/backend.yaml

# Apply Kubernetes manifests
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
echo "✅ Azure Deployment Summary"
echo "--------------------------------------------------"
echo "Azure Location:       $AZURE_LOCATION"
echo "Resource Group:       $RESOURCE_GROUP_NAME"
echo "AKS Cluster:          $AKS_CLUSTER_NAME"
echo ""
echo "🚀 Frontend URL: $FRONTEND_URL"
echo ""
echo "You can now access your application."
echo "--------------------------------------------------"
