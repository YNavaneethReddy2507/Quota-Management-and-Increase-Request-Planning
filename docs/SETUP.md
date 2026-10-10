# Local Environment Setup & Configuration Guide

## Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Docker & Docker Compose**: v20+ for containerized deployment
- **Google Cloud SDK (`gcloud`)**: Authenticated with appropriate GCP project permissions

## Quick Start (Docker Compose)
To boot the full stack with MySQL 8.0, Backend REST API, and Frontend Control Plane:
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MySQL Database: `localhost:3306`

## Manual Host Setup

### 1. Backend Service
```bash
cd backend
npm install
npm run start
```
Runs on `http://localhost:5000`. Health check available at `http://localhost:5000/api/v1/health`.

### 2. Frontend Control Plane
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:3000`.
