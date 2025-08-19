#!/bin/bash

# AWS Force Destroy Script
# This script helps clean up lingering AWS resources that can block
# 'terraform destroy', particularly VPC and EKS-related components.

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Configuration ---
# Get AWS region from .env file or use a default
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi
AWS_REGION=${AWS_REGION:-"us-east-1"}
VPC_NAME="sih-vpc" # The 'Name' tag of the VPC to destroy

# --- Helper Functions ---
print_status() {
    echo -e "${BLUE}🚀 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# --- Main Logic ---
main() {
    print_status "Starting AWS Force Destroy Script"
    echo "====================================="
    echo "Region: $AWS_REGION"
    echo "VPC Name: $VPC_NAME"
    echo

    # 1. Find the VPC ID
    print_status "Finding VPC ID for VPC with Name tag: $VPC_NAME..."
    VPC_ID=$(aws ec2 describe-vpcs --region $AWS_REGION \
        --filters "Name=tag:Name,Values=$VPC_NAME" \
        --query "Vpcs[0].VpcId" --output text)

    if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
        print_error "VPC with Name '$VPC_NAME' not found in region $AWS_REGION."
        print_warning "If you have already deleted the VPC, you can ignore this."
        exit 0
    fi
    print_success "Found VPC ID: $VPC_ID"
    echo

    # 2. Force delete EKS Node Groups and Clusters FIRST
    print_status "Finding and force-deleting EKS Node Groups and Clusters..."
    
    # Find EKS clusters in this region
    CLUSTER_NAMES=$(aws eks list-clusters --region $AWS_REGION --query "clusters" --output text)
    
    if [ -n "$CLUSTER_NAMES" ] && [ "$CLUSTER_NAMES" != "" ]; then
        for CLUSTER_NAME in $CLUSTER_NAMES; do
            print_warning "Found EKS Cluster: $CLUSTER_NAME"
            
            # Get cluster VPC to ensure it matches ours
            CLUSTER_VPC=$(aws eks describe-cluster --region $AWS_REGION --name $CLUSTER_NAME \
                --query "cluster.resourcesVpcConfig.vpcId" --output text 2>/dev/null || echo "")
            
            if [ "$CLUSTER_VPC" = "$VPC_ID" ]; then
                print_status "  -> This cluster belongs to our VPC. Finding node groups..."
                
                # Find and delete node groups
                NODE_GROUPS=$(aws eks list-nodegroups --region $AWS_REGION --cluster-name $CLUSTER_NAME \
                    --query "nodegroups" --output text 2>/dev/null || echo "")
                
                if [ -n "$NODE_GROUPS" ] && [ "$NODE_GROUPS" != "" ]; then
                    for NODE_GROUP in $NODE_GROUPS; do
                        print_status "  -> Force deleting node group: $NODE_GROUP"
                        aws eks delete-nodegroup --region $AWS_REGION \
                            --cluster-name $CLUSTER_NAME \
                            --nodegroup-name $NODE_GROUP || print_error "  -> Failed to delete node group"
                    done
                    print_warning "  -> Waiting for node groups to be deleted..."
                    sleep 30
                fi
                
                print_status "  -> Deleting EKS cluster: $CLUSTER_NAME"
                aws eks delete-cluster --region $AWS_REGION --name $CLUSTER_NAME || print_error "  -> Failed to delete cluster"
            fi
        done
        print_warning "Waiting 60 seconds for EKS resources to be cleaned up..."
        sleep 60
    else
        print_success "No EKS clusters found."
    fi
    echo

    # 3. Find and Delete Load Balancers and Target Groups
    print_status "Finding and deleting Load Balancers in VPC $VPC_ID..."
    LB_ARNS=$(aws elbv2 describe-load-balancers --region $AWS_REGION \
        --query "LoadBalancers[?VpcId=='$VPC_ID'].LoadBalancerArn" --output text)

    if [ -z "$LB_ARNS" ]; then
        print_success "No Load Balancers found to delete."
    else
        for LB_ARN in $LB_ARNS; do
            print_warning "Found Load Balancer: $LB_ARN"
            
            # Find and delete target groups associated with this LB
            print_status "  -> Finding Target Groups for this Load Balancer..."
            TG_ARNS=$(aws elbv2 describe-target-groups --region $AWS_REGION \
                --load-balancer-arn $LB_ARN \
                --query "TargetGroups[*].TargetGroupArn" --output text 2>/dev/null || echo "")
                
            if [ -n "$TG_ARNS" ] && [ "$TG_ARNS" != "" ]; then
                for TG_ARN in $TG_ARNS; do
                    print_status "  -> Deleting Target Group $TG_ARN..."
                    aws elbv2 delete-target-group --region $AWS_REGION --target-group-arn $TG_ARN || print_error "  -> Failed to delete Target Group."
                    print_success "  -> Successfully deleted Target Group."
                done
            fi

            print_status "  -> Deleting Load Balancer $LB_ARN..."
            aws elbv2 delete-load-balancer --region $AWS_REGION --load-balancer-arn $LB_ARN || print_error "  -> Failed to delete Load Balancer."
            print_success "  -> Successfully initiated deletion for Load Balancer."
        done
        print_warning "Waiting 60 seconds for Load Balancers to be fully deleted..."
        sleep 60
    fi
    echo

    # 4. Find and Delete NAT Gateways
    print_status "Finding and deleting NAT Gateways in VPC $VPC_ID..."
    NAT_GATEWAY_IDS=$(aws ec2 describe-nat-gateways --region $AWS_REGION \
        --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" \
        --query "NatGateways[*].NatGatewayId" --output text)

    if [ -z "$NAT_GATEWAY_IDS" ] || [ "$NAT_GATEWAY_IDS" = "" ]; then
        print_success "No NAT Gateways found to delete."
    else
        for NAT_GATEWAY_ID in $NAT_GATEWAY_IDS; do
            print_warning "Found NAT Gateway: $NAT_GATEWAY_ID"
            print_status "  -> Deleting NAT Gateway $NAT_GATEWAY_ID..."
            aws ec2 delete-nat-gateway --region $AWS_REGION --nat-gateway-id $NAT_GATEWAY_ID || print_error "  -> Failed to delete NAT Gateway."
            print_success "  -> Successfully initiated deletion for NAT Gateway."
        done
        print_warning "Waiting 30 seconds for NAT Gateways to be deleted..."
        sleep 30
    fi
    echo

    # 5. Find and Detach/Delete Network Interfaces (ENIs)
    print_status "Finding and deleting Network Interfaces in VPC $VPC_ID..."
    ENI_IDS=$(aws ec2 describe-network-interfaces --region $AWS_REGION \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query "NetworkInterfaces[*].NetworkInterfaceId" --output text)

    if [ -z "$ENI_IDS" ]; then
        print_success "No lingering Network Interfaces found."
    else
        for ENI_ID in $ENI_IDS; do
            print_warning "Found ENI: $ENI_ID"
            
            # Detach first if attached
            ATTACHMENT_ID=$(aws ec2 describe-network-interfaces --region $AWS_REGION \
                --network-interface-ids $ENI_ID \
                --query "NetworkInterfaces[0].Attachment.AttachmentId" --output text)

            if [ "$ATTACHMENT_ID" != "None" ]; then
                print_status "  -> Detaching ENI $ENI_ID (Attachment: $ATTACHMENT_ID)..."
                aws ec2 detach-network-interface --region $AWS_REGION --attachment-id $ATTACHMENT_ID --force || print_error "  -> Failed to detach. It might be in use or already detaching."
                # Wait for detachment
                sleep 15
            fi

            # Delete the ENI
            print_status "  -> Deleting ENI $ENI_ID..."
            aws ec2 delete-network-interface --region $AWS_REGION --network-interface-id $ENI_ID || print_error "  -> Failed to delete ENI. It might already be deleted or has dependencies."
            print_success "  -> Successfully initiated deletion for ENI $ENI_ID."
        done
    fi
    echo

    # 6. Find and Delete EKS-managed Security Groups
    print_status "Finding and deleting EKS-managed Security Groups in VPC $VPC_ID..."
    SG_IDS=$(aws ec2 describe-security-groups --region $AWS_REGION \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=*eks-cluster-sg*" \
        --query "SecurityGroups[*].GroupId" --output text)

    if [ -z "$SG_IDS" ]; then
        print_success "No EKS-managed Security Groups found to delete."
    else
        for SG_ID in $SG_IDS; do
            print_warning "Found EKS Security Group: $SG_ID"
            print_status "  -> Deleting Security Group $SG_ID..."
            aws ec2 delete-security-group --region $AWS_REGION --group-id $SG_ID || print_error "  -> Failed to delete Security Group. It might have dependent resources."
            print_success "  -> Successfully deleted Security Group $SG_ID."
        done
    fi
    echo

    print_success "Cleanup script finished!"
    print_warning "It may take a few minutes for all resources to be fully deleted."
    echo
    print_status "Now, try running 'terraform destroy' again in the 'infrastructure/terraform-aws' directory."
    echo "If it still fails, run this script again, as some resources take time to detach."
}

# Run the script
main
