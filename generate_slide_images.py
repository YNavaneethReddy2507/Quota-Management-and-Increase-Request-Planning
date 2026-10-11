"""
Generate high-fidelity diagrams and charts for all 17 presentation slides.
Uses Matplotlib and Pillow with dark modern Cloud styling.
"""

import os
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.patches as patches

OUT_DIR = "presentation_assets"
os.makedirs(OUT_DIR, exist_ok=True)

# Common styling
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['text.color'] = '#F8FAFC'
plt.rcParams['axes.labelcolor'] = '#94A3B8'
plt.rcParams['xtick.color'] = '#94A3B8'
plt.rcParams['ytick.color'] = '#94A3B8'

def save_fig(fig, filename):
    filepath = os.path.join(OUT_DIR, filename)
    fig.savefig(filepath, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    print(f"Generated {filename}")

# --- Slide 1: Hero Graphic ---
def gen_slide1():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    # Draw cloud outline or governance shield
    circle = patches.Circle((0.5, 0.55), 0.35, color='#1E293B', ec='#3B82F6', lw=3)
    ax.add_patch(circle)
    inner_circle = patches.Circle((0.5, 0.55), 0.28, color='#0F172A', ec='#60A5FA', lw=1.5, ls='--')
    ax.add_patch(inner_circle)

    # Core Cloud Icon representation
    ax.text(0.5, 0.65, "☁️", fontsize=50, ha='center', va='center')
    ax.text(0.5, 0.52, "GCP CLOUD QUOTAS", fontsize=11, fontweight='bold', color='#38BDF8', ha='center')
    ax.text(0.5, 0.44, "Control Plane v1.0", fontsize=9, color='#94A3B8', ha='center')

    # Surrounding node tags
    nodes = [
        (0.2, 0.8, "Compute Engine\nCPUs & GPUs", "#EF4444"),
        (0.8, 0.8, "Cloud Storage\nHeadroom Buffer", "#10B981"),
        (0.2, 0.2, "Automated\nBackoff Retry", "#F59E0B"),
        (0.8, 0.2, "Internal RBAC\nApproval State", "#8B5CF6"),
    ]
    for x, y, label, col in nodes:
        box = patches.FancyBboxPatch((x-0.12, y-0.08), 0.24, 0.16, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(x, y, label, fontsize=8, color='#F8FAFC', ha='center', va='center', fontweight='bold')
        ax.plot([x, 0.5], [y, 0.55], color=col, lw=1.5, alpha=0.4, ls=':')

    save_fig(fig, "slide1_hero.png")

# --- Slide 2: Team Matrix ---
def gen_slide2():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    members = [
        ("Y. Navaneeth Reddy", "2400030020", "Lead Cloud Architect & Full-Stack", "#3B82F6"),
        ("Shivam Kumar Saw", "2400039056", "Backend & API Integration Specialist", "#10B981"),
        ("Niket Kumar", "2400033292", "DevOps & Cloud Infrastructure Lead", "#F59E0B"),
        ("Allam Sahithi", "2400033195", "Frontend UX & Testing Engineer", "#EC4899"),
    ]

    for idx, (name, reg, role, col) in enumerate(members):
        y = 0.82 - idx * 0.22
        box = patches.FancyBboxPatch((0.05, y-0.08), 0.9, 0.17, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        badge = patches.Circle((0.13, y), 0.05, color=col)
        ax.add_patch(badge)
        ax.text(0.13, y, f"0{idx+1}", fontsize=10, fontweight='bold', color='#0F172A', ha='center', va='center')

        ax.text(0.22, y+0.03, name, fontsize=11, fontweight='bold', color='#F8FAFC', va='center')
        ax.text(0.68, y+0.03, f"ID: {reg}", fontsize=9, fontfamily='monospace', color=col, va='center', fontweight='bold')
        ax.text(0.22, y-0.03, f"Role: {role}", fontsize=8.5, color='#94A3B8', va='center')

    save_fig(fig, "slide2_team.png")

# --- Slide 3: Problem Diagram ---
def gen_slide3():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    # Draw 3 pain point cards
    issues = [
        ("Silent Outages", "Surprise 429 quota breach during high-priority production migrations.", "#EF4444", 0.75),
        ("Manual Governance", "Days lost to slow ticketing without standardized justification checks.", "#F59E0B", 0.48),
        ("Blind Scaling", "Zero cross-project burn rate visibility across multi-tenant departments.", "#8B5CF6", 0.21),
    ]

    for title, desc, col, y in issues:
        box = patches.FancyBboxPatch((0.08, y-0.09), 0.84, 0.18, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(0.12, y+0.04, f"⚠️ {title}", fontsize=11, fontweight='bold', color=col, va='center')
        ax.text(0.12, y-0.03, desc, fontsize=8.5, color='#CBD5E1', va='center')

    save_fig(fig, "slide3_problem.png")

# --- Slide 4: 4 Pillars of Solution ---
def gen_slide4():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    pillars = [
        ("1. Live Ingestion", "Real-time sync with Cloud Quotas\nand Cloud Monitoring telemetry.", 0.28, 0.72, "#38BDF8"),
        ("2. Risk & Forecast", "Early detection at 80% saturation\nwith burn rate extrapolations.", 0.72, 0.72, "#F59E0B"),
        ("3. Approval RBAC", "Internal review state machine with\nauditable admin comments.", 0.28, 0.28, "#8B5CF6"),
        ("4. Auto Dispatch", "Quota increase submission with\nexponential backoff retries.", 0.72, 0.28, "#10B981"),
    ]

    for title, desc, x, y, col in pillars:
        box = patches.FancyBboxPatch((x-0.21, y-0.18), 0.42, 0.36, boxstyle="round,pad=0.04", fc='#1E293B', ec=col, lw=2.5)
        ax.add_patch(box)
        ax.text(x, y+0.08, title, fontsize=10.5, fontweight='bold', color=col, ha='center', va='center')
        ax.text(x, y-0.04, desc, fontsize=8, color='#CBD5E1', ha='center', va='center')

    save_fig(fig, "slide4_solution.png")

# --- Slide 5: System Architecture ---
def gen_slide5():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    layers = [
        ("Presentation Layer", "React 18, Vite 6, Tailwind CSS, Lucide Icons (Port 3000)", "#3B82F6", 0.8),
        ("API Gateway Layer", "Express REST Gateway, RBAC Guard, Rate Limiter (Port 5000)", "#06B6D4", 0.55),
        ("Core Service Engines", "Forecasting, Recommendation, Submission, Notification", "#8B5CF6", 0.3),
        ("External & Persistence", "Google Cloud Quotas API, Cloud Monitoring MQL, MySQL 8.0", "#10B981", 0.05),
    ]

    for title, desc, col, y in layers:
        box = patches.FancyBboxPatch((0.08, y), 0.84, 0.16, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(0.5, y+0.11, title, fontsize=10, fontweight='bold', color=col, ha='center')
        ax.text(0.5, y+0.04, desc, fontsize=7.5, color='#E2E8F0', ha='center')
        if y < 0.8:
            ax.annotate('', xy=(0.5, y+0.18), xytext=(0.5, y+0.22),
                        arrowprops=dict(arrowstyle="->", color='#64748B', lw=1.5))

    save_fig(fig, "slide5_arch.png")

# --- Slide 6: Telemetry Ingestion Chart ---
def gen_slide6():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')

    days = np.arange(1, 31)
    # Simulated CPU telemetry
    usage = 50 + 1.4 * days + np.random.normal(0, 1.5, len(days))
    limit = np.full(len(days), 100)

    ax.plot(days, limit, color='#EF4444', lw=2, ls='--', label='Hard Quota Ceiling (100 CPUs)')
    ax.plot(days, limit * 0.8, color='#F59E0B', lw=1.5, ls=':', label='80% Early Warning Line')
    ax.fill_between(days, 0, usage, color='#3B82F6', alpha=0.3)
    ax.plot(days, usage, color='#60A5FA', lw=2.5, marker='o', markersize=3, label='Active Ingested Telemetry')

    ax.set_title("Live Cloud Monitoring Ingestion (30-Day Window)", fontsize=10.5, fontweight='bold', color='#F8FAFC', pad=12)
    ax.set_xlabel("Observation Days", fontsize=8.5)
    ax.set_ylabel("Quota Consumption Units", fontsize=8.5)
    ax.set_ylim(0, 120)
    ax.grid(True, color='#334155', ls='-', alpha=0.5)
    ax.legend(loc='upper left', fontsize=7.5, facecolor='#0F172A', edgecolor='#334155')

    save_fig(fig, "slide6_telemetry.png")

# --- Slide 7: Saturation & Risk Gauge ---
def gen_slide7():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    categories = [
        ("NORMAL (< 60%)", "Stable capacity; no action required.", "#10B981", 0.78),
        ("MODERATE (60% - 80%)", "Approaching caution threshold; burn monitored.", "#06B6D4", 0.54),
        ("HIGH RISK (80% - 90%)", "Critical saturation warning; request advised.", "#F59E0B", 0.30),
        ("CRITICAL (>= 90%)", "Imminent outage; automated escalation triggered.", "#EF4444", 0.06),
    ]

    for title, desc, col, y in categories:
        box = patches.FancyBboxPatch((0.08, y), 0.84, 0.16, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(0.12, y+0.1, title, fontsize=10, fontweight='bold', color=col)
        ax.text(0.12, y+0.04, desc, fontsize=8, color='#E2E8F0')

    save_fig(fig, "slide7_risk.png")

# --- Slide 8: Forecasting Chart ---
def gen_slide8():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')

    hist_days = np.arange(-15, 1)
    hist_usage = 70 + 1.5 * hist_days
    future_days = np.arange(0, 25)
    future_usage = 70 + 1.8 * future_days

    ax.plot(hist_days, hist_usage, color='#38BDF8', lw=2.5, label='Historical Observation')
    ax.plot(future_days, future_usage, color='#F59E0B', lw=2.5, ls='--', label='Linear Projected Demand')
    ax.axhline(y=100, color='#EF4444', lw=2, ls='-', label='Quota Limit (100 Units)')
    ax.axhline(y=80, color='#EAB308', lw=1.5, ls=':', label='80% Risk Crossing')

    # Breach point
    ax.plot([16.6], [100], marker='X', color='#EF4444', markersize=10)
    ax.annotate("Total Exhaustion\n(Day 17)", xy=(16.6, 100), xytext=(12, 110),
                arrowprops=dict(arrowstyle="->", color='#EF4444', lw=1.5),
                fontsize=8, color='#EF4444', fontweight='bold')

    ax.set_title("Demand Forecasting & Exhaustion Timeline", fontsize=10.5, fontweight='bold', color='#F8FAFC', pad=12)
    ax.set_xlabel("Timeline (Days from Today)", fontsize=8.5)
    ax.set_ylabel("Usage Units", fontsize=8.5)
    ax.grid(True, color='#334155', ls='-', alpha=0.5)
    ax.legend(loc='upper left', fontsize=7.5, facecolor='#0F172A', edgecolor='#334155')

    save_fig(fig, "slide8_forecast.png")

# --- Slide 9: Recommendation Formula Graphic ---
def gen_slide9():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    # Recommendation breakdown
    box = patches.FancyBboxPatch((0.08, 0.55), 0.84, 0.38, boxstyle="round,pad=0.03", fc='#1E293B', ec='#10B981', lw=2)
    ax.add_patch(box)
    ax.text(0.5, 0.85, "TARGET CAPACITY FORMULA", fontsize=11, fontweight='bold', color='#10B981', ha='center')
    ax.text(0.5, 0.74, "Target Limit = Base Usage × (1 + Safety Margin) + Growth", fontsize=9, fontfamily='monospace', color='#F8FAFC', ha='center')
    ax.text(0.5, 0.63, "e.g. 92 Units × (1 + 0.25) + 0 = 115 Units (+25% Headroom)", fontsize=8.5, color='#94A3B8', ha='center')

    # Confidence score gauge preview
    box2 = patches.FancyBboxPatch((0.08, 0.08), 0.84, 0.4, boxstyle="round,pad=0.03", fc='#1E293B', ec='#3B82F6', lw=2)
    ax.add_patch(box2)
    ax.text(0.5, 0.40, "EXPLAINABLE CONFIDENCE SCORING (0-100)", fontsize=10, fontweight='bold', color='#60A5FA', ha='center')
    ax.text(0.5, 0.30, "• Current Saturation Weight: Up to 75 pts\n• Moderate Request Multiplier: Up to 15 pts\n• Robust Business Justification: Up to 10 pts", fontsize=8, color='#CBD5E1', ha='center')
    ax.text(0.5, 0.15, "Result: 92/100 -> HIGH APPROVAL PROBABILITY", fontsize=9, fontweight='bold', color='#10B981', ha='center')

    save_fig(fig, "slide9_recommend.png")

# --- Slide 10: Increase Planner UI Mockup Card ---
def gen_slide10():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    # Modal window container
    box = patches.FancyBboxPatch((0.06, 0.06), 0.88, 0.88, boxstyle="round,pad=0.04", fc='#1E293B', ec='#64748B', lw=2)
    ax.add_patch(box)

    # Modal Title Header
    ax.text(0.12, 0.86, "Plan Quota Increase Request", fontsize=11, fontweight='bold', color='#F8FAFC')
    ax.text(0.12, 0.81, "compute.googleapis.com/cpus • us-central1", fontsize=8, fontfamily='monospace', color='#38BDF8')

    # Current telemetry cards
    for idx, (label, val) in enumerate([("Usage", "92"), ("Current Limit", "100"), ("Saturation", "92%")]):
        bx = patches.FancyBboxPatch((0.12 + idx*0.26, 0.65), 0.22, 0.12, boxstyle="round,pad=0.02", fc='#0F172A', ec='#334155')
        ax.add_patch(bx)
        ax.text(0.23 + idx*0.26, 0.73, label, fontsize=7, color='#94A3B8', ha='center')
        ax.text(0.23 + idx*0.26, 0.68, val, fontsize=10, fontweight='bold', color='#EF4444' if idx==2 else '#F8FAFC', ha='center')

    # Preset sizing buttons
    ax.text(0.12, 0.58, "Preset Headroom Options:", fontsize=8, color='#94A3B8')
    presets = [("+25% (125)", "#3B82F6"), ("+50% (150)", "#10B981"), ("+100% (200)", "#8B5CF6")]
    for idx, (lbl, col) in enumerate(presets):
        btn = patches.FancyBboxPatch((0.12 + idx*0.26, 0.46), 0.23, 0.09, boxstyle="round,pad=0.02", fc=col)
        ax.add_patch(btn)
        ax.text(0.235 + idx*0.26, 0.505, lbl, fontsize=7.5, fontweight='bold', color='#FFFFFF', ha='center', va='center')

    # Confidence score gauge
    gauge = patches.FancyBboxPatch((0.12, 0.22), 0.76, 0.18, boxstyle="round,pad=0.03", fc='#0F172A', ec='#10B981', lw=1.5)
    ax.add_patch(gauge)
    ax.text(0.5, 0.33, "Approval Confidence Gauge: 94 / 100", fontsize=9, fontweight='bold', color='#10B981', ha='center')
    ax.text(0.5, 0.26, "Optimal buffer selected • 50+ char justification entered", fontsize=7.5, color='#CBD5E1', ha='center')

    # Submit button
    sub = patches.FancyBboxPatch((0.28, 0.10), 0.44, 0.08, boxstyle="round,pad=0.02", fc='#2563EB')
    ax.add_patch(sub)
    ax.text(0.5, 0.14, "Submit for Internal Approval ➔", fontsize=8, fontweight='bold', color='#FFFFFF', ha='center', va='center')

    save_fig(fig, "slide10_planner.png")

# --- Slide 11: Workflow State Machine Flowchart ---
def gen_slide11():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    states = [
        ("DRAFT / PENDING", 0.5, 0.82, "#F59E0B"),
        ("APPROVED (Admin)", 0.25, 0.5, "#10B981"),
        ("REJECTED (Admin)", 0.75, 0.5, "#EF4444"),
        ("GCP_SUBMITTED", 0.25, 0.2, "#3B82F6"),
    ]

    for label, x, y, col in states:
        box = patches.FancyBboxPatch((x-0.18, y-0.08), 0.36, 0.16, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2.5)
        ax.add_patch(box)
        ax.text(x, y, label, fontsize=9, fontweight='bold', color='#F8FAFC', ha='center', va='center')

    # Arrows
    ax.annotate('', xy=(0.3, 0.58), xytext=(0.45, 0.74), arrowprops=dict(arrowstyle="->", color='#10B981', lw=2))
    ax.annotate('', xy=(0.7, 0.58), xytext=(0.55, 0.74), arrowprops=dict(arrowstyle="->", color='#EF4444', lw=2))
    ax.annotate('', xy=(0.25, 0.28), xytext=(0.25, 0.42), arrowprops=dict(arrowstyle="->", color='#3B82F6', lw=2))

    save_fig(fig, "slide11_workflow.png")

# --- Slide 12: GCP API & Exponential Backoff Diagram ---
def gen_slide12():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    retries = [
        ("Attempt 1", "Immediate dispatch (t = 0s)", "#38BDF8", 0.8),
        ("Attempt 2 (429/503)", "Delay = 500ms + Jitter", "#F59E0B", 0.55),
        ("Attempt 3 (Retry)", "Delay = 1000ms + Jitter", "#FB923C", 0.3),
        ("GCP Response", "quotaPreference ID generated / updated", "#10B981", 0.05),
    ]

    for title, desc, col, y in retries:
        box = patches.FancyBboxPatch((0.08, y), 0.84, 0.16, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(0.12, y+0.1, title, fontsize=9.5, fontweight='bold', color=col)
        ax.text(0.12, y+0.04, desc, fontsize=8, color='#E2E8F0')

    save_fig(fig, "slide12_gcp_api.png")

# --- Slide 13: Alerts & Deduplication Timeline ---
def gen_slide13():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    # Alert flow
    box = patches.FancyBboxPatch((0.08, 0.54), 0.84, 0.38, boxstyle="round,pad=0.03", fc='#1E293B', ec='#F59E0B', lw=2)
    ax.add_patch(box)
    ax.text(0.5, 0.84, "MULTI-CHANNEL INCIDENT ROUTING", fontsize=10.5, fontweight='bold', color='#F59E0B', ha='center')
    ax.text(0.5, 0.72, "Webhook Engine -> Slack (#gcp-quota-alerts) | Discord | Email Digest", fontsize=8, color='#E2E8F0', ha='center')
    ax.text(0.5, 0.61, "Payload includes: Metric, Region, Utilization %, Requester, Direct Link", fontsize=7.5, color='#94A3B8', ha='center')

    box2 = patches.FancyBboxPatch((0.08, 0.08), 0.84, 0.38, boxstyle="round,pad=0.03", fc='#1E293B', ec='#10B981', lw=2)
    ax.add_patch(box2)
    ax.text(0.5, 0.38, "5-MINUTE DEDUPLICATION SUPPRESSION", fontsize=10.5, fontweight='bold', color='#10B981', ha='center')
    ax.text(0.5, 0.26, "Prevents notification fatigue during recurring hourly cron evaluations.", fontsize=8, color='#E2E8F0', ha='center')
    ax.text(0.5, 0.15, "Status: SUPPRESSED if alert condition unchanged within 300s window.", fontsize=7.5, fontfamily='monospace', color='#34D399', ha='center')

    save_fig(fig, "slide13_alerts.png")

# --- Slide 14: Multi-Project Chart ---
def gen_slide14():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#1E293B')

    projects = ['enterprise-prod', 'enterprise-staging', 'ai-research-dev']
    avg_util = [81.5, 67.5, 24.0]
    colors = ['#EF4444', '#F59E0B', '#10B981']

    bars = ax.barh(projects, avg_util, color=colors, height=0.5)
    ax.set_xlim(0, 100)
    ax.set_title("Cross-Project Saturation Distribution", fontsize=10.5, fontweight='bold', color='#F8FAFC', pad=12)
    ax.set_xlabel("Average Quota Utilization (%)", fontsize=8.5)
    ax.grid(True, color='#334155', ls='-', axis='x', alpha=0.5)

    for bar, val in zip(bars, avg_util):
        ax.text(val + 2, bar.get_y() + bar.get_height()/2, f"{val}%",
                va='center', fontsize=8.5, fontweight='bold', color='#F8FAFC')

    save_fig(fig, "slide14_multiproject.png")

# --- Slide 15: Reports & Export Flow ---
def gen_slide15():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    boxes = [
        ("RFC-Compliant CSV Streaming", "GET /api/v1/quotas/export/csv\nInstant download with risk tags and current headroom.", "#10B981", 0.72),
        ("Standardized JSON Export", "GET /api/v1/quotas/export/json\nFull structured metadata and query filter provenance.", "#38BDF8", 0.42),
        ("Executive Governance Summary", "GET /api/v1/quotas/export/summary\nFinOps recommendations and system-wide saturation audit.", "#8B5CF6", 0.12),
    ]

    for title, desc, col, y in boxes:
        box = patches.FancyBboxPatch((0.08, y), 0.84, 0.22, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(0.12, y+0.15, title, fontsize=9.5, fontweight='bold', color=col)
        ax.text(0.12, y+0.07, desc, fontsize=7.5, color='#E2E8F0')

    save_fig(fig, "slide15_reports.png")

# --- Slide 16: Security & Testing Infographic ---
def gen_slide16():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    items = [
        ("OWASP Security Headers", "nosniff, DENY, CSP, HSTS configured across API", "#38BDF8", 0.78),
        ("Role-Based Access Control", "Strict 403 Forbidden on non-admin approval attempts", "#F59E0B", 0.54),
        ("Automated Test Suite", "17/17 Suites Passing • 67/67 Tests Passed (100%)", "#10B981", 0.30),
        ("WCAG 2.1 AA Accessibility", "Skip links, ARIA dialogs, AAA color contrast verified", "#EC4899", 0.06),
    ]

    for title, desc, col, y in items:
        box = patches.FancyBboxPatch((0.08, y), 0.84, 0.16, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(0.12, y+0.1, f"✓ {title}", fontsize=9.5, fontweight='bold', color=col)
        ax.text(0.12, y+0.04, desc, fontsize=8, color='#E2E8F0')

    save_fig(fig, "slide16_security.png")

# --- Slide 17: Deployment Topology ---
def gen_slide17():
    fig, ax = plt.subplots(figsize=(6, 4.5), facecolor='#0F172A')
    ax.set_facecolor('#0F172A')
    ax.axis('off')

    deploy_boxes = [
        ("Multi-Stage Docker", "Minimal Alpine containers for both backend & frontend", "#38BDF8", 0.78),
        ("Google Cloud Run", "Serverless, auto-scaling microservices in us-central1", "#10B981", 0.54),
        ("Terraform Infrastructure", "Automated provisioning of IAM roles & Quota APIs", "#8B5CF6", 0.30),
        ("GitHub Actions CI/CD", "Automated multi-job lint, test, coverage & build pipelines", "#F59E0B", 0.06),
    ]

    for title, desc, col, y in deploy_boxes:
        box = patches.FancyBboxPatch((0.08, y), 0.84, 0.16, boxstyle="round,pad=0.03", fc='#1E293B', ec=col, lw=2)
        ax.add_patch(box)
        ax.text(0.12, y+0.1, f"🚀 {title}", fontsize=9.5, fontweight='bold', color=col)
        ax.text(0.12, y+0.04, desc, fontsize=8, color='#E2E8F0')

    save_fig(fig, "slide17_deployment.png")

if __name__ == "__main__":
    gen_slide1()
    gen_slide2()
    gen_slide3()
    gen_slide4()
    gen_slide5()
    gen_slide6()
    gen_slide7()
    gen_slide8()
    gen_slide9()
    gen_slide10()
    gen_slide11()
    gen_slide12()
    gen_slide13()
    gen_slide14()
    gen_slide15()
    gen_slide16()
    gen_slide17()
    print("All 17 presentation assets generated successfully!")
