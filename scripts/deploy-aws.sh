#!/bin/bash

set -e

# Check for required tools
if ! command -v aws &> /dev/null || ! command -v terraform &> /dev/null || ! command -v kubectl &> /dev/null; then
    echo "Error: Required tools (aws, terraform, kubectl) are not installed."
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
  export $(echo $(cat .env | sed 's/#.*//g'| xargs) | envsubst)
fi

# Check for required environment variables
if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION is not set. Please set it in your .env file."
  exit 1
fi

# Configure AWS credentials if not already configured
aws configure set default.region $AWS_REGION
aws sts get-caller-identity

# ECR Login
echo "Logging in to AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# Terraform deployment with proper plan/apply workflow
echo "Initializing Terraform for AWS..."
cd infrastructure/terraform-aws

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
echo "📤 Retrieving Terraform outputs..."

ECR_REPO_URL=$(terraform output -raw ecr_repository_url)
EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)

cd ../..

# Image URLs
FRONTEND_IMAGE_URL="${ECR_REPO_URL}/frontend:latest"
BACKEND_IMAGE_URL="${ECR_REPO_URL}/backend:latest"

echo "--------------------------------------------------"
echo "AWS Region: $AWS_REGION"
echo "EKS Cluster: $EKS_CLUSTER_NAME"
echo "ECR Repository: $ECR_REPO_URL"
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

# Configure kubectl for EKS
echo "Configuring kubectl for EKS cluster..."
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION

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

echo "Waiting for frontend LoadBalancer to get an external hostname..."
echo "This may take a few minutes..."

LB_HOSTNAME=""
TIMEOUT=600  # 10 minutes timeout
SECONDS=0

while [ -z "$LB_HOSTNAME" ]; do
  LB_HOSTNAME=$(kubectl get svc frontend-service -n sih-solvers-compass -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
  if [ -z "$LB_HOSTNAME" ]; then
    if [ $SECONDS -gt $TIMEOUT ]; then
      echo "Error: Timed out waiting for external hostname."
      echo "Please check the service status manually with: kubectl get svc frontend-service -n sih-solvers-compass"
      exit 1
    fi
    sleep 15
    SECONDS=$((SECONDS + 15))
    echo "Still waiting..."
  fi
done

FRONTEND_URL="http://${LB_HOSTNAME}"

echo "--------------------------------------------------"
echo "✅ AWS Deployment Summary"
echo "--------------------------------------------------"
echo "AWS Region:       $AWS_REGION"
echo "EKS Cluster:      $EKS_CLUSTER_NAME"
echo ""
echo "🚀 Frontend URL: $FRONTEND_URL"
echo ""
echo "You can now access your application."
echo "--------------------------------------------------"