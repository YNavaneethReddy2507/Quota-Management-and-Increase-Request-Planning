# Known Limitations & Engineering Roadmap

## 1. Current Known Operational Boundaries

| Area | Current Behavior | Production Recommendation |
|---|---|---|
| **Google Cloud Quotas API Latency** | Quota changes submitted via `quotaPreferences` can take between 5 minutes to 48 hours for Google backend approval depending on hardware availability. | The UI displays requests as `APPROVED (GCP Submitted)` while tracking outbound preferences. |
| **Offline / Mock Mode** | If valid Application Default Credentials (ADC) are not found on the host machine, the control plane logs credential warnings and operates gracefully in fallback demo mode. | Bind production instances to a Google Cloud Service Account using Workload Identity. |
| **Forecasting Model Complexity** | Current forecasting utilizes linear velocity projection with constant daily burn rate extrapolation. | Suitable for short-to-medium horizons (30-90 days); seasonal cyclical spikes require machine learning extensions. |
| **Alert Deduplication Cache** | In-memory 5-minute sliding deduplication window resets upon complete process termination. | In distributed multi-replica deployments, backing the deduplication store with Redis or Memorystore is advised. |

---

## 2. Engineering Roadmap

### Phase Next.1: Advanced Time-Series ML Forecasting
- Integrate Google Cloud Vertex AI / Prophet forecasting models to capture weekend workload lulls and seasonal month-end traffic spikes.

### Phase Next.2: Interactive ChatOps Bot
- Enable bidirectional Slack and Microsoft Teams bot integrations with interactive `Approve` / `Reject` buttons directly inside incident channels.

### Phase Next.3: Multi-Cloud Unified Control Plane
- Expand the abstraction adapter layer to simultaneously ingest Amazon Web Services (AWS Service Quotas) and Microsoft Azure (Quota REST API).

### Phase Next.4: Automated Self-Healing Auto-Scaler
- Implement policy-based autonomous quota adjustments for non-production environments when burn rates breach critical thresholds.
