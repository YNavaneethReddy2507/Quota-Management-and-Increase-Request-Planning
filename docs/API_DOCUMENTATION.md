# Google Cloud Quotas Control Plane - REST API Specification

## Base URL
- **Local Development:** `http://localhost:5000/api/v1`
- **Production (Cloud Run):** `https://api.quotas.enterprise.org/api/v1`

## Global Headers
- `Content-Type: application/json`
- `X-User-Role`: Required for RBAC (`Admin` or `Developer`)
- `X-User-Email`: Optional identity audit header (e.g. `lead.architect@enterprise.org`)

---

## 1. System Health & Diagnostics

### `GET /health`
Liveness check returning service heartbeat.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-11T08:30:00.000Z",
  "service": "gcp-quota-governance-engine",
  "version": "1.0.0",
  "environment": "production"
}
```

### `GET /health/detailed`
Readiness check reporting component status, memory, uptime, and database layer.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-11T08:30:00.000Z",
  "uptime_seconds": 3600,
  "components": {
    "database": { "status": "UP", "engine": "MySQL/Prisma" },
    "quota_cache": { "status": "UP", "active_cached_keys": 4 },
    "memory": { "heap_used_mb": 42, "rss_mb": 78 }
  }
}
```

---

## 2. Projects API

### `GET /projects`
List all monitored Google Cloud projects.

### `GET /projects/:id/summary`
Get telemetry summary and saturation distribution for a specific project.

### `GET /projects/summary/aggregate`
Cross-project aggregated governance telemetry.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "total_projects": 3,
    "total_quotas_monitored": 6,
    "saturated_quotas_count": 2,
    "system_average_utilization_percentage": 70.5
  }
}
```

---

## 3. Quotas & Telemetry API

### `GET /quotas`
List quotas with optional multi-attribute filtering.
- **Query Parameters**:
  - `project_id` (string)
  - `threshold` (number, e.g. `80`)
  - `search` (string)
  - `limit` (number, max 100)
  - `offset` (number)
- **Response Headers**: `X-Cache: HIT | MISS`

### `POST /quotas/sync`
Trigger instantaneous live sync with Google Cloud Quotas and Cloud Monitoring APIs.

### `GET /quotas/:id/trends`
Fetch historical telemetry observations and calculate daily burn rate velocity.
- **Query Parameters**: `days` (integer, 1-365)

### `GET /quotas/:id/forecast`
Compute linear extrapolation and calculate days to 80% threshold breach and 100% exhaustion.
- **Query Parameters**: `horizon_days` (integer, 1-180), `daily_burn_rate` (optional float)

### `GET /quotas/:id/recommendation`
Generate mathematically derived target increase limit with safety margin and confidence score.
- **Query Parameters**: `safety_margin_pct` (number, 5-100), `growth_units` (number)

### `GET /quotas/export/csv`
Stream compliance telemetry report as an RFC-compliant CSV attachment.

### `GET /quotas/export/json`
Download formatted JSON telemetry payload with complete metadata.

### `GET /quotas/export/summary`
Generate executive summary governance report with actionable FinOps recommendations.

---

## 4. Increase Request Planning & Governance API

### `POST /requests`
Draft a new quota increase request.
- **Body**:
```json
{
  "quota_metric_id": "qm-001",
  "requested_limit": 250,
  "business_justification": "Batch ledger financial pipeline scaling for quarter-end.",
  "requested_by": "lead.architect@enterprise.org"
}
```

### `GET /requests`
List submitted increase requests with optional status filtering (`PENDING`, `APPROVED`, `REJECTED`).

### `PATCH /requests/:id/approve`
**RBAC Guard:** Requires `X-User-Role: Admin`.
Approves the request and dispatches outbound `quotaPreferences` update to GCP Cloud Quotas API with exponential backoff retry.
- **Body**:
```json
{
  "admin_comments": "Approved following FinOps review."
}
```

### `PATCH /requests/:id/reject`
**RBAC Guard:** Requires `X-User-Role: Admin`.
Rejects the increase request. Mandatory admin rejection rationale required.
- **Body**:
```json
{
  "admin_comments": "Please optimize memory allocations before requesting quota boost."
}
```

---

## 5. Notifications & In-App Alerts API

### `GET /notifications`
Retrieve in-app notification ledger with 5-minute alert deduplication history.

---

## 6. Settings & Administration API

### `GET /settings`
Get organizational threshold percentages, notification channel webhooks, and telemetry sync cadence.

### `PATCH /settings`
**RBAC Guard:** Requires `X-User-Role: Admin`.
Update system threshold configuration, email/slack webhooks, and sync schedules.

### `GET /settings/audit`
Retrieve chronological administrative audit history of configuration changes.
