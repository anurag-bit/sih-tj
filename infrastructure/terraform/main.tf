# Configure the Azure Provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Create Resource Group
resource "azurerm_resource_group" "sih_rg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "SIH-Solvers-Compass"
  }
}

# Create Azure Container Registry
resource "azurerm_container_registry" "sih_acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.sih_rg.name
  location            = azurerm_resource_group.sih_rg.location
  sku                 = "Standard"
  admin_enabled       = true

  tags = {
    Environment = var.environment
    Project     = "SIH-Solvers-Compass"
  }
}

# Create AKS Cluster
resource "azurerm_kubernetes_cluster" "sih_aks" {
  name                = var.aks_cluster_name
  location            = azurerm_resource_group.sih_rg.location
  resource_group_name = azurerm_resource_group.sih_rg.name
  dns_prefix          = "${var.aks_cluster_name}-dns"

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.vm_size
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = var.environment
    Project     = "SIH-Solvers-Compass"
  }
}

# Grant AKS access to ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = azurerm_container_registry.sih_acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.sih_aks.kubelet_identity[0].object_id
}

# Create Azure Storage Account for ChromaDB persistence
resource "azurerm_storage_account" "sih_storage" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.sih_rg.name
  location                 = azurerm_resource_group.sih_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    Environment = var.environment
    Project     = "SIH-Solvers-Compass"
  }
}

# Create File Share for ChromaDB data
resource "azurerm_storage_share" "chromadb_share" {
  name                 = "chromadb-data"
  storage_account_name = azurerm_storage_account.sih_storage.name
  quota                = 50
}