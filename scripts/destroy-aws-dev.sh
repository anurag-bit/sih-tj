#!/bin/bash

# SIH Solver's Compass - AWS DEV Cleanup Script
# This script safely destroys AWS DEV resources created by deploy-aws-dev.sh
#
# Usage: ./destroy-aws-dev.sh [options]
# Options:
#   --auto-approve  : Skip confirmation prompts
#   --plan-only     : Only show what would be destroyed
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
AUTO_APPROVE=false
PLAN_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-approve)
            AUTO_APPROVE=true
            shift
            ;;
        --plan-only)
            PLAN_ONLY=true
            shift
            ;;
        --help)
            echo -e "${BLUE}SIH Solver's Compass - AWS DEV Cleanup Script${NC}"
            echo "Usage: $0 [options]"
            echo ""
            echo -e "${YELLOW}Options:${NC}"
            echo "  --auto-approve  Skip confirmation prompts"
            echo "  --plan-only     Only show what would be destroyed"
            echo "  --help          Show this help message"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0                    # Interactive cleanup with confirmation"
            echo "  $0 --plan-only       # Show destroy plan without applying"
            echo "  $0 --auto-approve    # Cleanup without prompts (DANGEROUS!)"
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

echo -e "${RED}🔥 SIH Solver's Compass - AWS DEV Cleanup${NC}"
if [ "$PLAN_ONLY" = true ]; then
    echo -e "${BLUE}📋 Mode: Plan Only${NC}"
elif [ "$AUTO_APPROVE" = true ]; then
    echo -e "${YELLOW}⚡ Mode: Auto-Approve (DANGEROUS!)${NC}"
else
    echo -e "${GREEN}🔍 Mode: Interactive${NC}"
fi
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed.${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed.${NC}"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Check AWS login
echo -e "${YELLOW}🔐 Checking AWS login status...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Not logged into AWS. Please run 'aws configure' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Logged into AWS as: $(aws sts get-caller-identity --query "Arn" --output text)${NC}"

# Optional: Clean up Kubernetes resources first
echo -e "${YELLOW}🧹 Checking for Kubernetes resources to clean up...${NC}"
cd $TERRAFORM_DIR

# Check if Terraform state exists
if [ ! -f "terraform.tfstate" ]; then
    echo -e "${YELLOW}⚠️  No Terraform state found. Nothing to destroy.${NC}"
    exit 0
fi

# Try to get cluster name from Terraform state
EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name 2>/dev/null || echo "")
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")

if [ ! -z "$EKS_CLUSTER_NAME" ]; then
    echo -e "${BLUE}🗑️  Cleaning up Kubernetes resources from cluster: $EKS_CLUSTER_NAME${NC}"
    
    # Try to configure kubectl (might fail if cluster is already destroyed)
    if aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION 2>/dev/null; then
        echo -e "${YELLOW}📦 Deleting Kubernetes namespace and resources...${NC}"
        kubectl delete namespace sih-solvers-compass --ignore-not-found=true --timeout=60s
        echo -e "${GREEN}✅ Kubernetes resources cleaned up${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not connect to EKS cluster (may already be destroyed)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not determine EKS cluster name${NC}"
fi

# Terraform destroy with best practices
echo -e "${RED}🔥 Preparing to destroy AWS DEV infrastructure...${NC}"

# Initialize Terraform
echo -e "${BLUE}🔧 Initializing Terraform...${NC}"
terraform init

# Create destroy plan
echo -e "${BLUE}📋 Creating Terraform destroy plan...${NC}"
terraform plan -destroy -out=destroy-plan

# Show destroy plan summary
echo ""
echo -e "${RED}💥 Terraform Destroy Plan Summary:${NC}"
echo "====================================="
terraform show -no-color destroy-plan | head -30
echo "..."
echo "====================================="
echo ""

if [ "$PLAN_ONLY" = true ]; then
    echo -e "${GREEN}✅ Destroy plan created successfully. Exiting (plan-only mode).${NC}"
    rm -f destroy-plan
    exit 0
fi

# Final confirmation
if [ "$AUTO_APPROVE" = false ]; then
    echo -e "${RED}⚠️⚠️⚠️  DANGER: This will PERMANENTLY DELETE all AWS DEV resources! ⚠️⚠️⚠️${NC}"
    echo ""
    echo -e "${YELLOW}Resources that will be destroyed:${NC}"
    echo "  🗑️  EKS Cluster and worker nodes"
    echo "  🗑️  ECR repositories and Docker images"
    echo "  🗑️  Load Balancers and networking resources"
    echo "  🗑️  Security groups and IAM roles"
    echo "  🗑️  All application data and configurations"
    echo ""
    echo -e "${RED}This action cannot be undone!${NC}"
    echo ""
    read -p "Are you ABSOLUTELY SURE you want to DESTROY all resources? Type 'yes' to confirm: " -r
    if [[ ! $REPLY == "yes" ]]; then
        echo -e "${GREEN}✅ Destroy cancelled. Your resources are safe.${NC}"
        rm -f destroy-plan
        exit 0
    fi
    
    echo ""
    read -p "Last chance! Type 'DESTROY' in ALL CAPS to proceed: " -r
    if [[ ! $REPLY == "DESTROY" ]]; then
        echo -e "${GREEN}✅ Destroy cancelled. Your resources are safe.${NC}"
        rm -f destroy-plan
        exit 0
    fi
fi

# Apply destroy plan
echo -e "${RED}🔥 Destroying AWS DEV infrastructure...${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"

terraform apply destroy-plan

# Clean up plan file
rm -f destroy-plan

# Final cleanup
echo -e "${BLUE}🧹 Final cleanup...${NC}"

# Remove kubectl config context if it exists
if kubectl config get-contexts | grep -q "$EKS_CLUSTER_NAME" 2>/dev/null; then
    kubectl config delete-context "arn:aws:eks:$AWS_REGION:$(aws sts get-caller-identity --query Account --output text):cluster/$EKS_CLUSTER_NAME" 2>/dev/null || true
fi

cd ../..

echo ""
echo -e "${GREEN}🎉 AWS DEV Cleanup completed successfully!${NC}"
echo "============================================="
echo -e "${GREEN}✅ All AWS resources have been destroyed${NC}"
echo -e "${GREEN}✅ ECR repositories and images deleted${NC}"
echo -e "${GREEN}✅ EKS cluster and nodes terminated${NC}"
echo -e "${GREEN}✅ Kubernetes resources cleaned up${NC}"
echo -e "${GREEN}✅ kubectl context removed${NC}"
echo ""
echo -e "${BLUE}💡 Your AWS account should no longer incur charges from this deployment.${NC}"
echo -e "${YELLOW}📝 Note: Check your AWS console to verify all resources are deleted.${NC}"
echo "============================================="
