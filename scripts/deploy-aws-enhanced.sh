#!/bin/bash

# Enhanced AWS Deployment Script with Terraform Best Practices
# Usage: ./deploy-aws-enhanced.sh [options]
# Options:
#   --plan-only     : Only create and show the Terraform plan
#   --auto-approve  : Skip confirmation prompts
#   --destroy       : Destroy infrastructure instead of creating
#   --skip-build    : Skip Docker image building
#   --help          : Show this help message

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
PLAN_ONLY=false
AUTO_APPROVE=false
DESTROY=false
SKIP_BUILD=false

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
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help)
            echo "Enhanced AWS Deployment Script"
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --plan-only     Only create and show the Terraform plan"
            echo "  --auto-approve  Skip confirmation prompts"
            echo "  --destroy       Destroy infrastructure instead of creating"
            echo "  --skip-build    Skip Docker image building"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Enhanced AWS Deployment Script${NC}"
echo "=================================="

# Check for required tools
echo -e "${YELLOW}🔍 Checking required tools...${NC}"
for tool in aws terraform kubectl docker; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}❌ Error: $tool is not installed.${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $tool found${NC}"
    fi
done

# Load environment variables from .env file
if [ -f .env ]; then
    echo -e "${BLUE}📄 Loading environment variables from .env file...${NC}"
    export $(echo $(cat .env | sed 's/#.*//g'| xargs) | envsubst)
fi

# Check for required environment variables
if [ -z "$AWS_REGION" ]; then
    echo -e "${RED}❌ Error: AWS_REGION is not set. Please set it in your .env file.${NC}"
    exit 1
fi

# Configure AWS credentials
echo -e "${BLUE}🔑 Configuring AWS credentials...${NC}"
aws configure set default.region $AWS_REGION

# Verify AWS credentials
echo -e "${YELLOW}🔐 Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: AWS credentials not configured or invalid.${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: $AWS_ACCOUNT_ID${NC}"

# Terraform operations
echo -e "${BLUE}🏗️  Terraform Operations${NC}"
echo "========================"
cd infrastructure/terraform-aws

# Initialize Terraform
echo -e "${YELLOW}🔧 Initializing Terraform...${NC}"
terraform init

if [ "$DESTROY" = true ]; then
    echo -e "${RED}⚠️  DESTROY MODE - This will delete all infrastructure!${NC}"
    
    # Create destroy plan
    terraform plan -destroy -out=destroy-plan
    
    if [ "$AUTO_APPROVE" = false ]; then
        echo ""
        read -p "Are you ABSOLUTELY SURE you want to DESTROY all infrastructure? Type 'yes' to confirm: " -r
        if [[ ! $REPLY == "yes" ]]; then
            echo -e "${YELLOW}❌ Destroy cancelled by user.${NC}"
            rm -f destroy-plan
            exit 1
        fi
    fi
    
    # Apply destroy plan
    echo -e "${RED}🔥 Destroying infrastructure...${NC}"
    terraform apply destroy-plan
    rm -f destroy-plan
    
    echo -e "${GREEN}✅ Infrastructure destroyed successfully.${NC}"
    exit 0
else
    # Create execution plan
    echo -e "${YELLOW}📋 Creating Terraform execution plan...${NC}"
    terraform plan -out=tfplan
    
    # Show plan summary
    echo ""
    echo -e "${BLUE}📊 Terraform Plan Summary:${NC}"
    echo "=================================="
    terraform show -no-color tfplan | head -30
    echo "..."
    echo "=================================="
    echo ""
    
    if [ "$PLAN_ONLY" = true ]; then
        echo -e "${GREEN}✅ Plan created successfully. Exiting (plan-only mode).${NC}"
        rm -f tfplan
        exit 0
    fi
    
    # Confirmation prompt
    if [ "$AUTO_APPROVE" = false ]; then
        read -p "Do you want to apply this Terraform plan? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}❌ Deployment cancelled by user.${NC}"
            rm -f tfplan
            exit 1
        fi
    fi
    
    # Apply the saved plan
    echo -e "${GREEN}🚀 Applying Terraform configuration...${NC}"
    terraform apply tfplan
    
    # Clean up plan file
    rm -f tfplan
fi

# Get Terraform outputs
echo -e "${BLUE}📤 Retrieving Terraform outputs...${NC}"
ECR_REPO_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")
EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name 2>/dev/null || echo "")

if [ -z "$ECR_REPO_URL" ] || [ -z "$EKS_CLUSTER_NAME" ]; then
    echo -e "${RED}❌ Error: Could not retrieve Terraform outputs.${NC}"
    exit 1
fi

cd ../..

