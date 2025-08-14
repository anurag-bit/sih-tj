# FinOps Cost Analysis for SIH Solver's Compass Infrastructure
# This module calculates and estimates the monthly costs for Azure resources

# Local values for cost calculations (Azure East US pricing as of 2024)
locals {
  # VM Pricing (per hour in USD)
  vm_pricing = {
    "Standard_D2s_v3" = 0.096  # 2 vCPU, 8GB RAM
    "Standard_D4s_v3" = 0.192  # 4 vCPU, 16GB RAM
    "Standard_B2s"     = 0.0416 # 2 vCPU, 4GB RAM (Burstable)
  }
  
  # Storage pricing (per GB per month in USD)
  storage_pricing = {
    "Standard_LRS" = 0.0208  # Locally Redundant Storage
    "Standard_GRS" = 0.0416  # Geo-Redundant Storage
    "Premium_LRS"  = 0.1472  # Premium SSD
  }
  
  # Network pricing
  load_balancer_price = 22.56  # Basic Load Balancer per month
  public_ip_price     = 3.65   # Static Public IP per month
  
  # Container Registry pricing
  acr_pricing = {
    "Basic"    = 5.00   # 10GB storage included
    "Standard" = 20.00  # 100GB storage included
    "Premium"  = 50.00  # 500GB storage included
  }
  
  # Calculate monthly costs
  hours_per_month = 730  # Average hours in a month
  
  # VM costs
  vm_monthly_cost = local.vm_pricing[var.vm_size] * var.node_count * local.hours_per_month
  
  # Storage costs (50GB for ChromaDB)
  storage_monthly_cost = local.storage_pricing["Standard_LRS"] * 50
  
  # ACR costs
  acr_monthly_cost = local.acr_pricing["Standard"]
  
  # Network costs
  network_monthly_cost = local.load_balancer_price + local.public_ip_price
  
  # Total monthly cost
  total_monthly_cost = local.vm_monthly_cost + local.storage_monthly_cost + local.acr_monthly_cost + local.network_monthly_cost
  
  # Annual cost
  total_annual_cost = local.total_monthly_cost * 12
  
  # Cost breakdown
  cost_breakdown = {
    "Compute (AKS Nodes)"     = local.vm_monthly_cost
    "Storage (ChromaDB)"      = local.storage_monthly_cost
    "Container Registry"      = local.acr_monthly_cost
    "Networking"             = local.network_monthly_cost
    "Total Monthly"          = local.total_monthly_cost
    "Total Annual"           = local.total_annual_cost
  }
}

# Cost optimization recommendations
locals {
  # Alternative configurations for cost optimization
  cost_optimized_config = {
    vm_size    = "Standard_B2s"
    node_count = 1
    storage_type = "Standard_LRS"
    acr_sku    = "Basic"
  }
  
  # Calculate optimized costs
  optimized_vm_cost = local.vm_pricing[local.cost_optimized_config.vm_size] * local.cost_optimized_config.node_count * local.hours_per_month
  optimized_acr_cost = local.acr_pricing[local.cost_optimized_config.acr_sku]
  optimized_total = optimized_vm_cost + local.storage_monthly_cost + optimized_acr_cost + local.network_monthly_cost
  
  # Savings calculation
  monthly_savings = local.total_monthly_cost - optimized_total
  annual_savings = local.monthly_savings * 12
  savings_percentage = (local.monthly_savings / local.total_monthly_cost) * 100
}

# Resource tagging for cost tracking
resource "azurerm_resource_group" "sih_rg_with_cost_tags" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment     = var.environment
    Project         = "SIH-Solvers-Compass"
    CostCenter      = "Engineering"
    Owner          = "DevOps-Team"
    BudgetAlert    = "200"  # Monthly budget alert threshold in USD
    AutoShutdown   = "true" # Enable auto-shutdown for dev environments
    CreatedBy      = "Terraform"
    CreatedDate    = timestamp()
  }
}

# Budget alert (requires Azure Consumption API)
resource "azurerm_consumption_budget_resource_group" "sih_budget" {
  name              = "sih-monthly-budget"
  resource_group_id = azurerm_resource_group.sih_rg.id

  amount     = var.monthly_budget_limit
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01'T'00:00:00Z", timestamp())
  }

  filter {
    dimension {
      name = "ResourceGroupName"
      values = [
        azurerm_resource_group.sih_rg.name,
      ]
    }
  }

  notification {
    enabled   = true
    threshold = 80
    operator  = "GreaterThan"

    contact_emails = var.budget_alert_emails
  }

  notification {
    enabled   = true
    threshold = 100
    operator  = "GreaterThan"

    contact_emails = var.budget_alert_emails
  }
}

# Cost analysis data source
data "azurerm_consumption_budget_resource_group" "current_costs" {
  name              = azurerm_consumption_budget_resource_group.sih_budget.name
  resource_group_id = azurerm_resource_group.sih_rg.id
  
  depends_on = [azurerm_consumption_budget_resource_group.sih_budget]
}