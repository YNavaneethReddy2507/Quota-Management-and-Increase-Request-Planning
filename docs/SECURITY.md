# Security Architecture & Hardening Guide

## Overview
The **Quota Management and Increase Request Planning Control Plane** enforces enterprise-grade security across API access, GCP IAM credential exchange, cross-origin resource sharing, input validation, and audit governance.

---

## 1. Threat Model & Defense-in-Depth

| Threat Vector | Mitigation Strategy | Implementation |
|---|---|---|
| **Unauthorized Quota Increase** | Role-Based Access Control (RBAC) | `requireRole(['Admin'])` middleware on approval routes |
| **Denial of Service (DoS)** | IP sliding-window rate limiting | `rateLimiter` (200 requests / 15m window, 429 response) |
| **Cross-Site Scripting (XSS)** | HTTP security headers + sanitization | `X-XSS-Protection`, `Content-Security-Policy`, strict input validation |
| **Clickjacking** | Frame restrictions | `X-Frame-Options: DENY` |
| **Credential & Secret Leaks** | Ephemeral token exchange | Google ADC (Application Default Credentials), zero hardcoded keys |
| **Payload Ingestion Buffer Floods** | Body size limits | Express JSON parser strictly capped at 1MB |
| **Cross-Origin Abuse** | Strict CORS policy | Whitelisted origins (`localhost:3000`, `127.0.0.1:3000`, Vite ports) |

---

## 2. Role-Based Access Control (RBAC) Matrix

| User Role | View Quotas & Analytics | Create Increase Request | Approve / Reject Requests | Modify Threshold Settings |
|---|:---:|:---:|:---:|:---:|
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **SRE** | ✅ Yes | ✅ Yes | ❌ Blocked (403) | ❌ Blocked (403) |
| **FinOps** | ✅ Yes | ✅ Yes | ❌ Blocked (403) | ❌ Blocked (403) |
| **Developer** | ✅ Yes | ✅ Yes | ❌ Blocked (403) | ❌ Blocked (403) |

Unauthorized attempts return HTTP 403:
```json
{
  "error": "Forbidden",
  "message": "User role 'Developer' is not authorized to access this resource",
  "required_roles": ["Admin"]
}
```

---

## 3. Rate Limiting Configuration

- **Sliding Window:** 15 minutes (900,000 ms)
- **Maximum Requests per Window:** 200 requests per IP
- **Response Headers:**
  - `X-RateLimit-Limit: 200`
  - `X-RateLimit-Remaining: <remaining>`
  - `Retry-After: <seconds>` (on HTTP 429)

---

## 4. HTTP Security Headers
Every HTTP response is guarded with OWASP-recommended headers:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;
```

---

## 5. Input Validation & Schema Enforcement
All mutating requests (`POST /api/v1/requests`, `PATCH /api/v1/settings`) pass through strict schema validation using **Zod**:
- Limit bounds: `requested_limit > current_limit`
- Justification minimums: Minimum 20 characters for rationale
- Threshold bounds: `0 < warning_pct < critical_pct <= 100`

---

## 6. GCP Credentials & Secret Safety
- No private key files, service account JSON files, or API keys are committed to source control.
- In production, authentication uses **Google Cloud Workload Identity** or **Application Default Credentials (ADC)** via `GoogleAuth.getAccessToken()`.
- Outbound webhooks and external URLs are validated and sanitised against local network SSRF probes.
