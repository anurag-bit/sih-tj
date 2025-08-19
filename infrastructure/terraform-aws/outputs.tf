output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "aws_region" {
  description = "The AWS region where the infrastructure is deployed."
  value       = var.aws_region
}