#!/bin/bash

# SIH Solver's Compass - FinOps Cost Analysis Script
# This script provides detailed cost analysis and optimization recommendations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

TERRAFORM_DIR="infrastructure/terraform"

echo -e "${BLUE}💰 SIH Solver's Compass - FinOps Cost Analysis${NC}"
echo "=================================================="

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Configuration options
echo -e "${YELLOW}📋 Configuration Options:${NC}"
echo "1. Production (Standard_D2s_v3, 2 nodes) - Recommended"
echo "2. Staging (Standard_D2s_v3, 1 node) - Cost optimized"
echo "3. Development (Standard_B2s, 1 node) - Minimal cost"
echo "4. Custom configuration"
echo ""

read -p "Select configuration (1-4): " config_choice

case $config_choice in
    1)
        VM_SIZE="Standard_D2s_v3"
        NODE_COUNT=2
        ENVIRONMENT="production"
        ;;
    2)
        VM_SIZE="Standard_D2s_v3"
        NODE_COUNT=1
        ENVIRONMENT="staging"
        ;;
    3)
        VM_SIZE="Standard_B2s"
        NODE_COUNT=1
        ENVIRONMENT="development"
        ;;
    4)
        echo -e "${CYAN}Available VM sizes:${NC}"
        echo "- Standard_B2s (2 vCPU, 4GB RAM) - Burstable, lowest cost"
        echo "- Standard_D2s_v3 (2 vCPU, 8GB RAM) - General purpose"
        echo "- Standard_D4s_v3 (4 vCPU, 16GB RAM) - High performance"
        echo ""
        read -p "Enter VM size: " VM_SIZE
        read -p "Enter number of nodes: " NODE_COUNT
        read -p "Enter environment (dev/staging/prod): " ENVIRONMENT
        ;;
    *)
        echo -e "${RED}Invalid choice. Using production defaults.${NC}"
        VM_SIZE="Standard_D2s_v3"
        NODE_COUNT=2
        ENVIRONMENT="production"
        ;;
esac

echo -e "${YELLOW}🔧 Analyzing costs for:${NC}"
echo "  VM Size: $VM_SIZE"
echo "  Node Count: $NODE_COUNT"
echo "  Environment: $ENVIRONMENT"
echo ""

# Create temporary tfvars file
TEMP_TFVARS=$(mktemp)
cat > $TEMP_TFVARS << EOF
vm_size = "$VM_SIZE"
node_count = $NODE_COUNT
environment = "$ENVIRONMENT"
gemini_api_key = "dummy-key-for-cost-analysis"
monthly_budget_limit = 300
budget_alert_emails = ["admin@example.com"]
enable_cost_optimization = true
environment_tier = "$ENVIRONMENT"
EOF

cd $TERRAFORM_DIR

# Initialize Terraform
echo -e "${YELLOW}🔄 Initializing Terraform...${NC}"
terraform init -input=false > /dev/null 2>&1

# Run Terraform plan to get cost estimates
echo -e "${YELLOW}📊 Calculating infrastructure costs...${NC}"
terraform plan -var-file="$TEMP_TFVARS" -input=false > /dev/null 2>&1

# Get cost analysis outputs (simulated since we can't actually apply)
echo -e "${GREEN}💰 FINOPS COST ANALYSIS RESULTS${NC}"
echo "=================================================="

# Calculate costs using the same logic as in finops.tf
case $VM_SIZE in
    "Standard_D2s_v3")
        VM_HOURLY_RATE=0.096
        ;;
    "Standard_D4s_v3")
        VM_HOURLY_RATE=0.192
        ;;
    "Standard_B2s")
        VM_HOURLY_RATE=0.0416
        ;;
    *)
        VM_HOURLY_RATE=0.096  # Default
        ;;
esac

HOURS_PER_MONTH=730
VM_MONTHLY_COST=$(echo "$VM_HOURLY_RATE * $NODE_COUNT * $HOURS_PER_MONTH" | bc -l)
STORAGE_MONTHLY_COST=1.04  # 50GB * $0.0208
ACR_MONTHLY_COST=20.00     # Standard ACR
NETWORK_MONTHLY_COST=26.21 # Load Balancer + Public IP
TOTAL_MONTHLY_COST=$(echo "$VM_MONTHLY_COST + $STORAGE_MONTHLY_COST + $ACR_MONTHLY_COST + $NETWORK_MONTHLY_COST" | bc -l)
TOTAL_ANNUAL_COST=$(echo "$TOTAL_MONTHLY_COST * 12" | bc -l)

