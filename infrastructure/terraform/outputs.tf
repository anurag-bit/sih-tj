output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.sih_rg.name
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = azurerm_kubernetes_cluster.sih_aks.name
}

output "aks_cluster_id" {
  description = "ID of the AKS cluster"
  value       = azurerm_kubernetes_cluster.sih_aks.id
}

output "acr_login_server" {
  description = "Login server for the Azure Container Registry"
  value       = azurerm_container_registry.sih_acr.login_server
}

output "acr_admin_username" {
  description = "Admin username for ACR"
  value       = azurerm_container_registry.sih_acr.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "Admin password for ACR"
  value       = azurerm_container_registry.sih_acr.admin_password
  sensitive   = true
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.sih_storage.name
}

output "storage_account_key" {
  description = "Primary access key for the storage account"
  value       = azurerm_storage_account.sih_storage.primary_access_key
  sensitive   = true
}

output "kube_config" {
  description = "Kubernetes configuration"
  value       = azurerm_kubernetes_cluster.sih_aks.kube_config_raw
  sensitive   = true
}

# FinOps Cost Analysis Outputs
output "cost_analysis" {
  description = "Detailed cost breakdown and analysis"
  value = {
    monthly_costs = {
      compute_aks_nodes    = local.vm_monthly_cost
      storage_chromadb     = local.storage_monthly_cost
      container_registry   = local.acr_monthly_cost
      networking          = local.network_monthly_cost
      total_monthly       = local.total_monthly_cost
    }
    annual_projection = {
      total_annual = local.total_annual_cost
    }
    resource_details = {
      vm_size             = var.vm_size
      node_count          = var.node_count
      vm_hourly_rate      = local.vm_pricing[var.vm_size]
      storage_gb          = 50
      storage_type        = "Standard_LRS"
    }
  }
}

output "cost_optimization_recommendations" {
  description = "Cost optimization suggestions and potential savings"
  value = var.enable_cost_optimization ? {
    current_config = {
      vm_size           = var.vm_size
      node_count        = var.node_count
      monthly_cost      = local.total_monthly_cost
    }
    optimized_config = {
      vm_size           = local.cost_optimized_config.vm_size
      node_count        = local.cost_optimized_config.node_count
      monthly_cost      = local.optimized_total
    }
    savings = {
      monthly_savings     = local.monthly_savings
      annual_savings      = local.annual_savings
      savings_percentage  = local.savings_percentage
    }
    recommendations = [
      "Consider using Standard_B2s VMs for development environments",
      "Implement auto-shutdown for non-production environments",
      "Use Azure Reserved Instances for 1-3 year commitments (up to 72% savings)",
      "Enable Azure Hybrid Benefit if you have Windows Server licenses",
      "Consider spot instances for non-critical workloads (up to 90% savings)"
    ]
  } : null
}

output "budget_configuration" {
  description = "Budget and cost monitoring setup"
  value = {
    monthly_budget_limit = var.monthly_budget_limit
    budget_alert_emails  = var.budget_alert_emails
    budget_name         = azurerm_consumption_budget_resource_group.sih_budget.name
    cost_alerts = [
      "80% of budget threshold",
      "100% of budget threshold"
    ]
  }
}

output "cost_summary_table" {
  description = "Formatted cost summary for easy reading"
  value = <<-EOT
╔══════════════════════════════════════════════════════════════╗
║                    SIH SOLVER'S COMPASS                     ║
║                     FINOPS COST ANALYSIS                    ║
╠══════════════════════════════════════════════════════════════╣
║ MONTHLY COST BREAKDOWN:                                      ║
║ ├─ Compute (AKS Nodes): $${format("%.2f", local.vm_monthly_cost)}                    ║
║ ├─ Storage (ChromaDB):  $${format("%.2f", local.storage_monthly_cost)}                     ║
║ ├─ Container Registry:  $${format("%.2f", local.acr_monthly_cost)}                     ║
║ ├─ Networking:          $${format("%.2f", local.network_monthly_cost)}                    ║
║ └─ TOTAL MONTHLY:       $${format("%.2f", local.total_monthly_cost)}                   ║
║                                                              ║
║ ANNUAL PROJECTION:      $${format("%.2f", local.total_annual_cost)}                  ║
║                                                              ║
║ COST OPTIMIZATION:                                           ║
║ ├─ Potential Savings:   $${format("%.2f", local.monthly_savings)}/month (${format("%.1f", local.savings_percentage)}%)        ║
║ ├─ Annual Savings:      $${format("%.2f", local.annual_savings)}                  ║
║ └─ Optimized Total:     $${format("%.2f", local.optimized_total)}/month              ║
╚══════════════════════════════════════════════════════════════╝
EOT
}