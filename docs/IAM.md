# Google Cloud IAM & Security Architecture

## Overview
This document specifies the identity and access management (IAM) permissions required by the **Quota Management and Increase Request Planning Control Plane** to interact with Google Cloud APIs.

---

## Required Google Cloud APIs
The application communicates with the following Google Cloud REST APIs:
1. **Cloud Quotas API** (`cloudquotas.googleapis.com`): Quota discovery, current limits, and `quotaPreferences` automated adjustment submissions.
2. **Cloud Monitoring API** (`monitoring.googleapis.com`): Historical and real-time metric timeseries retrieval for resource consumption.
3. **Service Management API** (`servicemanagement.googleapis.com`): Service quota configurations.
4. **Service Usage API** (`serviceusage.googleapis.com`): Project service enablement status.

---

## Service Account Roles & Least-Privilege Specifications

| IAM Role | Role Identifier | Purpose / Scope |
| :--- | :--- | :--- |
| **Cloud Quotas Administrator** | `roles/cloudquotas.admin` | Read quota configurations and submit `quotaPreferences` for automated increase adjustments. |
| **Service Management Quota Viewer** | `roles/servicemanagement.quotaViewer` | Read default service quota limits and metric allocations. |
| **Service Management Quota Admin** | `roles/servicemanagement.quotaAdmin` | Prepare and modify resource consumer quota limits. |
| **Monitoring Viewer** | `roles/monitoring.viewer` | Read Cloud Monitoring time-series metrics (`timeSeries.list`) for saturation calculation. |

---

## Authentication Schemes

### 1. Local Development / Hybrid
- Uses **Application Default Credentials (ADC)**.
- Generated via Google Cloud CLI:
  ```bash
  gcloud auth application-default login
  ```
- Or using a dedicated service account key:
  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/quota-manager-sa-key.json"
  ```

### 2. Google Cloud Run (Production)
- Uses **Cloud Run Runtime Service Identity**.
- Workload identity eliminates the need for downloading or mounting long-lived JSON keys.
- Bound directly to the Cloud Run revision via `--service-account=quota-manager-sa@$PROJECT_ID.iam.gserviceaccount.com`.

---

## Automated Provisioning
The complete provisioning process is automated via the included script:
```bash
GCP_PROJECT_ID="your-project-id" bash infra/scripts/setup-iam.sh
```
