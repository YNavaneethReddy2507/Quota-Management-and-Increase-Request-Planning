output "project_id" {
  description = "Target Google Cloud Project ID"
  value       = var.project_id
}

output "region" {
  description = "Target Google Cloud Region"
  value       = var.region
}

output "enabled_apis" {
  description = "List of enabled Google Cloud APIs"
  value       = [for s in google_project_service.required_apis : s.service]
}

output "service_account_email" {
  description = "Service account email provisioned for quota governance"
  value       = google_service_account.quota_manager_sa.email
}
