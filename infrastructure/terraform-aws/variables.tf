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

variable "OPENROUTER_API_KEY" {
  description = "The OpenRouter API key for AI model access."
  type        = string
  sensitive   = true
}

variable "GEMINI_API_KEY" {
  description = "The Google Gemini API key for AI model access."
  type        = string
  sensitive   = true
  default     = ""
}

variable "GITHUB_TOKEN" {
  description = "GitHub personal access token for repository analysis."
  type        = string
  sensitive   = true
  default     = ""
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
