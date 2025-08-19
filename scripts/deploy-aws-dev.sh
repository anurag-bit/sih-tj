#!/bin/bash

# SIH Solver's Compass - One-Click AWS DEV Deployment Script
# This script deploys a lightweight, free-tier friendly version of the application to AWS for development and testing.
#
# Usage: ./deploy-aws-dev.sh [options]
# Options:
#   --plan-only     : Only create and show the Terraform plan
#   --auto-approve  : Skip confirmation prompts
#   --skip-build    : Skip Docker image building
#   --help          : Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default options
PLAN_ONLY=false
AUTO_APPROVE=false
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
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help)
            echo -e "${BLUE}SIH Solver's Compass - AWS DEV Deployment Script${NC}"
            echo "Usage: $0 [options]"
            echo ""
            echo -e "${YELLOW}Options:${NC}"
            echo "  --plan-only     Only create and show the Terraform plan"
            echo "  --auto-approve  Skip confirmation prompts"
            echo "  --skip-build    Skip Docker image building"
            echo "  --help          Show this help message"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0                    # Interactive DEV deployment"
            echo "  $0 --plan-only       # Show DEV plan without applying"
            echo "  $0 --auto-approve    # Deploy DEV without prompts"
            echo "  $0 --skip-build      # Skip Docker builds"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option $1${NC}"
            exit 1
            ;;
    esac
done

# Configuration
TERRAFORM_DIR="../infrastructure/terraform-aws"
K8S_DIR="../infrastructure/k8s"

echo -e "${PURPLE}🚀 SIH Solver's Compass - AWS DEV Deployment${NC}"
if [ "$PLAN_ONLY" = true ]; then
    echo -e "${BLUE}📋 Mode: Plan Only${NC}"
elif [ "$AUTO_APPROVE" = true ]; then
    echo -e "${YELLOW}⚡ Mode: Auto-Approve${NC}"
else
    echo -e "${GREEN}🔍 Mode: Interactive${NC}"
fi
echo "========================================================"

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

# Get required API Keys
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${YELLOW}🔑 Please enter your OpenRouter API Key:${NC}"
    read -s OPENROUTER_API_KEY
    export OPENROUTER_API_KEY
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}🔑 Please enter your Gemini API Key (optional, press Enter to skip):${NC}"
    read -s GEMINI_API_KEY
    export GEMINI_API_KEY
fi

# Initialize and apply Terraform with best practices
echo -e "${YELLOW}🏗️  Deploying DEV AWS infrastructure with Terraform...${NC}"
cd $TERRAFORM_DIR

# Initialize Terraform
echo -e "${BLUE}🔧 Initializing Terraform...${NC}"
terraform init

# Create Terraform plan with DEV-specific variables
echo -e "${BLUE}📋 Creating Terraform execution plan for DEV environment...${NC}"
terraform plan \
    -var="OPENROUTER_API_KEY=$OPENROUTER_API_KEY" \
    -var="GEMINI_API_KEY=${GEMINI_API_KEY:-}" \
    -var='instance_types=["t3.micro"]' \
    -var=desired_size=1 \
    -var=max_size=1 \
    -var=min_size=1 \
    -out=tfplan-dev

# Show plan summary
echo ""
echo -e "${BLUE}📊 Terraform Plan Summary for DEV:${NC}"
echo "=================================="
echo "Instance Types: t3.micro (Free Tier)"
echo "Node Count: 1 (min: 1, max: 1)"
echo "Environment: Development"
echo "=================================="
terraform show -no-color tfplan-dev | head -20
echo "..."
echo "=================================="
echo ""

if [ "$PLAN_ONLY" = true ]; then
    echo -e "${GREEN}✅ DEV Plan created successfully. Exiting (plan-only mode).${NC}"
    rm -f tfplan-dev
    exit 0
fi

