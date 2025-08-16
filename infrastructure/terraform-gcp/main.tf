resource "google_artifact_registry_repository" "repo" {
  location      = var.gcp_region
  repository_id = "sih-solver-compass"
  description   = "Docker repository for SIH Solver's Compass"
  format        = "DOCKER"
}

resource "google_container_cluster" "primary" {
  name     = var.gke_cluster_name
  location = var.gcp_region
  project  = var.gcp_project_id

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = "default"
  subnetwork = "default"

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "${google_container_cluster.primary.name}-node-pool"
  location   = var.gcp_region
  cluster    = google_container_cluster.primary.name
  node_count = var.gke_node_count

  node_config {
    machine_type = var.gke_machine_type
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}