# Cost optimized calculation (Standard_B2s, 1 node)
OPTIMIZED_VM_COST=$(echo "0.0416 * 1 * $HOURS_PER_MONTH" | bc -l)
OPTIMIZED_ACR_COST=5.00  # Basic ACR
OPTIMIZED_TOTAL=$(echo "$OPTIMIZED_VM_COST + $STORAGE_MONTHLY_COST + $OPTIMIZED_ACR_COST + $NETWORK_MONTHLY_COST" | bc -l)
MONTHLY_SAVINGS=$(echo "$TOTAL_MONTHLY_COST - $OPTIMIZED_TOTAL" | bc -l)
ANNUAL_SAVINGS=$(echo "$MONTHLY_SAVINGS * 12" | bc -l)
SAVINGS_PERCENTAGE=$(echo "scale=1; ($MONTHLY_SAVINGS / $TOTAL_MONTHLY_COST) * 100" | bc -l)

# Display results
printf "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}\n"
printf "${CYAN}║${NC}                    ${PURPLE}SIH SOLVER'S COMPASS${NC}                     ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                     ${PURPLE}FINOPS COST ANALYSIS${NC}                    ${CYAN}║${NC}\n"
printf "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}\n"
printf "${CYAN}║${NC} ${YELLOW}MONTHLY COST BREAKDOWN:${NC}                                      ${CYAN}║${NC}\n"
printf "${CYAN}║${NC} ├─ Compute (AKS Nodes): ${GREEN}\$%.2f${NC}                    ${CYAN}║${NC}\n" $VM_MONTHLY_COST
printf "${CYAN}║${NC} ├─ Storage (ChromaDB):  ${GREEN}\$%.2f${NC}                     ${CYAN}║${NC}\n" $STORAGE_MONTHLY_COST
printf "${CYAN}║${NC} ├─ Container Registry:  ${GREEN}\$%.2f${NC}                     ${CYAN}║${NC}\n" $ACR_MONTHLY_COST
printf "${CYAN}║${NC} ├─ Networking:          ${GREEN}\$%.2f${NC}                    ${CYAN}║${NC}\n" $NETWORK_MONTHLY_COST
printf "${CYAN}║${NC} └─ ${YELLOW}TOTAL MONTHLY:${NC}       ${GREEN}\$%.2f${NC}                   ${CYAN}║${NC}\n" $TOTAL_MONTHLY_COST
printf "${CYAN}║${NC}                                                              ${CYAN}║${NC}\n"
printf "${CYAN}║${NC} ${YELLOW}ANNUAL PROJECTION:${NC}      ${GREEN}\$%.2f${NC}                  ${CYAN}║${NC}\n" $TOTAL_ANNUAL_COST
printf "${CYAN}║${NC}                                                              ${CYAN}║${NC}\n"
printf "${CYAN}║${NC} ${YELLOW}COST OPTIMIZATION:${NC}                                           ${CYAN}║${NC}\n"
printf "${CYAN}║${NC} ├─ Potential Savings:   ${GREEN}\$%.2f${NC}/month (${GREEN}%.1f%%${NC})        ${CYAN}║${NC}\n" $MONTHLY_SAVINGS $SAVINGS_PERCENTAGE
printf "${CYAN}║${NC} ├─ Annual Savings:      ${GREEN}\$%.2f${NC}                  ${CYAN}║${NC}\n" $ANNUAL_SAVINGS
printf "${CYAN}║${NC} └─ Optimized Total:     ${GREEN}\$%.2f${NC}/month              ${CYAN}║${NC}\n" $OPTIMIZED_TOTAL
printf "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo ""
echo -e "${YELLOW}📈 DETAILED BREAKDOWN:${NC}"
echo "=================================================="
printf "%-25s %10s %15s %15s\n" "Resource" "Quantity" "Unit Cost" "Monthly Cost"
echo "----------------------------------------------------------------"
printf "%-25s %10s %15s %15s\n" "VM ($VM_SIZE)" "$NODE_COUNT nodes" "\$$(printf "%.3f" $VM_HOURLY_RATE)/hour" "\$$(printf "%.2f" $VM_MONTHLY_COST)"
printf "%-25s %10s %15s %15s\n" "Storage (Standard LRS)" "50 GB" "\$0.021/GB" "\$$(printf "%.2f" $STORAGE_MONTHLY_COST)"
printf "%-25s %10s %15s %15s\n" "Container Registry" "1 Standard" "\$20.00/month" "\$$(printf "%.2f" $ACR_MONTHLY_COST)"
printf "%-25s %10s %15s %15s\n" "Load Balancer + IP" "1 Basic" "\$26.21/month" "\$$(printf "%.2f" $NETWORK_MONTHLY_COST)"
echo "----------------------------------------------------------------"
printf "%-25s %10s %15s %15s\n" "TOTAL" "" "" "\$$(printf "%.2f" $TOTAL_MONTHLY_COST)"

