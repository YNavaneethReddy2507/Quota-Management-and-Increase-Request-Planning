variable "project_id" {
  description = "The Google Cloud Project ID to manage quotas and telemetry for"
  type        = string
}

variable "region" {
  description = "The primary Google Cloud region for infrastructure deployment"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment identifier (e.g., development, staging, production)"
  type        = string
  default     = "production"
}

variable "required_services" {
  description = "List of Google Cloud APIs required for Quota Management and Ingestion"
  type        = list(string)
  default = [
    "cloudquotas.googleapis.com",
    "monitoring.googleapis.com",
    "serviceusage.googleapis.com",
    "servicemanagement.googleapis.com",
    "iam.googleapis.com"
  ]
}
