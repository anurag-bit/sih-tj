variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "sih-solvers-compass-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aks_cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = "sih-solvers-compass-aks"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "sihsolverscompassacr"
}

variable "storage_account_name" {
  description = "Name of the Azure Storage Account"
  type        = string
  default     = "sihsolverscompassstorage"
}

variable "node_count" {
  description = "Number of nodes in the AKS cluster"
  type        = number
  default     = 2
}

variable "vm_size" {
  description = "Size of the VMs in the AKS cluster"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true
}

# FinOps Variables
variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD for cost alerts"
  type        = number
  default     = 250
}

variable "budget_alert_emails" {
  description = "List of email addresses for budget alerts"
  type        = list(string)
  default     = ["admin@example.com"]
}

variable "enable_cost_optimization" {
  description = "Enable cost optimization recommendations"
  type        = bool
  default     = true
}

variable "environment_tier" {
  description = "Environment tier for cost optimization (dev, staging, prod)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment_tier)
    error_message = "Environment tier must be dev, staging, or prod."
  }
}