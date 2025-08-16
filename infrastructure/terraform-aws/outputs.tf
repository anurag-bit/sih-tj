output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.repo.repository_url
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_id
}

output "aws_region" {
  description = "The AWS region where the infrastructure is deployed."
  value       = var.aws_region # Assuming aws_region variable exists
}