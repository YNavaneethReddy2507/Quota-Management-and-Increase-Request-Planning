# Google Cloud Quota Management and Increase Request Planning

[![Google Cloud Platform](https://img.shields.io/badge/GCP-Cloud%20Quotas-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/docs/quotas)
[![Node.js](https://img.shields.io/badge/Node.js-v24+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB?logo=react&logoColor=black)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Containers-Docker%20%26%20Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

An enterprise-grade, intelligent governance control plane built for the Google Cloud Hackathon. The platform proactively monitors Google Cloud Platform (GCP) resource quotas, calculates real-time utilization telemetry against hard cloud limits, alerts engineering teams when approaching critical saturation thresholds ($\ge 80\%$), and orchestrates internal justification and approval workflows before programmatically submitting quota increases directly to the GCP Cloud Quotas API.

---

## 1. Hackathon Objective & Problem Statement

Google Cloud Platform enforces strict resource quotas to prevent runaway cloud bills, protect against denial-of-service vulnerabilities, and maintain multi-tenant regional capacity. In enterprise organizations:
1. **Unplanned Outages:** Engineers encounter quota exhaustion unexpectedly during production deployments or scale events.
2. **Manual & Slow Ticketing:** Quota requests require manual navigation of the GCP Console, creating audit blindspots and operational delays.
3. **Lack of Governance:** Engineering leads lack unified visibility into quota burn rates across multiple projects and environments (Dev, Staging, Prod).

### The Solution
The **Quota Management and Increase Request Planning** control plane delivers:
- **Continuous Telemetry Ingestion:** Pulls active quota limits from the Cloud Quotas API and live usage from Google Cloud Monitoring.
- **Dynamic Risk & Threshold Analysis:** Automatically flags at-risk resources ($\ge 80\%$ utilization) and computes an AI/heuristic **Approval Confidence Score (0-100)** for proposed requests.
- **Auditable Approval State Machine:** Enforces RBAC permissions (`Developer` vs `Admin`), validating requests across `PENDING`, `APPROVED`, `REJECTED`, `GCP_SUBMITTED`, `GCP_FULFILLED`, and `FAILED`.
- **Programmatic Quota Adjustment:** Automatically dispatches authenticated mutation requests to the GCP Cloud Quotas `quotaPreferences` API with resilient exponential backoff retry logic.
- **Instant Webhook Notifications:** Broadcasts alerts to Slack/Discord channels upon request creation and administrative decisions.

---

## 2. System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend Client (React + Vite + Tailwind CSS)"]
        UI_Dash["Dashboard Overview & Top Risk Metrics"]
        UI_Table["Quota Explorer & Utilization Heatmap"]
        UI_Modal["Increase Request Planner Modal"]
        UI_Admin["Approval Center (RBAC Protected)"]
    end

    subgraph Backend["Backend Engine (Node.js / Express Core)"]
        API_GW["REST API Gateway (/api/v1/*)"]
        RBAC_MW["RBAC Middleware (X-User-Role)"]
        STATE_MACH["Approval State Machine & Validator"]
        RISK_ENG["Risk Assessment Scoring Engine"]
        CRON_SCHED["Automated Telemetry Scheduler (node-cron)"]
        NOTIF_SVC["Notification Webhook Dispatcher"]
        GCP_CLIENT["GCP Auth & Cloud Quotas Client"]
        RETRY_ENG["Exponential Backoff Retry Engine"]
    end

    subgraph Storage["Persistence Layer (MySQL 8.0)"]
        TBL_PROJ[("projects")]
        TBL_QUOTA[("quota_metrics")]
        TBL_REQ[("increase_requests")]
    end

    subgraph GCP["Google Cloud Platform Services"]
        GCP_QUOTA_API["Cloud Quotas API (cloudquotas.googleapis.com)"]
        GCP_MON_API["Cloud Monitoring API (monitoring.googleapis.com)"]
        GCP_USAGE_API["Service Usage API (serviceusage.googleapis.com)"]
        GCP_IAM["GCP IAM Service Account & ADC"]
    end

    subgraph External["External Channels"]
        SLACK_DISCORD["Slack / Discord Webhooks"]
    end

    %% Interactions
    Client -->|HTTP/REST with RBAC Headers| API_GW
    API_GW --> RBAC_MW
    RBAC_MW --> STATE_MACH
    API_GW --> RISK_ENG
    CRON_SCHED --> GCP_CLIENT
    
    API_GW --> TBL_PROJ
    API_GW --> TBL_QUOTA
    STATE_MACH --> TBL_REQ
    
    GCP_CLIENT -->|Authenticated REST Calls| GCP_QUOTA_API
    GCP_CLIENT -->|MQL/PromQL Telemetry Queries| GCP_MON_API
    GCP_CLIENT --> GCP_USAGE_API
    GCP_IAM -.->|Credentials & Bearer Tokens| GCP_CLIENT

    STATE_MACH --> RETRY_ENG
    RETRY_ENG -->|Mutate Quota Preference| GCP_QUOTA_API
    
    NOTIF_SVC -->|Post Alerts| SLACK_DISCORD
```

---

## 3. Database Schema (MySQL)

```mermaid
erDiagram
    PROJECTS ||--o{ QUOTA_METRICS : "tracks"
    QUOTA_METRICS ||--o{ INCREASE_REQUESTS : "requests"

    PROJECTS {
        varchar(36) id PK "UUID"
        varchar(255) gcp_project_id UK "Unique GCP Project ID"
        varchar(50) environment "e.g. PRODUCTION, STAGING, DEV"
        timestamp created_at "Default CURRENT_TIMESTAMP"
    }

    QUOTA_METRICS {
        varchar(36) id PK "UUID"
        varchar(36) project_id FK "References projects(id) CASCADE"
        varchar(255) metric_name "e.g. compute.googleapis.com/cpus"
        varchar(100) region "e.g. us-central1, global"
        float current_usage "Real-time consumption"
        float quota_limit "Hard ceiling"
        float utilization_percentage "(current_usage / quota_limit) * 100"
        timestamp last_synced_at "Auto-updated on sync"
    }

    INCREASE_REQUESTS {
        varchar(36) id PK "UUID"
        varchar(36) quota_metric_id FK "References quota_metrics(id) CASCADE"
        varchar(255) requested_by "User identity/email"
        float current_limit "Snapshot of limit at request time"
        float requested_limit "Target new quota limit (> current_limit)"
        text business_justification "Engineering rationale"
        enum status "PENDING, APPROVED, REJECTED, GCP_SUBMITTED, GCP_FULFILLED, FAILED"
        text admin_comments "Mandatory on rejection"
        timestamp created_at
        timestamp updated_at
    }
```

---

## 4. Prerequisites

Before installing, ensure the following are installed on your host system:
- **Node.js**: v18.0.0 or higher (v24 LTS recommended)
- **npm**: v9.0.0 or higher
- **Docker & Docker Compose**: v20+ for containerized deployment
- **Google Cloud SDK (`gcloud`)**: Authenticated with appropriate GCP project permissions
- **MySQL Client / Server**: (Optional for local testing if running MySQL via Docker)

---

## 5. Environment Variables Configuration

### Backend (`/backend/.env`)
```bash
# Server Port
PORT=5000

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=quota_user
DB_PASSWORD=quota_secure_password
DB_NAME=quota_management
DATABASE_URL="mysql://quota_user:quota_secure_password@localhost:3306/quota_management"

# Google Cloud Authentication
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GCP_DEFAULT_PROJECT_ID=my-gcp-project-id

# Notification Webhooks (Slack or Discord)
WEBHOOK_URL=https://hooks.slack.com/services/EXAMPLE/WEBHOOK/URL
```

### Frontend (`/frontend/.env`)
```bash
# Backend REST API Base URL
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 6. Local Setup & Execution Guide

### Option A: Run via Docker Compose (Recommended)
Launch the entire stack (MySQL 8.0, Node.js Backend API, and Vite React Frontend) with a single command:
```bash
docker-compose up --build
```
- Frontend will be available at: `http://localhost:3000`
- Backend REST API will be available at: `http://localhost:5000`
- MySQL Database will be available at: `localhost:3306`

### Option B: Run Concurrently on Host Machine

#### 1. Setup Backend
```bash
cd backend
npm install
npm run prisma:generate
# Seed or migrate DB
npm run start
```

#### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

#### 3. Run Concurrently from Root
You can install and use concurrently:
```bash
npm install -g concurrently
concurrently --kill-others "npm run dev --prefix backend" "npm run dev --prefix frontend"
```

---

## 7. REST API Endpoints Overview

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status and timestamp | Public |
| `GET` | `/api/v1/projects` | List all tracked GCP projects | Developer, Admin |
| `GET` | `/api/v1/quotas` | List quota metrics with pagination & threshold filtering | Developer, Admin |
| `POST` | `/api/v1/requests` | Draft a quota increase request with Risk Scoring | Developer, Admin |
| `PATCH`| `/api/v1/requests/:id/approve` | Approve request & trigger GCP Cloud Quotas submission | Admin Only |
| `PATCH`| `/api/v1/requests/:id/reject` | Reject request with mandatory reason | Admin Only |
| `POST` | `/api/v1/sync` | Trigger manual quota limit & telemetry ingestion | Admin Only |

---

## 8. License & Acknowledgements
Developed for the **Google Cloud Hackathon**. Distributed under the MIT License.
