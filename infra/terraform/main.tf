terraform {
  required_version = ">= 1.3.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required GCP APIs for Quota Management Control Plane
resource "google_project_service" "required_apis" {
  for_each                   = toset(var.required_services)
  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}

# Service Account for Quota Management Worker
resource "google_service_account" "quota_manager_sa" {
  account_id   = "quota-manager-sa"
  display_name = "Google Cloud Quota Governance Service Account"
  description  = "Service account managed by Terraform for automated quota monitoring, telemetry calculation, and request submission"
  project      = var.project_id

  depends_on = [google_project_service.required_apis]
}

# IAM Role Bindings for Quota and Monitoring access
resource "google_project_iam_member" "quota_viewer" {
  project = var.project_id
  role    = "roles/servicemanagement.quotaViewer"
  member  = "serviceAccount:${google_service_account.quota_manager_sa.email}"
}

resource "google_project_iam_member" "quota_admin" {
  project = var.project_id
  role    = "roles/servicemanagement.quotaAdmin"
  member  = "serviceAccount:${google_service_account.quota_manager_sa.email}"
}

resource "google_project_iam_member" "monitoring_viewer" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.quota_manager_sa.email}"
}

resource "google_project_iam_member" "cloudquotas_admin" {
  project = var.project_id
  role    = "roles/cloudquotas.admin"
  member  = "serviceAccount:${google_service_account.quota_manager_sa.email}"
}
