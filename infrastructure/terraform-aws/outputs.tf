output "aws_region" {
  description = "The AWS region where the resources are deployed."
  value       = var.aws_region
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster."
  value       = aws_eks_cluster.main.name
}

output "ecr_backend_repository_url" {
  description = "The URL of the ECR repository for the backend."
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "The URL of the ECR repository for the frontend."
  value       = aws_ecr_repository.frontend.repository_url
}

output "eks_cluster_endpoint" {
  description = "The endpoint for your EKS cluster."
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_ca" {
  description = "The certificate authority for your EKS cluster."
  value       = aws_eks_cluster.main.certificate_authority[0].data
}