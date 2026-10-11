# Deployment & CI/CD Operations Guide

## Overview
The **Quota Management and Increase Request Planning Control Plane** is designed for modern cloud-native deployment using multi-stage Docker containers, Docker Compose, Google Cloud Run, Terraform IaC, and automated CI/CD pipelines.

---

## 1. Local Full-Stack Deployment (Docker Compose)

Launch the entire stack (React frontend, Express backend, and MySQL database) with a single command:

```bash
# Build and start all services in detached mode
docker-compose up -d --build

# View real-time container log streams
docker-compose logs -f

# Verify running services
docker-compose ps
```

### Local Endpoints
- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/api/v1`
- **Health Endpoint:** `http://localhost:5000/api/v1/health`
- **Component Readiness:** `http://localhost:5000/api/v1/health/detailed`

---

## 2. Production Google Cloud Run Deployment

Deploy both frontend and backend as serverless, auto-scaling microservices on Google Cloud Run.

### Step 1: Submit Google Cloud Build Pipeline
```bash
gcloud builds submit --config=cloudbuild.yaml .
```

This pipeline automatically:
1. Builds multi-stage production Docker images for backend and frontend.
2. Pushes container artifacts to Google Container Registry (`gcr.io/$PROJECT_ID/...`).
3. Deploys `quota-control-plane-backend` and `quota-control-plane-frontend` to Cloud Run in `us-central1`.

### Step 2: Bind Custom Domains & TLS
```bash
gcloud run domain-mappings create \
  --service=quota-control-plane-frontend \
  --domain=quotas.enterprise.org \
  --region=us-central1
```

---

## 3. Infrastructure as Code (Terraform)

Provision all required Google Cloud IAM service accounts, API activations, and role bindings:

```bash
cd infra/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### Managed GCP Resources
- **APIs Activated:** `cloudquotas.googleapis.com`, `monitoring.googleapis.com`, `servicemanagement.googleapis.com`, `run.googleapis.com`.
- **Service Account:** `quota-manager-sa@$PROJECT_ID.iam.gserviceaccount.com`.
- **IAM Roles:** `roles/cloudquotas.admin`, `roles/monitoring.viewer`, `roles/servicemanagement.quotaAdmin`, `roles/servicemanagement.quotaViewer`.

---

## 4. Continuous Integration & Delivery (CI/CD)

The GitHub Actions workflow at [`.github/workflows/ci.yml`](file:///d:/Google_Cloud_project/.github/workflows/ci.yml) executes automatically on every `push` and `pull_request` to `main`:
1. **Backend Job:** Installs dependencies, runs all 16 Jest test suites, verifies 100% test pass rate, and generates coverage metrics.
2. **Frontend Job:** Installs dependencies, runs Vite 6 production compilation, and verifies zero build errors.

---

## 5. Production Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend server HTTP port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/quota_db` |
| `GCP_PROJECT_ID` | Primary Google Cloud Project ID | `enterprise-prod-finance-42` |
| `GCP_DEFAULT_REGION` | Primary region | `us-central1` |
| `VITE_API_BASE_URL` | Frontend API target | `https://api.quotas.enterprise.org/api/v1` |