echo ""
echo -e "${YELLOW}💡 COST OPTIMIZATION RECOMMENDATIONS:${NC}"
echo "=================================================="
echo "1. 🔄 Use Azure Reserved Instances (1-3 years) - Save up to 72%"
echo "2. 🌙 Implement auto-shutdown for dev/staging - Save 60-80% on non-prod"
echo "3. 📊 Use Azure Spot Instances for batch workloads - Save up to 90%"
echo "4. 🔧 Right-size VMs based on actual usage - Monitor and adjust"
echo "5. 📦 Use Basic ACR for development environments - Save \$15/month"
echo "6. 🗄️ Implement data lifecycle policies for storage - Reduce storage costs"
echo "7. 📈 Enable Azure Advisor cost recommendations - Ongoing optimization"

echo ""
echo -e "${YELLOW}🎯 ENVIRONMENT-SPECIFIC RECOMMENDATIONS:${NC}"
case $ENVIRONMENT in
    "production")
        echo "✅ Current configuration is appropriate for production"
        echo "💡 Consider Reserved Instances for 1-year commitment"
        echo "📊 Enable monitoring and auto-scaling"
        ;;
    "staging")
        echo "💡 Consider auto-shutdown during off-hours (save 60%)"
        echo "🔧 Use Basic ACR instead of Standard (save \$15/month)"
        echo "📉 Single node is sufficient for staging workloads"
        ;;
    "development")
        echo "✅ Cost-optimized configuration selected"
        echo "🌙 Implement auto-shutdown (save additional 60-80%)"
        echo "🔧 Use Basic ACR (save \$15/month)"
        echo "💾 Consider smaller storage allocation"
        ;;
esac

echo ""
echo -e "${YELLOW}📊 COMPARISON WITH ALTERNATIVES:${NC}"
echo "=================================================="
printf "%-20s %15s %15s %15s\n" "Configuration" "Monthly Cost" "Annual Cost" "Savings"
echo "----------------------------------------------------------------"
printf "%-20s %15s %15s %15s\n" "Current Config" "\$$(printf "%.2f" $TOTAL_MONTHLY_COST)" "\$$(printf "%.2f" $TOTAL_ANNUAL_COST)" "-"
printf "%-20s %15s %15s %15s\n" "Cost Optimized" "\$$(printf "%.2f" $OPTIMIZED_TOTAL)" "\$$(printf "%.2f" $(echo "$OPTIMIZED_TOTAL * 12" | bc -l))" "$(printf "%.1f" $SAVINGS_PERCENTAGE)%"

# Reserved Instance pricing (example)
RESERVED_1Y_DISCOUNT=0.28  # 28% discount for 1-year
RESERVED_3Y_DISCOUNT=0.45  # 45% discount for 3-year
RESERVED_1Y_COST=$(echo "$TOTAL_MONTHLY_COST * (1 - $RESERVED_1Y_DISCOUNT)" | bc -l)
RESERVED_3Y_COST=$(echo "$TOTAL_MONTHLY_COST * (1 - $RESERVED_3Y_DISCOUNT)" | bc -l)

printf "%-20s %15s %15s %15s\n" "Reserved 1-Year" "\$$(printf "%.2f" $RESERVED_1Y_COST)" "\$$(printf "%.2f" $(echo "$RESERVED_1Y_COST * 12" | bc -l))" "28%"
printf "%-20s %15s %15s %15s\n" "Reserved 3-Year" "\$$(printf "%.2f" $RESERVED_3Y_COST)" "\$$(printf "%.2f" $(echo "$RESERVED_3Y_COST * 12" | bc -l))" "45%"

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NOTES:${NC}"
echo "=================================================="
echo "• Costs are estimates based on Azure East US pricing (2024)"
echo "• Actual costs may vary based on usage patterns and data transfer"
echo "• Network egress charges not included (typically \$0.087/GB)"
echo "• Consider Azure Hybrid Benefit if you have existing licenses"
echo "• Monitor actual usage and adjust resources accordingly"

echo ""
echo -e "${GREEN}✅ Cost analysis complete!${NC}"
echo -e "${BLUE}💡 To proceed with deployment: ./scripts/deploy-azure.sh${NC}"

# Cleanup
rm -f $TEMP_TFVARS
cd - > /dev/null