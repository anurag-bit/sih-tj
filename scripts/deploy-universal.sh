#!/bin/bash

# Universal Cloud Deployment Script with Terraform Best Practices
# Usage: ./deploy-universal.sh [cloud] [options]
# 
# Clouds: aws, azure, gcp
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
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default options
CLOUD_PROVIDER=""
PLAN_ONLY=false
AUTO_APPROVE=false
DESTROY=false
SKIP_BUILD=false

# Function to show usage
show_usage() {
    echo -e "${BLUE}Universal Cloud Deployment Script${NC}"
    echo "Usage: $0 [cloud] [options]"
    echo ""
    echo -e "${YELLOW}Supported Clouds:${NC}"
    echo "  aws     Deploy to Amazon Web Services"
    echo "  azure   Deploy to Microsoft Azure"
    echo "  gcp     Deploy to Google Cloud Platform"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --plan-only     Only create and show the Terraform plan"
    echo "  --auto-approve  Skip confirmation prompts"
    echo "  --destroy       Destroy infrastructure instead of creating"
    echo "  --skip-build    Skip Docker image building"
    echo "  --help          Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 aws                    # Interactive AWS deployment"
    echo "  $0 aws --plan-only        # Show AWS plan without applying"
    echo "  $0 azure --auto-approve   # Deploy to Azure without prompts"
    echo "  $0 gcp --destroy          # Destroy GCP infrastructure"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

# First argument should be cloud provider
case $1 in
    aws|azure|gcp)
        CLOUD_PROVIDER=$1
        shift
        ;;
    --help)
        show_usage
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Error: Unknown cloud provider '$1'${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

# Parse remaining options
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
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Error: Unknown option '$1'${NC}"
            exit 1
            ;;
    esac
done

echo -e "${PURPLE}🌐 Universal Cloud Deployment Script${NC}"
echo -e "${BLUE}Target Cloud: ${YELLOW}$CLOUD_PROVIDER${NC}"
echo "======================================"

# Function to run Terraform with best practices
run_terraform() {
    local tf_dir=$1
    local cloud_name=$2
    
    echo -e "${BLUE}🏗️  Terraform Operations for $cloud_name${NC}"
    echo "========================"
    cd $tf_dir
    
    # Initialize Terraform
    echo -e "${YELLOW}🔧 Initializing Terraform...${NC}"
    terraform init
    
    if [ "$DESTROY" = true ]; then
        echo -e "${RED}⚠️  DESTROY MODE - This will delete all $cloud_name infrastructure!${NC}"
        
        # Create destroy plan
        terraform plan -destroy -out=destroy-plan
        
        if [ "$AUTO_APPROVE" = false ]; then
            echo ""
            read -p "Are you ABSOLUTELY SURE you want to DESTROY all $cloud_name infrastructure? Type 'yes' to confirm: " -r
            if [[ ! $REPLY == "yes" ]]; then
                echo -e "${YELLOW}❌ Destroy cancelled by user.${NC}"
                rm -f destroy-plan
                return 1
            fi
        fi
        
        # Apply destroy plan
        echo -e "${RED}🔥 Destroying $cloud_name infrastructure...${NC}"
        terraform apply destroy-plan
        rm -f destroy-plan
        
        echo -e "${GREEN}✅ $cloud_name infrastructure destroyed successfully.${NC}"
        return 0
    else
        # Create execution plan
        echo -e "${YELLOW}📋 Creating Terraform execution plan for $cloud_name...${NC}"
        terraform plan -out=tfplan
        
        # Show plan summary
        echo ""
        echo -e "${BLUE}📊 Terraform Plan Summary for $cloud_name:${NC}"
        echo "=================================="
        terraform show -no-color tfplan | head -30
        echo "..."
        echo "=================================="
        echo ""
        
        if [ "$PLAN_ONLY" = true ]; then
            echo -e "${GREEN}✅ Plan created successfully. Exiting (plan-only mode).${NC}"
            rm -f tfplan
            return 0
        fi
        
        # Confirmation prompt
        if [ "$AUTO_APPROVE" = false ]; then
            read -p "Do you want to apply this $cloud_name Terraform plan? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}❌ Deployment cancelled by user.${NC}"
                rm -f tfplan
                return 1
            fi
        fi
        
        # Apply the saved plan
        echo -e "${GREEN}🚀 Applying Terraform configuration for $cloud_name...${NC}"
        terraform apply tfplan
        
        # Clean up plan file
        rm -f tfplan
    fi
}

# Check for required tools based on cloud provider
check_tools() {
    local cloud=$1
    echo -e "${YELLOW}🔍 Checking required tools for $cloud...${NC}"
    
    # Common tools
    for tool in terraform kubectl docker; do
        if ! command -v $tool &> /dev/null; then
            echo -e "${RED}❌ Error: $tool is not installed.${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ $tool found${NC}"
        fi
    done
    
    # Cloud-specific tools
    case $cloud in
        aws)
            if ! command -v aws &> /dev/null; then
                echo -e "${RED}❌ Error: AWS CLI is not installed.${NC}"
                exit 1
            else
                echo -e "${GREEN}✅ AWS CLI found${NC}"
            fi
            ;;
        azure)
            if ! command -v az &> /dev/null; then
                echo -e "${RED}❌ Error: Azure CLI is not installed.${NC}"
                exit 1
            else
                echo -e "${GREEN}✅ Azure CLI found${NC}"
            fi
            ;;
        gcp)
            if ! command -v gcloud &> /dev/null; then
                echo -e "${RED}❌ Error: Google Cloud SDK is not installed.${NC}"
                exit 1
            else
                echo -e "${GREEN}✅ Google Cloud SDK found${NC}"
            fi
            ;;
    esac
}

