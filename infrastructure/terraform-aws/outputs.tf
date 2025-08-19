output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "aws_region" {
  description = "The AWS region where the infrastructure is deployed."
  value       = var.aws_region
}

output "eks_oidc_provider_arn" {
  description = "ARN of the IAM OIDC provider associated with the EKS cluster (IRSA)."
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "ebs_csi_irsa_role_arn" {
  description = "IAM role ARN used by the aws-ebs-csi-driver controller via IRSA."
  value       = aws_iam_role.ebs_csi_irsa_role.arn
}