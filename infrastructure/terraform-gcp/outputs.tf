output "gke_cluster_name" {
  description = "The name of the GKE cluster."
  value       = google_container_cluster.primary.name
}

output "gke_cluster_endpoint" {
  description = "The endpoint of the GKE cluster."
  value       = google_container_cluster.primary.endpoint
}

output "gcp_region" {
  description = "The GCP region where the infrastructure is deployed."
  value       = var.gcp_region
}

output "gcp_project_id" {
  description = "The GCP project ID."
  value       = var.gcp_project_id
}
