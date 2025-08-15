#!/bin/bash

# SIH Solver's Compass - One-Click AWS Teardown Script
# This script destroys the entire AWS deployment to save costs.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="../infrastructure/terraform-aws"
K8S_NAMESPACE="sih-solvers-compass"

echo -e "${BLUE}🚀 SIH Solver's Compass - One-Click AWS Teardown${NC}"
echo "======================================================"

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

# Change to Terraform directory
cd $TERRAFORM_DIR

# Initialize terraform to read state
echo -e "${YELLOW}Terraform init to read state...${NC}"
terraform init > /dev/null

# Get Terraform outputs from state
echo -e "${YELLOW}📤 Getting cluster information from Terraform state...${NC}"
EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
AWS_REGION=$(terraform output -raw aws_region)

cd ../../

# Configure kubectl
echo -e "${YELLOW}⚙️  Configuring kubectl for cluster: $EKS_CLUSTER_NAME...${NC}"
aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION

# Delete Kubernetes namespace
echo -e "${YELLOW}🗑️  Deleting Kubernetes namespace '${K8S_NAMESPACE}'...${NC}"
if kubectl get namespace $K8S_NAMESPACE &> /dev/null; then
    kubectl delete namespace $K8S_NAMESPACE
    echo -e "${GREEN}✅ Namespace deleted.${NC}"
else
    echo -e "${YELLOW}ℹ️  Namespace '${K8S_NAMESPACE}' not found, skipping.${NC}"
fi

# Destroy Terraform infrastructure
echo -e "${YELLOW}🔥 Destroying AWS infrastructure with Terraform...${NC}"
echo -e "${RED}This will permanently delete all AWS resources managed by Terraform.${NC}"
cd $TERRAFORM_DIR
terraform destroy -auto-approve

cd ../../

echo -e "${GREEN}🎉 Teardown completed successfully!${NC}"
echo "======================================================"
echo -e "${GREEN}✅ All AWS resources have been destroyed.${NC}"

