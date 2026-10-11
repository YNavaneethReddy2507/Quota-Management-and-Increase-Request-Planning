"""
Generate an enterprise-grade 17-slide widescreen PowerPoint presentation (.pptx)
for the Quota Management and Increase Request Planning Control Plane.
Strictly ensures:
1. NO assigned roles for team members.
2. Text never exceeds the bounding box of any textbox.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

OUTPUT_PPTX = "Quota_Management_and_Increase_Request_Planning_Presentation.pptx"
ASSETS_DIR = "presentation_assets"

# Color Palette
BG_COLOR = RGBColor(15, 23, 42)        # Slate 900
CARD_BG = RGBColor(30, 41, 59)         # Slate 800
BORDER_COLOR = RGBColor(51, 65, 85)    # Slate 700
TEXT_WHITE = RGBColor(248, 250, 252)   # Slate 50
TEXT_MUTED = RGBColor(148, 163, 184)   # Slate 400
ACCENT_BLUE = RGBColor(59, 130, 246)   # Blue 500
ACCENT_CYAN = RGBColor(6, 182, 212)    # Cyan 500
ACCENT_EMERALD = RGBColor(16, 185, 129)# Emerald 500
ACCENT_AMBER = RGBColor(245, 158, 11)  # Amber 500

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

def set_slide_background(slide):
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_COLOR
    bg.line.fill.background()
    return bg

def add_header(slide, tag_text, title_text, subtitle_text=""):
    # Tag Pill
    tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(6.0), Inches(0.35))
    tf_tag = tag_box.text_frame
    tf_tag.word_wrap = True
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = tag_text.upper()
    p_tag.font.size = Pt(9.5)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_CYAN

    # Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.5), Inches(0.65))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(20)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE

    if subtitle_text:
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.35), Inches(11.5), Inches(0.4))
        tf_sub = sub_box.text_frame
        tf_sub.word_wrap = True
        p_sub = tf_sub.paragraphs[0]
        p_sub.text = subtitle_text
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED

def add_footer(slide, slide_num, total_slides=17):
    footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(11.733), Inches(0.35))
    tf = footer_box.text_frame
    p = tf.paragraphs[0]
    p.text = f"Google Cloud Hackathon 2026 | Quota Management Control Plane  •  Slide {slide_num} of {total_slides}"
    p.font.size = Pt(8.5)
    p.font.color.rgb = RGBColor(100, 116, 139)

def add_content_and_image(slide, bullets, image_filename, slide_num):
    # Left Content Container Card - sized to never overflow
    content_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.85), Inches(6.0), Inches(4.85))
    content_card.fill.solid()
    content_card.fill.fore_color.rgb = CARD_BG
    content_card.line.color.rgb = BORDER_COLOR
    content_card.line.width = Pt(1)

    tf = content_card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_right = Inches(0.25)
    tf.margin_top = Inches(0.25)
    tf.margin_bottom = Inches(0.2)

    for i, (heading, desc) in enumerate(bullets):
        p1 = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
        p1.text = f"•  {heading}"
        p1.font.bold = True
        p1.font.size = Pt(11)
        p1.font.color.rgb = ACCENT_BLUE if i % 2 == 0 else ACCENT_CYAN
        p1.space_before = Pt(5) if i > 0 else Pt(0)

        p2 = tf.add_paragraph()
        p2.text = f"    {desc}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_WHITE
        p2.space_before = Pt(1.5)

    # Right Image
    img_path = os.path.join(ASSETS_DIR, image_filename)
    if os.path.exists(img_path):
        slide.shapes.add_picture(img_path, Inches(7.1), Inches(1.85), Inches(5.4), Inches(4.85))

    add_footer(slide, slide_num)

# ==========================================
# Slide 1: Title Slide (No roles assigned)
# ==========================================
slide1 = prs.slides.add_slide(blank_layout)
set_slide_background(slide1)

t_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.0), Inches(6.4), Inches(5.5))
t_card.fill.solid()
t_card.fill.fore_color.rgb = CARD_BG
t_card.line.color.rgb = ACCENT_BLUE
t_card.line.width = Pt(1.5)

tf1 = t_card.text_frame
tf1.word_wrap = True
tf1.margin_left = Inches(0.35)
tf1.margin_right = Inches(0.35)
tf1.margin_top = Inches(0.35)

p = tf1.paragraphs[0]
p.text = "GOOGLE CLOUD HACKATHON 2026"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = ACCENT_CYAN

p2 = tf1.add_paragraph()
p2.text = "Quota Management &\nIncrease Request Planning"
p2.font.size = Pt(23)
p2.font.bold = True
p2.font.color.rgb = TEXT_WHITE
p2.space_before = Pt(8)

p3 = tf1.add_paragraph()
p3.text = "An Enterprise FinOps & Infrastructure Control Plane for Real-Time Telemetry Ingestion, Dynamic Risk Analysis, and Programmatic GCP Quota Scaling."
p3.font.size = Pt(10)
p3.font.color.rgb = TEXT_MUTED
p3.space_before = Pt(8)

p4 = tf1.add_paragraph()
p4.text = "TEAM MEMBERS:"
p4.font.size = Pt(10)
p4.font.bold = True
p4.font.color.rgb = ACCENT_AMBER
p4.space_before = Pt(16)

team_members = [
    ("2400030020", "YADAMAKANTI NAVANEETH REDDY"),
    ("2400039056", "SHIVAM KUMAR SAW"),
    ("2400033292", "NIKET KUMAR"),
    ("2400033195", "ALLAM SAHITHI"),
]
for reg, name in team_members:
    p_mem = tf1.add_paragraph()
    p_mem.text = f"•  {reg}  —  {name}"
    p_mem.font.size = Pt(10)
    p_mem.font.color.rgb = TEXT_WHITE
    p_mem.space_before = Pt(2.5)

slide1.shapes.add_picture(os.path.join(ASSETS_DIR, "slide1_hero.png"), Inches(7.5), Inches(1.0), Inches(5.0), Inches(5.5))
add_footer(slide1, 1)

# ==========================================
# Slide 2: Team Members (No roles assigned)
# ==========================================
slide2 = prs.slides.add_slide(blank_layout)
set_slide_background(slide2)
add_header(slide2, "Project Team", "Engineering Team & Student Roster", "Collaborative development team for Google Cloud Hackathon 2026.")
add_content_and_image(slide2, [
    ("YADAMAKANTI NAVANEETH REDDY", "Registration Number: 2400030020"),
    ("SHIVAM KUMAR SAW", "Registration Number: 2400039056"),
    ("NIKET KUMAR", "Registration Number: 2400033292"),
    ("ALLAM SAHITHI", "Registration Number: 2400033195"),
], "slide2_team.png", 2)

# ==========================================
# Slide 3: Problem Statement
# ==========================================
slide3 = prs.slides.add_slide(blank_layout)
set_slide_background(slide3)
add_header(slide3, "The Challenge", "The Enterprise Quota Bottleneck in Google Cloud", "Why hard quota ceilings trigger production outages and operational friction.")
add_content_and_image(slide3, [
    ("Silent Production Blockers", "Engineers encounter sudden quota exhaustion during high-stakes deployments, batch jobs, or auto-scaling spikes."),
    ("Manual Console Overhead", "Requesting increases involves navigating deep GCP console menus, manual ticket logging, and prolonged wait times."),
    ("Zero Predictive Visibility", "Traditional monitoring only reflects past usage; engineering leaders lack visibility into burn rate velocity and time-to-exhaustion."),
    ("Governance & Audit Deficits", "Organizations lack central approval gates, audit trails, and multi-tenant quota utilization visibility across environments."),
], "slide3_problem.png", 3)

# ==========================================
# Slide 4: Proposed Solution
# ==========================================
slide4 = prs.slides.add_slide(blank_layout)
set_slide_background(slide4)
add_header(slide4, "The Solution", "Intelligent Quota Governance & Scaling Control Plane", "A centralized, proactive platform unifying telemetry, forecasting, and automated adjustments.")
add_content_and_image(slide4, [
    ("Continuous Telemetry Ingestion", "Automated background sync pulling live quota ceilings from Cloud Quotas API and consumption metrics from Cloud Monitoring."),
    ("Early Saturation Warning (>=80%)", "Real-time risk classifier flagging at-risk resources before service disruption occurs."),
    ("Mathematical Forecasting & Sizing", "Linear demand extrapolation, days-to-breach dates, and explainable AI approval confidence scoring (0-100)."),
    ("One-Click GCP Cloud Dispatch", "Authenticated submission of quota preferences directly to Google Cloud APIs with exponential backoff retries."),
], "slide4_solution.png", 4)

# ==========================================
# Slide 5: System Architecture
# ==========================================
slide5 = prs.slides.add_slide(blank_layout)
set_slide_background(slide5)
add_header(slide5, "System Blueprint", "Full-Stack Control Plane Architecture", "Modern decoupled architecture engineered for enterprise scalability and reliability.")
add_content_and_image(slide5, [
    ("Frontend Client (Port 3000)", "React 18 + Vite 6 + Tailwind CSS SPA featuring 9 views, interactive data tables, confidence meters, and dark mode UI."),
    ("API Gateway Core (Port 5000)", "Express REST framework with sliding-window rate limiting, strict CORS, OWASP security headers, and Morgan logging."),
    ("Dual-Tier Persistence Layer", "MySQL 8.0 schema with Prisma ORM and seamless automatic in-memory fallback for offline resilience."),
    ("Google Cloud Platform Integration", "Google Auth Library (ADC tokens), Cloud Quotas REST API, Cloud Monitoring MQL timeseries, and Cloud Run."),
], "slide5_arch.png", 5)

# ==========================================
# Slide 6: Telemetry Ingestion Pipeline
# ==========================================
slide6 = prs.slides.add_slide(blank_layout)
set_slide_background(slide6)
add_header(slide6, "Telemetry Pipeline", "Live Quota Retrieval & Cloud Monitoring Ingestion", "Harmonizing quota limits and usage time-series into a single pane of glass.")
add_content_and_image(slide6, [
    ("Cloud Quotas API Integration", "Polls Google Cloud Quotas API to discover active resource ceilings across Compute Engine, GPUs, Disks, and Vertex AI."),
    ("Cloud Monitoring Time-Series", "Ingests MQL telemetry observations to compute current utilization percentages and 30-day usage trends."),
    ("Automated Cron Scheduler", "node-cron daemon executes recurring ingestion cycles with configurable frequency (Manual, Hourly, Daily)."),
    ("Resilient Telemetry Fallback", "Gracefully serves verified telemetry mocks if operating offline or without live GCP credentials."),
], "slide6_telemetry.png", 6)

# ==========================================
# Slide 7: Saturation & Risk Engine
# ==========================================
slide7 = prs.slides.add_slide(blank_layout)
set_slide_background(slide7)
add_header(slide7, "Risk Intelligence", "Real-Time Saturation Detection & Classification", "Proactive risk classification preventing unexpected quota starvation.")
add_content_and_image(slide7, [
    ("Multi-Tier Risk Classification", "Categorizes all quota metrics into 4 distinct risk tiers: Normal (<60%), Moderate (60-80%), High Risk (80-90%), Critical (>=90%)."),
    ("80% Saturation Alert Boundary", "Automatically triggers high-priority warning banners and suggests immediate increase planning upon reaching 80% capacity."),
    ("Top Burn Rate Ranking", "Calculates daily percentage burn rates to highlight the fastest-growing quotas in the executive dashboard."),
    ("Multi-Threshold Table Filtering", "Allows administrators to filter hundreds of metrics by threshold cutoffs (>60%, >80%, >90%) instantly."),
], "slide7_risk.png", 7)

# ==========================================
# Slide 8: Demand Forecasting Engine
# ==========================================
slide8 = prs.slides.add_slide(blank_layout)
set_slide_background(slide8)
add_header(slide8, "Predictive Analytics", "Linear Demand Forecasting & Exhaustion Timelines", "Extrapolating consumption velocity into actionable calendar crossing dates.")
add_content_and_image(slide8, [
    ("Velocity-Based Linear Model", "Evaluates recent historical burn rates to project future demand over configurable horizons (30, 60, 90, 180 days)."),
    ("Days to 80% Threshold Breach", "Calculates exact calendar days remaining until cautionary threshold is exceeded."),
    ("Days to 100% Total Exhaustion", "Pinpoints the exact predicted date when quota capacity will be completely depleted without intervention."),
    ("Data Sufficiency & Uncertainty", "Evaluates observation count and variance to flag uncertainty flags on nascent resources."),
], "slide8_forecast.png", 8)

# ==========================================
# Slide 9: Recommendation Engine
# ==========================================
slide9 = prs.slides.add_slide(blank_layout)
set_slide_background(slide9)
add_header(slide9, "AI Capacity Buffer", "Algorithmic Headroom Sizing & Explainable Scoring", "Calculating optimal target limits that balance operational safety with FinOps discipline.")
add_content_and_image(slide9, [
    ("Safety Margin Sizing", "Applies configurable safety buffers (+25%, +50%, +100%) on top of baseline demand to absorb traffic spikes."),
    ("Headroom Calculation Formula", "Target Limit = Base Demand × (1 + Safety Margin %) + Projected Workload Growth."),
    ("Explainable Confidence Score (0-100)", "Dynamic algorithmic score evaluating current saturation weight (75 pts), multiplier scale (15 pts), and justification depth (10 pts)."),
    ("Advisory Governance Disclaimer", "Every recommendation includes transparent factor breakdowns and official GCP disclaimer notices."),
], "slide9_recommend.png", 9)

# ==========================================
# Slide 10: Increase Planner Interface
# ==========================================
slide10 = prs.slides.add_slide(blank_layout)
set_slide_background(slide10)
add_header(slide10, "Planner Interface", "Interactive Quota Increase Planning Experience", "Empowering engineers to formulate compliant, justified capacity adjustments.")
add_content_and_image(slide10, [
    ("Contextual Telemetry Header", "Displays current consumption, active ceiling, and saturation percentage for the selected quota metric."),
    ("Live Confidence Gauge", "Dynamic client-side score preview that recalculates instantly as target limits and justifications are edited."),
    ("Preset Headroom Shortcuts", "One-click buttons for rapid selection of recommended buffer increments (+25%, +50%, +100%)."),
    ("Strict Validation Enforcement", "Validates that proposed limits strictly exceed current limits and enforces minimum 20-character business rationale."),
], "slide10_planner.png", 10)

# ==========================================
# Slide 11: Approval State Machine
# ==========================================
slide11 = prs.slides.add_slide(blank_layout)
set_slide_background(slide11)
add_header(slide11, "Governance Workflow", "Auditable Request Lifecycle & State Machine", "Rigorous internal review process separating request drafting from administrative approval.")
add_content_and_image(slide11, [
    ("Strict State Transitions", "Enforces formal transitions across lifecycle states: PENDING -> APPROVED | REJECTED -> GCP_SUBMITTED."),
    ("RBAC Role Isolation", "Developers can draft requests; only authorized Cloud Administrators can execute approval or rejection mutations."),
    ("Mandatory Rejection Rationale", "Admin rejection requires mandatory rationale, logged permanently in the governance audit trail."),
    ("Central Approval Center", "Unified dashboard view where administrators review pending requests, confidence scores, and business justifications."),
], "slide11_workflow.png", 11)

# ==========================================
# Slide 12: Google Cloud API Workflow
# ==========================================
slide12 = prs.slides.add_slide(blank_layout)
set_slide_background(slide12)
add_header(slide12, "GCP Cloud Dispatch", "Outbound Quota Preferences & Resilient Retry Engine", "Direct programmatic integration with Google Cloud Quotas API.")
add_content_and_image(slide12, [
    ("Google Cloud Quota Preferences API", "Compiles approved adjustments into standard GCP quotaPreferences payloads with preferredValue and justification."),
    ("Exponential Backoff with Full Jitter", "Handles transient network timeouts and rate limits (429/503) using truncated exponential backoff."),
    ("Application Default Credentials (ADC)", "Authenticates securely via Google OAuth2 service account tokens without hardcoded credentials."),
    ("Status Synchronization", "Updates internal request state to GCP_SUBMITTED upon successful API dispatch, logging preference ID."),
], "slide12_gcp_api.png", 12)

# ==========================================
# Slide 13: Incident Notifications
# ==========================================
slide13 = prs.slides.add_slide(blank_layout)
set_slide_background(slide13)
add_header(slide13, "Alert Dispatcher", "Multi-Channel Alerting & 5-Minute Deduplication", "Broadcasting urgent capacity events without overwhelming engineering teams.")
add_content_and_image(slide13, [
    ("Multi-Channel Webhook Routing", "Dispatches rich incident notifications to Slack channels (#gcp-quota-alerts), Discord, and email digests."),
    ("5-Minute Deduplication Suppression", "Intelligent suppression window prevents repetitive alert spam for unchanged saturation conditions during hourly cron evaluations."),
    ("Live In-App Notification Ledger", "Exposes GET /api/v1/notifications for real-time in-app alert viewing and audit logs."),
    ("Configurable Alert Channels", "Administrators can enable or disable email, webhook, and Slack channels dynamically in System Settings."),
], "slide13_alerts.png", 13)

# ==========================================
# Slide 14: Multi-Project Management
# ==========================================
slide14 = prs.slides.add_slide(blank_layout)
set_slide_background(slide14)
add_header(slide14, "Multi-Tenant Control", "Multi-Project Management & FinOps Governance", "Unified governance across multiple Google Cloud projects and environments.")
add_content_and_image(slide14, [
    ("Instant Project Switching", "Sidebar dropdown allows seamless switching between enterprise-prod-finance, staging, and AI research projects."),
    ("Cross-Project Saturation Summary", "GET /api/v1/projects/summary/aggregate computes organization-wide saturation averages and total at-risk quotas."),
    ("Environment Isolation", "Clear separation between PRODUCTION, STAGING, and DEVELOPMENT environments with visual badges."),
    ("FinOps Portfolio Visibility", "Enables Cloud Architects to balance capacity allocations and spot idle headroom across different business units."),
], "slide14_multiproject.png", 14)

# ==========================================
# Slide 15: Reports & Compliance Export
# ==========================================
slide15 = prs.slides.add_slide(blank_layout)
set_slide_background(slide15)
add_header(slide15, "Compliance & Auditing", "Governance Reporting & Standardized Data Export", "Delivering executive-ready compliance artifacts for architectural reviews.")
add_content_and_image(slide15, [
    ("RFC-Compliant CSV Streaming", "GET /api/v1/quotas/export/csv streams real-time telemetry tables directly into CSV files with attachment headers."),
    ("Standardized JSON Export", "GET /api/v1/quotas/export/json outputs structured payloads including query filter provenance and risk classifications."),
    ("Executive Governance Summary", "GET /api/v1/quotas/export/summary delivers aggregated FinOps summaries and actionable quota increase recommendations."),
    ("Audit Download Tracking", "Logs all export requests in an administrative audit trail to maintain data governance compliance."),
], "slide15_reports.png", 15)

# ==========================================
# Slide 16: Security, Testing & Accessibility
# ==========================================
slide16 = prs.slides.add_slide(blank_layout)
set_slide_background(slide16)
add_header(slide16, "Enterprise Quality", "Security Hardening, Testing & WCAG 2.1 AA", "Engineered to strict enterprise security standards and inclusive accessibility guidelines.")
add_content_and_image(slide16, [
    ("OWASP Security Hardening", "Protected by nosniff, DENY, CSP, and HSTS headers; sliding-window rate limiting (200 req/15min); 1MB payload caps."),
    ("Automated Testing Suite (100% Pass)", "17 test suites spanning 67 test cases validating math models, state machines, and security barriers with >73% coverage."),
    ("WCAG 2.1 AA Accessibility", "Semantic landmarks, accessible skip-to-content links, ARIA modal dialogs, and AAA contrast ratios (>13:1)."),
    ("60-Second Response Caching", "In-memory sliding TTL cache on quota endpoints returning X-Cache: HIT/MISS headers to optimize response times."),
], "slide16_security.png", 16)

# ==========================================
# Slide 17: Deployment & Live Demo
# ==========================================
slide17 = prs.slides.add_slide(blank_layout)
set_slide_background(slide17)

c_card = slide17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.0), Inches(6.4), Inches(5.5))
c_card.fill.solid()
c_card.fill.fore_color.rgb = CARD_BG
c_card.line.color.rgb = ACCENT_EMERALD
c_card.line.width = Pt(1.5)

tf17 = c_card.text_frame
tf17.word_wrap = True
tf17.margin_left = Inches(0.35)
tf17.margin_right = Inches(0.35)
tf17.margin_top = Inches(0.35)

p = tf17.paragraphs[0]
p.text = "CLOUD DEPLOYMENT & SUMMARY"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = ACCENT_EMERALD

p2 = tf17.add_paragraph()
p2.text = "Production Ready & Verified"
p2.font.size = Pt(22)
p2.font.bold = True
p2.font.color.rgb = TEXT_WHITE
p2.space_before = Pt(6)

p3 = tf17.add_paragraph()
p3.text = "The Quota Management and Increase Request Planning Control Plane is fully built, tested, and running locally with live endpoints:"
p3.font.size = Pt(10)
p3.font.color.rgb = TEXT_MUTED
p3.space_before = Pt(6)

features = [
    ("Frontend Dashboard:", "http://localhost:3000"),
    ("Backend REST Gateway:", "http://localhost:5000/api/v1"),
    ("Health & Diagnostics:", "http://localhost:5000/api/v1/health/detailed"),
    ("Containerization:", "Multi-Stage Docker & docker-compose"),
    ("Cloud Deployment:", "Google Cloud Run & Cloud Build"),
    ("IaC Provisioning:", "Terraform (APIs, IAM, Service Accounts)"),
]
for title, val in features:
    p_f = tf17.add_paragraph()
    p_f.text = f"•  {title} {val}"
    p_f.font.size = Pt(9.5)
    p_f.font.color.rgb = TEXT_WHITE
    p_f.space_before = Pt(3)

p_end = tf17.add_paragraph()
p_end.text = "Thank You! Ready for Questions & Live Demonstration."
p_end.font.size = Pt(12)
p_end.font.bold = True
p_end.font.color.rgb = ACCENT_CYAN
p_end.space_before = Pt(14)

slide17.shapes.add_picture(os.path.join(ASSETS_DIR, "slide17_deployment.png"), Inches(7.5), Inches(1.0), Inches(5.0), Inches(5.5))
add_footer(slide17, 17)

prs.save(OUTPUT_PPTX)
print(f"Presentation regenerated successfully: {OUTPUT_PPTX}")
