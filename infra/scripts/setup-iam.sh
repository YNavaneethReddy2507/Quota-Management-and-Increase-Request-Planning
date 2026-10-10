#!/usr/bin/env bash
# ==============================================================================
# setup-iam.sh - Google Cloud IAM & Service Account Provisioning Script
# Project: Quota Management and Increase Request Planning Control Plane
# ==============================================================================

set -euo pipefail

# Configuration Defaults (can be overridden via environment variables)
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
SA_NAME="${GCP_SA_NAME:-quota-manager-sa}"
SA_DISPLAY_NAME="${GCP_SA_DISPLAY_NAME:-GCP Quota Governance Service Account}"
KEY_OUTPUT_DIR="${GCP_KEY_DIR:-./infra/credentials}"
KEY_OUTPUT_FILE="${KEY_OUTPUT_DIR}/${SA_NAME}-key.json"

# Color Codes for Output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   Google Cloud Quota Governance - IAM Service Account Provisioning   ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Check for gcloud CLI installation
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}[ERROR] 'gcloud' CLI is not installed or not in PATH.${NC}"
    echo -e "Please install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Ensure Target GCP Project ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}[ERROR] GCP Project ID is not set.${NC}"
    echo -e "Usage: GCP_PROJECT_ID=<your-project-id> bash infra/scripts/setup-iam.sh"
    echo -e "Or run: gcloud config set project <your-project-id>"
    exit 1
fi

echo -e "${GREEN}[INFO] Target GCP Project:${NC} ${PROJECT_ID}"
echo -e "${GREEN}[INFO] Service Account Name:${NC} ${SA_NAME}"

# 1. Enable Required Google Cloud APIs
echo -e "\n${BLUE}[STEP 1/5] Enabling Required Google Cloud APIs...${NC}"
gcloud services enable \
    cloudquotas.googleapis.com \
    monitoring.googleapis.com \
    serviceusage.googleapis.com \
    servicemanagement.googleapis.com \
    --project="${PROJECT_ID}"

echo -e "${GREEN}[SUCCESS] APIs enabled successfully.${NC}"

# 2. Create Service Account if it does not already exist
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo -e "\n${BLUE}[STEP 2/5] Creating Service Account: ${SA_EMAIL}...${NC}"

if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" &> /dev/null; then
    echo -e "${YELLOW}[WARN] Service Account '${SA_EMAIL}' already exists. Skipping creation.${NC}"
else
    gcloud iam service-accounts create "${SA_NAME}" \
        --description="Service account for automated Quota Monitoring, Risk Assessment, and Request Submission" \
        --display-name="${SA_DISPLAY_NAME}" \
        --project="${PROJECT_ID}"
    echo -e "${GREEN}[SUCCESS] Service Account created.${NC}"
fi

# 3. Assign Required IAM Roles
echo -e "\n${BLUE}[STEP 3/5] Assigning Mandated IAM Roles to Service Account...${NC}"

ROLES=(
    "roles/servicemanagement.quotaViewer"
    "roles/servicemanagement.quotaAdmin"
    "roles/monitoring.viewer"
    "roles/cloudquotas.admin"
)

for ROLE in "${ROLES[@]}"; do
    echo -e "Assigning role: ${YELLOW}${ROLE}${NC} ..."
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="${ROLE}" \
        --condition=None \
        --quiet > /dev/null
    echo -e "${GREEN} -> Granted ${ROLE}${NC}"
done

# 4. Generate and Download Service Account Key
echo -e "\n${BLUE}[STEP 4/5] Generating Service Account JSON Key...${NC}"
mkdir -p "${KEY_OUTPUT_DIR}"

if [ -f "${KEY_OUTPUT_FILE}" ]; then
    echo -e "${YELLOW}[WARN] Key file already exists at ${KEY_OUTPUT_FILE}. Creating a new timestamped key...${NC}"
    KEY_OUTPUT_FILE="${KEY_OUTPUT_DIR}/${SA_NAME}-key-$(date +%s).json"
fi

gcloud iam service-accounts keys create "${KEY_OUTPUT_FILE}" \
    --iam-account="${SA_EMAIL}" \
    --project="${PROJECT_ID}"

echo -e "${GREEN}[SUCCESS] JSON Key successfully generated and saved to:${NC} ${KEY_OUTPUT_FILE}"

# 5. Output Configuration Instructions
echo -e "\n${BLUE}[STEP 5/5] Setup Summary & Next Steps${NC}"
echo -e "======================================================================"
echo -e "Service Account Email:  ${GREEN}${SA_EMAIL}${NC}"
echo -e "Key File Location:      ${GREEN}${KEY_OUTPUT_FILE}${NC}"
echo -e "\nTo use this key locally, export the following environment variable:"
echo -e "${YELLOW}export GOOGLE_APPLICATION_CREDENTIALS=\"$(pwd)/${KEY_OUTPUT_FILE}\"${NC}"
echo -e "======================================================================"
