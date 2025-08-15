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

variable "instance_types" {
  description = "The instance types for the EKS node group."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "desired_size" {
  description = "The desired number of nodes in the EKS node group."
  type        = number
  default     = 2
}

variable "max_size" {
  description = "The maximum number of nodes in the EKS node group."
  type        = number
  default     = 3
}

variable "min_size" {
  description = "The minimum number of nodes in the EKS node group."
  type        = number
  default     = 1
}
