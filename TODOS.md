# TODOS

## Push Alerting for At-Risk Projects

**What:** Add a scheduled daily/weekly job that checks for at-risk projects and sends a summary via WhatsApp or email to management.

**Why:** The Management Command Center dashboard is pull-based — management must open it to see alerts. A KRITIS project discovered on day 2 might not be seen until day 10. Push alerts close this gap.

**Context:** `node-cron` is already installed (`package.json`). `src/lib/sync-service.ts` shows the existing pattern for background jobs. Needs an external alerting channel: WhatsApp Business API or email SMTP. Credentials management required.

**Pros:** Highest impact improvement to risk visibility — management gets notified without needing to remember to check.

**Cons:** Requires external API integration and credentials. Scope is larger than the current feature.

**Depends on:** Management Command Center (AtRiskPanel + risk-criteria.ts) must be complete first.

---

## Mobile-Responsive Quick View

**What:** Responsive card view optimized for mobile, with filter by branch/status and optionally a read-only share link for management.

**Why:** Management may check project status on a phone. The current table layout in the dashboard is not mobile-friendly.

**Context:** This was Approach C from the `/office-hours` design session (`Andre-main-design-20260513-115749.md`). Explicitly deferred in favor of the Management Command Center first.

**Pros:** Expands dashboard usefulness to mobile context without changing the data model.

**Cons:** Requires responsive design work across existing components.

**Depends on:** Management Command Center complete.
