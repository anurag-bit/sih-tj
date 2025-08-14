#!/bin/bash

# SIH Solver's Compass - Simple FinOps Cost Analysis
# Direct cost calculation without Terraform dependency

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}💰 SIH Solver's Compass - FinOps Cost Analysis${NC}"
echo "=================================================="

# Azure pricing (East US, as of 2024)
declare -A VM_PRICING
VM_PRICING["Standard_D2s_v3"]=0.096  # 2 vCPU, 8GB RAM
VM_PRICING["Standard_D4s_v3"]=0.192  # 4 vCPU, 16GB RAM
VM_PRICING["Standard_B2s"]=0.0416    # 2 vCPU, 4GB RAM (Burstable)

STORAGE_PRICE_PER_GB=0.0208  # Standard LRS per GB/month
LOAD_BALANCER_PRICE=22.56    # Basic Load Balancer per month
PUBLIC_IP_PRICE=3.65         # Static Public IP per month
ACR_STANDARD_PRICE=20.00     # Standard Container Registry
ACR_BASIC_PRICE=5.00         # Basic Container Registry

HOURS_PER_MONTH=730

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
        ACR_PRICE=$ACR_STANDARD_PRICE
        ;;
    2)
        VM_SIZE="Standard_D2s_v3"
        NODE_COUNT=1
        ENVIRONMENT="staging"
        ACR_PRICE=$ACR_BASIC_PRICE
        ;;
    3)
        VM_SIZE="Standard_B2s"
        NODE_COUNT=1
        ENVIRONMENT="development"
        ACR_PRICE=$ACR_BASIC_PRICE
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
        
        if [[ "$ENVIRONMENT" == "prod" || "$ENVIRONMENT" == "production" ]]; then
            ACR_PRICE=$ACR_STANDARD_PRICE
        else
            ACR_PRICE=$ACR_BASIC_PRICE
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice. Using production defaults.${NC}"
        VM_SIZE="Standard_D2s_v3"
        NODE_COUNT=2
        ENVIRONMENT="production"
        ACR_PRICE=$ACR_STANDARD_PRICE
        ;;
esac

echo -e "${YELLOW}🔧 Analyzing costs for:${NC}"
echo "  VM Size: $VM_SIZE"
echo "  Node Count: $NODE_COUNT"
echo "  Environment: $ENVIRONMENT"
echo ""

# Calculate costs
VM_HOURLY_RATE=${VM_PRICING[$VM_SIZE]}
VM_MONTHLY_COST=$(echo "scale=2; $VM_HOURLY_RATE * $NODE_COUNT * $HOURS_PER_MONTH" | bc -l)
STORAGE_MONTHLY_COST=$(echo "scale=2; 50 * $STORAGE_PRICE_PER_GB" | bc -l)  # 50GB for ChromaDB
NETWORK_MONTHLY_COST=$(echo "scale=2; $LOAD_BALANCER_PRICE + $PUBLIC_IP_PRICE" | bc -l)
TOTAL_MONTHLY_COST=$(echo "scale=2; $VM_MONTHLY_COST + $STORAGE_MONTHLY_COST + $ACR_PRICE + $NETWORK_MONTHLY_COST" | bc -l)
TOTAL_ANNUAL_COST=$(echo "scale=2; $TOTAL_MONTHLY_COST * 12" | bc -l)

# Cost optimized calculation (Standard_B2s, 1 node, Basic ACR)
OPTIMIZED_VM_COST=$(echo "scale=2; ${VM_PRICING["Standard_B2s"]} * 1 * $HOURS_PER_MONTH" | bc -l)
OPTIMIZED_TOTAL=$(echo "scale=2; $OPTIMIZED_VM_COST + $STORAGE_MONTHLY_COST + $ACR_BASIC_PRICE + $NETWORK_MONTHLY_COST" | bc -l)
MONTHLY_SAVINGS=$(echo "scale=2; $TOTAL_MONTHLY_COST - $OPTIMIZED_TOTAL" | bc -l)
ANNUAL_SAVINGS=$(echo "scale=2; $MONTHLY_SAVINGS * 12" | bc -l)
SAVINGS_PERCENTAGE=$(echo "scale=1; ($MONTHLY_SAVINGS / $TOTAL_MONTHLY_COST) * 100" | bc -l)

