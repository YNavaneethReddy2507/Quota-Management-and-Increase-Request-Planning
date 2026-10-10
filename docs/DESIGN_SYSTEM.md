# UI/UX Design System Specification

## Visual Design Tokens
- **Primary Google Blue:** `#1a73e8` (Interactive controls, highlights, active navigation)
- **Critical Alert Red:** `#ea4335` (Utilization > 80%, rejection states, destructive actions)
- **Warning Amber:** `#fbbc04` (Utilization 60-80%, pending approvals, high priority review)
- **Success Emerald:** `#34a853` (Utilization < 60%, fulfilled quota preferences)
- **Surfaces:** Dark glassmorphic panels (`#0b1120`, `#0f172a`, `backdrop-blur-md`) with 1px border contrast (`#334155`).

## Typography
- **Primary Font:** Inter (`sans-serif`) for high-legibility UI controls and statistics.
- **Monospace Font:** JetBrains Mono for Google Cloud resource names, metric strings, units, and timestamps.

## Accessibility Principles
- **Multi-Modal Indicators:** Status is conveyed through both high-contrast color badges and text labels (`CRITICAL`, `WARNING`, `OPTIMAL`), ensuring WCAG compliance.
- **Keyboard Navigation & Focus Rings:** Interactive elements feature explicit `focus:ring-2` indicators.
