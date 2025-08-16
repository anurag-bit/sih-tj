#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo -e "${RED}Error: Missing platform argument.${NC}"
    echo "Usage: ./scripts/destroy.sh [gcp|aws|azure]"
    exit 1
fi

PLATFORM=$1
TERRAFORM_DIR="../infrastructure/terraform-${PLATFORM}"
K8S_NAMESPACE="sih-solvers-compass"

echo -e "${BLUE}🚀 SIH Solver's Compass - One-Click Teardown for ${PLATFORM^^}${NC}"
echo "======================================================="

# --- Check Prerequisites ---
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if ! command -v terraform &> /dev/null || ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ Terraform or kubectl is not installed. Please install them first.${NC}"
    exit 1
fi

case $PLATFORM in
    gcp)
        if ! command -v gcloud &> /dev/null; then echo -e "${RED}❌ gcloud CLI not found!${NC}"; exit 1; fi
        echo -e "${GREEN}✅ gcloud CLI found.${NC}"
        ;;
    aws)
        if ! command -v aws &> /dev/null; then echo -e "${RED}❌ AWS CLI not found!${NC}"; exit 1; fi
        echo -e "${GREEN}✅ AWS CLI found.${NC}"
        ;;
    azure)
        if ! command -v az &> /dev/null; then echo -e "${RED}❌ Azure CLI not found!${NC}"; exit 1; fi
        echo -e "${GREEN}✅ Azure CLI found.${NC}"
        ;;
    *)
        echo -e "${RED}Error: Invalid platform '${PLATFORM}'. Use 'gcp', 'aws', or 'azure'.${NC}"
        exit 1
        ;;
esac
echo -e "${GREEN}✅ All prerequisites are installed${NC}"


# --- Configure Kubectl ---
echo -e "${YELLOW}⚙️  Configuring kubectl for ${PLATFORM^^}...${NC}"
cd $TERRAFORM_DIR
terraform init > /dev/null

case $PLATFORM in
    gcp)
        CLUSTER_NAME=$(terraform output -raw gke_cluster_name)
        REGION=$(terraform output -raw gcp_region)
        PROJECT_ID=$(terraform output -raw gcp_project_id)
        gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID
        ;;
    aws)
        CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
        REGION=$(terraform output -raw aws_region)
        aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION
        ;;
    azure)
        CLUSTER_NAME=$(terraform output -raw aks_cluster_name)
        RESOURCE_GROUP=$(terraform output -raw resource_group_name)
        az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --overwrite-existing
        ;;
esac
cd ../../
echo -e "${GREEN}✅ kubectl configured for cluster: ${CLUSTER_NAME}${NC}"


# --- Delete Kubernetes Namespace ---
echo -e "${YELLOW}🗑️  Deleting Kubernetes namespace '${K8S_NAMESPACE}'...${NC}"
if kubectl get namespace $K8S_NAMESPACE &> /dev/null; then
    kubectl delete namespace $K8S_NAMESPACE
    echo -e "${GREEN}✅ Namespace deleted.${NC}"
else
    echo -e "${YELLOW}ℹ️  Namespace '${K8S_NAMESPACE}' not found, skipping.${NC}"
fi


# --- Terraform Destroy ---
echo -e "${YELLOW}🔥 Destroying ${PLATFORM^^} infrastructure with Terraform...${NC}"
echo -e "${RED}This will permanently delete all cloud resources managed by Terraform.${NC}"
cd $TERRAFORM_DIR
terraform destroy -auto-approve
cd ../../

echo -e "${GREEN}🎉 Teardown for ${PLATFORM^^} completed successfully!${NC}"
echo "======================================================="
echo -e "${GREEN}✅ All ${PLATFORM^^} resources have been destroyed.${NC}"
