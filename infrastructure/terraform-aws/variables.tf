variable "aws_region" {
  description = "The AWS region to deploy the resources in."
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "The name of the EKS cluster."
  type        = string
  default     = "sih-solvers-compass-eks"
}

variable "gemini_api_key" {
  description = "The Gemini API key."
  type        = string
  sensitive   = true
}
