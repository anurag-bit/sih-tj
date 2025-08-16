variable "gcp_project_id" {
  description = "The GCP project ID to deploy to."
  type        = string
}

variable "gcp_region" {
  description = "The GCP region to deploy to."
  type        = string
  default     = "us-central1"
}

variable "gke_cluster_name" {
  description = "The name for the GKE cluster."
  type        = string
  default     = "sih-solvers-compass-cluster"
}

variable "gke_machine_type" {
  description = "The machine type for the GKE nodes."
  type        = string
  default     = "e2-standard-4"
}

variable "gke_node_count" {
  description = "The number of nodes in the GKE cluster."
  type        = number
  default     = 2
}