# Confirmation prompt
if [ "$AUTO_APPROVE" = false ]; then
    echo -e "${YELLOW}⚠️  This will create AWS resources that may incur charges.${NC}"
    echo -e "${BLUE}📝 DEV Configuration:${NC}"
    echo "  - 1x t3.micro EKS worker node (Free Tier eligible)"
    echo "  - ECR repositories for Docker images"
    echo "  - Application Load Balancer"
    echo ""
    read -p "Do you want to apply this DEV Terraform plan? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Deployment cancelled by user.${NC}"
        rm -f tfplan-dev
        exit 1
    fi
fi

# Apply the saved plan
echo -e "${GREEN}🚀 Applying Terraform configuration for DEV...${NC}"
terraform apply tfplan-dev

# Clean up plan file
rm -f tfplan-dev

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
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}🐳 Building and pushing Docker images to ECR...${NC}"
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_BACKEND_URL

    echo -e "${BLUE}📦 Building backend image...${NC}"
    docker build -t $ECR_BACKEND_URL:latest ./backend
    echo -e "${BLUE}📤 Pushing backend image...${NC}"
    docker push $ECR_BACKEND_URL:latest

    echo -e "${BLUE}📦 Building frontend image...${NC}"
    docker build -t $ECR_FRONTEND_URL:latest ./frontend
    echo -e "${BLUE}📤 Pushing frontend image...${NC}"
    docker push $ECR_FRONTEND_URL:latest
    
    echo -e "${GREEN}✅ Docker images built and pushed successfully${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping Docker image building (--skip-build)${NC}"
    echo -e "${BLUE}ℹ️  Using existing images: $ECR_BACKEND_URL:latest and $ECR_FRONTEND_URL:latest${NC}"
fi

# Create namespace
echo -e "${YELLOW}📦 Creating Kubernetes namespace...${NC}"
kubectl apply -f $K8S_DIR/namespace.yaml

# Create secrets
echo -e "${YELLOW}🔐 Creating Kubernetes secrets...${NC}"
kubectl create secret generic sih-secrets \
    --from-literal=openrouter-api-key="$OPENROUTER_API_KEY" \
    --from-literal=gemini-api-key="${GEMINI_API_KEY:-}" \
    --from-literal=github-token="${GITHUB_TOKEN:-}" \
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
sed -i "/type: LoadBalancer/a\\ 	annotations:\\n    $ANNOTATION" $FRONTEND_MANIFEST_TMP

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
echo ""
echo -e "${GREEN}🎉 AWS DEV Deployment completed successfully!${NC}"
echo "===================================================="
echo -e "${PURPLE}📋 Deployment Summary:${NC}"
echo -e "${GREEN}✅ Application URL:${NC}     http://$EXTERNAL_HOSTNAME"
echo -e "${GREEN}✅ Backend API:${NC}         http://$EXTERNAL_HOSTNAME/api/docs"  
echo -e "${GREEN}✅ EKS Cluster:${NC}         $EKS_CLUSTER_NAME"
echo -e "${GREEN}✅ AWS Region:${NC}          $AWS_REGION"
echo -e "${GREEN}✅ Backend Image:${NC}       $ECR_BACKEND_URL:latest"
echo -e "${GREEN}✅ Frontend Image:${NC}      $ECR_FRONTEND_URL:latest"

if [ "$SKIP_BUILD" = true ]; then
    echo -e "${YELLOW}⚠️  Docker builds were skipped${NC}"
fi

echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "  kubectl get pods -n sih-solvers-compass              # Check pod status"
echo "  kubectl logs -f deployment/backend -n sih-solvers-compass  # Backend logs"
echo "  kubectl logs -f deployment/frontend -n sih-solvers-compass # Frontend logs"
echo "  kubectl get svc -n sih-solvers-compass               # Check services"

echo ""
echo -e "${YELLOW}💡 To clean up DEV resources, run:${NC}"
echo "  cd infrastructure/terraform-aws && terraform destroy"
echo "===================================================="