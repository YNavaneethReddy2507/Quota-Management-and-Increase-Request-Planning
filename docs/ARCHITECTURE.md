# System Architecture & Technical Specifications

## Architectural Overview
The system follows a decoupled, resilient microservices architecture consisting of a high-performance REST API backend, a reactive modern web frontend, persistent MySQL/Prisma storage, and direct integration with Google Cloud APIs.

```mermaid
flowchart TB
    subgraph Client["Frontend Client (React + Vite + Tailwind CSS)"]
        UI_Nav["Global Navigation & Project Selector"]
        UI_Dash["Dashboard & Metric Cards"]
        UI_Inv["Quota Inventory & Heatmap DataTable"]
        UI_Analytics["Historical Analytics & Recharts"]
        UI_Forecast["Forecasting & Recommendation Engine"]
        UI_Planner["Increase Request Planner Modal"]
        UI_Approvals["Approval Center (RBAC Guarded)"]
        UI_Reports["Reports & CSV Export"]
    end

    subgraph Backend["Backend Control Plane (Node.js / Express Core)"]
        API_GW["REST API Gateway (/api/v1/*)"]
        RBAC_MW["RBAC Middleware (X-User-Role)"]
        SCHEDULER["Automated Ingestion Cron Scheduler"]
        
        subgraph CoreServices["Domain Services"]
            QUOTA_SVC["Quota Ingestion Service"]
            MON_SVC["Monitoring Telemetry Service"]
            RISK_SVC["Threshold & Risk Engine"]
            FORECAST_SVC["Analytics & Forecasting Engine"]
            RECOMMEND_SVC["Capacity Recommendation Engine"]
            STATE_MACH["Approval State Machine"]
            GCP_SUBMIT["Cloud Quotas API Submitter"]
            RETRY_ENG["Exponential Backoff Retry Engine"]
            NOTIF_SVC["Webhook Notification Dispatcher"]
        end
    end

    subgraph Storage["Persistence Layer (MySQL 8.0 / Prisma ORM)"]
        DB_PROJECTS[("projects")]
        DB_QUOTAS[("quota_metrics")]
        DB_OBSERVATIONS[("usage_observations")]
        DB_REQUESTS[("increase_requests")]
        DB_AUDIT[("audit_logs")]
    end

    subgraph GCP["Google Cloud Platform Services"]
        GCP_QUOTA_API["Cloud Quotas API (cloudquotas.googleapis.com)"]
        GCP_MON_API["Cloud Monitoring API (monitoring.googleapis.com)"]
        GCP_USAGE_API["Service Usage API (serviceusage.googleapis.com)"]
        GCP_IAM["Google Cloud IAM (ADC / Service Account)"]
    end

    %% Flow connections
    Client -->|HTTP REST with RBAC| API_GW
    API_GW --> RBAC_MW
    RBAC_MW --> CoreServices
    SCHEDULER --> QUOTA_SVC
    SCHEDULER --> MON_SVC
    
    CoreServices --> Storage
    
    QUOTA_SVC -->|Authenticated REST| GCP_QUOTA_API
    MON_SVC -->|MQL / PromQL Time Series| GCP_MON_API
    GCP_SUBMIT --> RETRY_ENG
    RETRY_ENG -->|Mutate Quota Preference| GCP_QUOTA_API
    GCP_IAM -.->|OAuth2 Access Token| CoreServices
```

## Data Model Specifications
1. **`projects`**: Tracks GCP project identifiers, human-readable aliases, and environment tags (`PRODUCTION`, `STAGING`, `DEVELOPMENT`).
2. **`quota_metrics`**: Stores live quota limits, real-time consumption telemetry, calculated utilization percentages, and risk classifications.
3. **`usage_observations`**: Time-series log of historical consumption points used for statistical trend modeling and demand forecasting.
4. **`increase_requests`**: Full request lifecycle records with current limits, proposed target limits, business justifications, risk confidence scores, approval outcomes, and admin comments.
5. **`audit_logs`**: Immutable record of administrative decisions, automated sync cycles, and GCP Cloud Quota mutation outcomes.