# Load environment variables
echo -e "${BLUE}📄 Loading environment variables...${NC}"
if [ -f .env ]; then
    export $(echo $(cat .env | sed 's/#.*//g'| xargs) | envsubst)
else
    echo -e "${YELLOW}⚠️  Warning: .env file not found. Some environment variables may be missing.${NC}"
fi

# Check tools for the selected cloud
check_tools $CLOUD_PROVIDER

# Exit if in destroy mode and plan completed
if [ "$DESTROY" = true ]; then
    case $CLOUD_PROVIDER in
        aws)
            run_terraform "infrastructure/terraform-aws" "AWS"
            ;;
        azure)
            run_terraform "infrastructure/terraform-azure" "Azure"
            ;;
        gcp)
            run_terraform "infrastructure/terraform-gcp" "GCP"
            ;;
    esac
    exit 0
fi

# Cloud-specific deployment logic
case $CLOUD_PROVIDER in
    aws)
        echo -e "${BLUE}☁️  Deploying to Amazon Web Services${NC}"
        
        # Check AWS-specific env vars
        if [ -z "$AWS_REGION" ]; then
            echo -e "${RED}❌ Error: AWS_REGION is not set. Please set it in your .env file.${NC}"
            exit 1
        fi
        
        # Configure AWS
        aws configure set default.region $AWS_REGION
        if ! aws sts get-caller-identity > /dev/null 2>&1; then
            echo -e "${RED}❌ Error: AWS credentials not configured or invalid.${NC}"
            exit 1
        fi
        
        # Run Terraform for AWS
        run_terraform "infrastructure/terraform-aws" "AWS"
        
        if [ "$PLAN_ONLY" = true ]; then
            exit 0
        fi
        
        # Get AWS outputs
        cd infrastructure/terraform-aws
        ECR_REPO_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")
        EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name 2>/dev/null || echo "")
        cd ../..
        
        if [ -z "$ECR_REPO_URL" ] || [ -z "$EKS_CLUSTER_NAME" ]; then
            echo -e "${RED}❌ Error: Could not retrieve AWS Terraform outputs.${NC}"
            exit 1
        fi
        
        # AWS-specific deployment continues...
        echo -e "${GREEN}✅ AWS infrastructure deployed successfully!${NC}"
        echo "ECR Repository: $ECR_REPO_URL"
        echo "EKS Cluster: $EKS_CLUSTER_NAME"
        ;;
        
    azure)
        echo -e "${BLUE}☁️  Deploying to Microsoft Azure${NC}"
        
        # Check Azure-specific env vars
        if [ -z "$AZURE_LOCATION" ]; then
            echo -e "${RED}❌ Error: AZURE_LOCATION is not set. Please set it in your .env file.${NC}"
            exit 1
        fi
        
        # Azure login
        echo -e "${BLUE}🔑 Logging in to Azure...${NC}"
        az login --use-device-code
        
        # Run Terraform for Azure
        run_terraform "infrastructure/terraform-azure" "Azure"
        
        if [ "$PLAN_ONLY" = true ]; then
            exit 0
        fi
        
        echo -e "${GREEN}✅ Azure infrastructure deployed successfully!${NC}"
        ;;
        
    gcp)
        echo -e "${BLUE}☁️  Deploying to Google Cloud Platform${NC}"
        
        # Check GCP-specific env vars
        if [ -z "$GCP_PROJECT_ID" ]; then
            echo -e "${RED}❌ Error: GCP_PROJECT_ID is not set. Please set it in your .env file.${NC}"
            exit 1
        fi
        
        # GCP authentication
        echo -e "${BLUE}🔑 Authenticating with Google Cloud...${NC}"
        gcloud auth login
        gcloud config set project $GCP_PROJECT_ID
        
        # Run Terraform for GCP
        run_terraform "infrastructure/terraform-gcp" "GCP"
        
        if [ "$PLAN_ONLY" = true ]; then
            exit 0
        fi
        
        echo -e "${GREEN}✅ GCP infrastructure deployed successfully!${NC}"
        ;;
esac

echo ""
echo -e "${PURPLE}🎉 Deployment Complete!${NC}"
echo "======================"
echo -e "${BLUE}Cloud Provider:${NC} $CLOUD_PROVIDER"
echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
if [ "$SKIP_BUILD" = true ]; then
    echo -e "${YELLOW}⏭️  Docker builds were skipped${NC}"
fi
echo "======================"
