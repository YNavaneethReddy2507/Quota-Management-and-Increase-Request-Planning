#!/usr/bin/env bash
# ==============================================================================
# deploy-cloudrun.sh - Automated Google Cloud Run Production Deployment Script
# Quota Management and Increase Request Planning Control Plane
# ==============================================================================

set -euo pipefail

# Configuration Defaults (can be overridden via environment variables)
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
REGION="${GCP_REGION:-us-central1}"
BACKEND_SERVICE="quota-management-backend"
FRONTEND_SERVICE="quota-management-frontend"
IMAGE_TAG="$(date +%Y%m%d%H%M%S)"

# Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   Deploying Quota Governance Control Plane to Google Cloud Run       ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Verify gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}[ERROR] 'gcloud' CLI is not installed or not in PATH.${NC}"
    exit 1
fi

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}[ERROR] GCP Project ID is not set. Run 'gcloud config set project <id>' or set GCP_PROJECT_ID.${NC}"
    exit 1
fi

echo -e "${GREEN}[INFO] Project ID:${NC} ${PROJECT_ID}"
echo -e "${GREEN}[INFO] Region:${NC}     ${REGION}"

# 1. Enable Cloud Run and Cloud Build APIs
echo -e "\n${BLUE}[STEP 1/4] Ensuring Cloud Build and Cloud Run APIs are active...${NC}"
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    --project="${PROJECT_ID}"

# 2. Build and Deploy Backend Container
echo -e "\n${BLUE}[STEP 2/4] Building and Deploying Backend to Cloud Run...${NC}"
BACKEND_IMAGE="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:${IMAGE_TAG}"

echo -e "Submitting Backend build..."
gcloud builds submit \
    --tag="${BACKEND_IMAGE}" \
    -f Dockerfile.backend \
    --project="${PROJECT_ID}" \
    .

echo -e "Deploying Backend service to Cloud Run..."
gcloud run deploy "${BACKEND_SERVICE}" \
    --image="${BACKEND_IMAGE}" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=5000 \
    --set-env-vars="NODE_ENV=production,PORT=5000,GCP_PROJECT_ID=${PROJECT_ID}" \
    --project="${PROJECT_ID}"

BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" --platform=managed --region="${REGION}" --format="value(status.url)" --project="${PROJECT_ID}")
echo -e "${GREEN}[SUCCESS] Backend deployed at: ${BACKEND_URL}${NC}"

# 3. Build and Deploy Frontend Container
echo -e "\n${BLUE}[STEP 3/4] Building and Deploying Frontend to Cloud Run...${NC}"
FRONTEND_IMAGE="gcr.io/${PROJECT_ID}/${FRONTEND_SERVICE}:${IMAGE_TAG}"

echo -e "Submitting Frontend build..."
gcloud builds submit \
    --tag="${FRONTEND_IMAGE}" \
    -f Dockerfile.frontend \
    --project="${PROJECT_ID}" \
    .

echo -e "Deploying Frontend service to Cloud Run..."
gcloud run deploy "${FRONTEND_SERVICE}" \
    --image="${FRONTEND_IMAGE}" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=3000 \
    --set-env-vars="VITE_API_BASE_URL=${BACKEND_URL}/api/v1" \
    --project="${PROJECT_ID}"

FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" --platform=managed --region="${REGION}" --format="value(status.url)" --project="${PROJECT_ID}")
echo -e "${GREEN}[SUCCESS] Frontend deployed at: ${FRONTEND_URL}${NC}"

# 4. Summary & Verification
echo -e "\n${BLUE}[STEP 4/4] Deployment Summary & Live URLs${NC}"
echo -e "======================================================================"
echo -e "Control Plane Frontend:  ${GREEN}${FRONTEND_URL}${NC}"
echo -e "Backend REST API:        ${GREEN}${BACKEND_URL}/api/v1/health${NC}"
echo -e "======================================================================"
echo -e "${GREEN}Hackathon Project deployment completed successfully!${NC}"