# Display results
echo -e "${GREEN}💰 FINOPS COST ANALYSIS RESULTS${NC}"
printf "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}\n"
printf "${CYAN}║${NC}                    ${PURPLE}SIH SOLVER'S COMPASS${NC}                     ${CYAN}║${NC}\n"
printf "${CYAN}║${NC}                     ${PURPLE}FINOPS COST ANALYSIS${NC}                    ${CYAN}║${NC}\n"
printf "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}\n"
printf "${CYAN}║${NC} ${YELLOW}MONTHLY COST BREAKDOWN:${NC}                                      ${CYAN}║${NC}\n"
printf "${CYAN}║${NC} ├─ Compute (AKS Nodes): ${GREEN}\$%.2f${NC}                    ${CYAN}║${NC}\n" $VM_MONTHLY_COST
printf "${CYAN}║${NC} ├─ Storage (ChromaDB):  ${GREEN}\$%.2f${NC}                     ${CYAN}║${NC}\n" $STORAGE_MONTHLY_COST
printf "${CYAN}║${NC} ├─ Container Registry:  ${GREEN}\$%.2f${NC}                     ${CYAN}║${NC}\n" $ACR_PRICE
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
printf "%-25s %10s %15s %15s\n" "Storage (Standard LRS)" "50 GB" "\$$(printf "%.3f" $STORAGE_PRICE_PER_GB)/GB" "\$$(printf "%.2f" $STORAGE_MONTHLY_COST)"

if [[ "$ACR_PRICE" == "$ACR_STANDARD_PRICE" ]]; then
    printf "%-25s %10s %15s %15s\n" "Container Registry" "1 Standard" "\$20.00/month" "\$$(printf "%.2f" $ACR_PRICE)"
else
    printf "%-25s %10s %15s %15s\n" "Container Registry" "1 Basic" "\$5.00/month" "\$$(printf "%.2f" $ACR_PRICE)"
fi

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
    "production"|"prod")
        echo "✅ Current configuration is appropriate for production"
        echo "💡 Consider Reserved Instances for 1-year commitment"
        echo "📊 Enable monitoring and auto-scaling"
        ;;
    "staging")
        echo "💡 Consider auto-shutdown during off-hours (save 60%)"
        echo "🔧 Using Basic ACR is cost-effective for staging"
        echo "📉 Single node is sufficient for staging workloads"
        ;;
    "development"|"dev")
        echo "✅ Cost-optimized configuration selected"
        echo "🌙 Implement auto-shutdown (save additional 60-80%)"
        echo "🔧 Using Basic ACR is appropriate for development"
        echo "💾 Consider smaller storage allocation if possible"
        ;;
esac

echo ""
echo -e "${YELLOW}📊 COMPARISON WITH ALTERNATIVES:${NC}"
echo "=================================================="
printf "%-20s %15s %15s %15s\n" "Configuration" "Monthly Cost" "Annual Cost" "Savings"
echo "----------------------------------------------------------------"
printf "%-20s %15s %15s %15s\n" "Current Config" "\$$(printf "%.2f" $TOTAL_MONTHLY_COST)" "\$$(printf "%.2f" $TOTAL_ANNUAL_COST)" "-"
printf "%-20s %15s %15s %15s\n" "Cost Optimized" "\$$(printf "%.2f" $OPTIMIZED_TOTAL)" "\$$(printf "%.2f" $(echo "$OPTIMIZED_TOTAL * 12" | bc -l))" "$(printf "%.1f" $SAVINGS_PERCENTAGE)%"

# Reserved Instance pricing (example discounts)
RESERVED_1Y_COST=$(echo "scale=2; $TOTAL_MONTHLY_COST * 0.72" | bc -l)  # 28% discount
RESERVED_3Y_COST=$(echo "scale=2; $TOTAL_MONTHLY_COST * 0.55" | bc -l)  # 45% discount

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
echo "• Prices exclude taxes and may vary by region"

echo ""
echo -e "${YELLOW}🔍 COST BREAKDOWN BY PERCENTAGE:${NC}"
VM_PERCENTAGE=$(echo "scale=1; ($VM_MONTHLY_COST / $TOTAL_MONTHLY_COST) * 100" | bc -l)
STORAGE_PERCENTAGE=$(echo "scale=1; ($STORAGE_MONTHLY_COST / $TOTAL_MONTHLY_COST) * 100" | bc -l)
ACR_PERCENTAGE=$(echo "scale=1; ($ACR_PRICE / $TOTAL_MONTHLY_COST) * 100" | bc -l)
NETWORK_PERCENTAGE=$(echo "scale=1; ($NETWORK_MONTHLY_COST / $TOTAL_MONTHLY_COST) * 100" | bc -l)

echo "• Compute (VMs): $(printf "%.1f" $VM_PERCENTAGE)% of total cost"
echo "• Networking: $(printf "%.1f" $NETWORK_PERCENTAGE)% of total cost"
echo "• Container Registry: $(printf "%.1f" $ACR_PERCENTAGE)% of total cost"
echo "• Storage: $(printf "%.1f" $STORAGE_PERCENTAGE)% of total cost"

echo ""
echo -e "${GREEN}✅ FinOps cost analysis complete!${NC}"
echo -e "${BLUE}💡 To proceed with deployment: ./scripts/deploy-azure.sh${NC}"
echo -e "${PURPLE}📊 For Terraform-based deployment with these costs: cd infrastructure/terraform && terraform plan${NC}"