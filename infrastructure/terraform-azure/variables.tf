variable "resource_group_name" {
  description = "The name of the Azure Resource Group."
  type        = string
}

variable "location" {
  description = "The Azure region to deploy to."
  type        = string
}

variable "aks_cluster_name" {
  description = "The name for the AKS cluster."
  type        = string
  default     = "sih-solvers-compass-aks"
}

variable "acr_name" {
  description = "The name for the Azure Container Registry."
  type        = string
  default     = "sihsolverscompassacr" # Must be globally unique
}
