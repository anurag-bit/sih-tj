output "ecr_backend_repository_url" {
  description = "The URL of the ECR backend repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "The URL of the ECR frontend repository" 
  value       = aws_ecr_repository.frontend.repository_url
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "aws_region" {
  description = "The AWS region where the infrastructure is deployed."
  value       = var.aws_region
}