# ECR Login
echo -e "${BLUE}🔑 Logging in to AWS ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URL

# Image URLs
FRONTEND_IMAGE_URL="${ECR_REPO_URL}:frontend-latest"
BACKEND_IMAGE_URL="${ECR_REPO_URL}:backend-latest"

echo ""
echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "============================="
echo "AWS Region:       $AWS_REGION"
echo "AWS Account:      $AWS_ACCOUNT_ID"
echo "EKS Cluster:      $EKS_CLUSTER_NAME"
echo "ECR Repository:   $ECR_REPO_URL"
echo "Frontend Image:   $FRONTEND_IMAGE_URL"
echo "Backend Image:    $BACKEND_IMAGE_URL"
echo "============================="

if [ "$SKIP_BUILD" = false ]; then
    # Build and push Docker images
    echo -e "${BLUE}🐳 Building and pushing Docker images...${NC}"
    
    echo -e "${YELLOW}📦 Building frontend image...${NC}"
    docker build -t ${FRONTEND_IMAGE_URL} ./frontend
    echo -e "${YELLOW}📤 Pushing frontend image...${NC}"
    docker push ${FRONTEND_IMAGE_URL}
    
    echo -e "${YELLOW}📦 Building backend image...${NC}"
    docker build -t ${BACKEND_IMAGE_URL} ./backend
    echo -e "${YELLOW}📤 Pushing backend image...${NC}"
    docker push ${BACKEND_IMAGE_URL}
else
    echo -e "${YELLOW}⏭️  Skipping Docker image building (--skip-build)${NC}"
fi

# Configure kubectl for EKS
echo -e "${BLUE}⚙️  Configuring kubectl for EKS cluster...${NC}"
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION

# Update Kubernetes manifests with image URLs
echo -e "${YELLOW}📝 Updating Kubernetes manifests...${NC}"
# Create backup of original manifests
cp infrastructure/k8s/frontend.yaml infrastructure/k8s/frontend.yaml.bak
cp infrastructure/k8s/backend.yaml infrastructure/k8s/backend.yaml.bak

sed -i "s|image: .*frontend.*|image: ${FRONTEND_IMAGE_URL}|g" infrastructure/k8s/frontend.yaml
sed -i "s|image: .*backend.*|image: ${BACKEND_IMAGE_URL}|g" infrastructure/k8s/backend.yaml

# Apply Kubernetes manifests
echo -e "${BLUE}☸️  Applying Kubernetes manifests...${NC}"
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/secrets.yaml
kubectl apply -f infrastructure/k8s/chromadb.yaml
kubectl apply -f infrastructure/k8s/backend.yaml
kubectl apply -f infrastructure/k8s/frontend.yaml

# Wait for LoadBalancer
echo -e "${YELLOW}⏳ Waiting for frontend LoadBalancer to get external hostname...${NC}"
echo "This may take a few minutes..."

LB_HOSTNAME=""
TIMEOUT=600  # 10 minutes timeout
SECONDS=0

while [ -z "$LB_HOSTNAME" ]; do
    LB_HOSTNAME=$(kubectl get svc frontend-service -n sih-solvers-compass -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
    if [ -z "$LB_HOSTNAME" ]; then
        if [ $SECONDS -gt $TIMEOUT ]; then
            echo -e "${RED}❌ Error: Timed out waiting for external hostname.${NC}"
            echo "Please check the service status manually with:"
            echo "kubectl get svc frontend-service -n sih-solvers-compass"
            exit 1
        fi
        sleep 15
        SECONDS=$((SECONDS + 15))
        echo -e "${YELLOW}⏳ Still waiting... ($SECONDS/$TIMEOUT seconds)${NC}"
    fi
done

FRONTEND_URL="http://${LB_HOSTNAME}"

# Final summary
echo ""
echo -e "${GREEN}🎉 AWS Deployment Complete!${NC}"
echo "============================"
echo -e "${BLUE}AWS Region:${NC}       $AWS_REGION"
echo -e "${BLUE}EKS Cluster:${NC}      $EKS_CLUSTER_NAME"
echo -e "${BLUE}Frontend URL:${NC}     $FRONTEND_URL"
echo ""
echo -e "${GREEN}✅ Your application is now accessible at: $FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "kubectl get pods -n sih-solvers-compass"
echo "kubectl logs -f deployment/backend-deployment -n sih-solvers-compass"
echo "kubectl logs -f deployment/frontend-deployment -n sih-solvers-compass"
echo "============================"

# Restore original manifests
mv infrastructure/k8s/frontend.yaml.bak infrastructure/k8s/frontend.yaml
mv infrastructure/k8s/backend.yaml.bak infrastructure/k8s/backend.yaml
