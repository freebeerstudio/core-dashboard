# Core Dashboard - Deployment Validation Checklist

**Date**: 2026-01-04
**Validator**: Wayne Bridges
**Production URL**: https://dashboard.freebeer.studio

---

## 1. Health Monitoring

### Automated Health Checks
- [ ] **Wait 5 minutes** after latest deployment completes
- [ ] **Refresh dashboard** - "Last Check" timestamp should update to current time
- [ ] **Verify cron is running** - Check Vercel logs show successful health check executions every 5 minutes
- [ ] **Check all sites** - Each business unit shows current health status

### Health Status Display
- [ ] **Status badge colors** display correctly:
  - 🟢 Green = Healthy (response time < 1000ms)
  - 🟡 Yellow = Degraded (response time 1000-3000ms)
  - 🟠 Orange = Warning (4xx errors)
  - 🔴 Red = Critical (5xx errors or unreachable)
- [ ] **Response times** display in milliseconds
- [ ] **Last Check** shows in Central Time (CST or CDT with timezone label)
- [ ] **Vercel links** navigate to correct Vercel project

---

## 2. Critical Event Logging

### When Site is Down
- [ ] **Recent Events panel** shows critical alert: "[Site Name] is DOWN ([domain])"
- [ ] **Event severity** displays as critical (🔴)
- [ ] **Event timestamp** shows "X minutes ago" relative time
- [ ] **Event metadata** includes status code and response time

### Event Timeline
- [ ] **Multiple events** display in chronological order (newest first)
- [ ] **Time ago formatting** shows:
  - "Just now" (< 1 minute)
  - "X minutes ago" (< 1 hour)
  - "X hours ago" (< 24 hours)
  - "Mon DD at HH:MM AM/PM" (> 24 hours)
- [ ] **Empty state** displays when no events: "No recent events. Business operations events will appear here."

---

## 3. Revenue Tracking

### Stripe Integration
- [ ] **Total Revenue** displays correctly (last 30 days)
- [ ] **MRR** (Monthly Recurring Revenue) calculates accurately
- [ ] **Active Subscriptions** count is correct
- [ ] **Transaction count** matches Stripe dashboard
- [ ] **Average daily revenue** calculation is accurate

### Empty State
- [ ] If no revenue yet: "No revenue tracked yet. Revenue tracking begins when first payment is received."

---

## 4. LLM Cost Tracking

### Cost Display
- [ ] **Total cost** shows last 30 days with 2 decimal places
- [ ] **Progress bar** displays correctly:
  - Green (< 75% of $20 budget)
  - Yellow (75-90%)
  - Red (> 90%)
- [ ] **API call count** is accurate
- [ ] **Average daily cost** calculated correctly

### Empty State
- [ ] If no usage yet: "No LLM usage tracked yet. Cost tracker will activate when first API call is logged."

---

## 5. User Experience

### Page Performance
- [ ] **Initial load** < 2 seconds
- [ ] **Auto-refresh** updates data every 30 seconds
- [ ] **No console errors** in browser developer tools
- [ ] **All API endpoints** return 200 OK responses

### Timezone Display
- [ ] **All timestamps** show in Central Time (America/Chicago)
- [ ] **Timezone label** displays as "CST" or "CDT" appropriately
- [ ] **Format**: "MMM D, H:MM AM/PM CST" (e.g., "Jan 4, 9:30 PM CST")

### Responsive Design
- [ ] **Desktop** (1920x1080): 3-column layout displays correctly
- [ ] **Tablet** (768px): Layout adapts appropriately
- [ ] **Mobile** (390px): Single column layout works

---

## 6. All Three Environments

### Production
- [ ] **URL**: https://dashboard.freebeer.studio
- [ ] **Health checks** running every 5 minutes
- [ ] **Data** displays correctly
- [ ] **No errors** in Vercel function logs

### Staging
- [ ] **URL**: https://staging.freebeer.studio
- [ ] **Accessible** (password protection may be enabled)
- [ ] **Deployment** successful
- [ ] **Environment variables** configured

### Development
- [ ] **URL**: https://dev.freebeer.studio
- [ ] **Accessible** (password protection may be enabled)
- [ ] **Deployment** successful
- [ ] **Environment variables** configured

---

## 7. Vercel Configuration

### Cron Jobs
- [ ] **Health check cron** listed in Vercel → Settings → Crons
- [ ] **Schedule**: `*/5 * * * *` (every 5 minutes)
- [ ] **Path**: `/api/cron/health-check`
- [ ] **Last execution** shows recent timestamp
- [ ] **Execution logs** show 200 OK responses

### Environment Variables
- [ ] **NEXT_PUBLIC_SUPABASE_URL** set in all environments
- [ ] **SUPABASE_SERVICE_ROLE_KEY** set in all environments
- [ ] **STRIPE_SECRET_KEY** set in all environments
- [ ] **STRIPE_WEBHOOK_SECRET** set in all environments
- [ ] **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** set in all environments
- [ ] **CRON_SECRET** set in production

---

## 8. Database Verification

### Supabase Tables
- [ ] **sites** table has correct data
- [ ] **health_checks** table receiving new entries every 5 minutes
- [ ] **system_events** table logging critical events
- [ ] **subscriptions** table configured (if using Stripe subscriptions)
- [ ] **revenue_events** table configured (if tracking revenue)

### Database Views
- [ ] **dashboard_bu_health** view returns data
- [ ] **dashboard_llm_costs** view returns data
- [ ] **dashboard_recent_events** view returns data
- [ ] **dashboard_overview_stats** view returns data

---

## 9. API Endpoint Tests

Run these curl commands to verify all endpoints:

```bash
# Health Check
curl https://dashboard.freebeer.studio/api/health

# LLM Costs
curl https://dashboard.freebeer.studio/api/llm-costs

# Revenue
curl https://dashboard.freebeer.studio/api/revenue

# Events
curl https://dashboard.freebeer.studio/api/events

# Uptime
curl https://dashboard.freebeer.studio/api/uptime

# Stripe Config
curl https://dashboard.freebeer.studio/api/stripe/config
```

### Expected Results
- [ ] All endpoints return **200 OK**
- [ ] All responses have `{"success": true, "data": {...}}`
- [ ] No 500 errors in any endpoint
- [ ] Response times < 500ms

---

## 10. Common Issues Checklist

### If Health Checks Not Updating
- [ ] Check Vercel cron logs for errors
- [ ] Verify CRON_SECRET environment variable exists
- [ ] Confirm Vercel Pro plan is active
- [ ] Check database constraint errors in logs

### If Timestamps Show Wrong Time
- [ ] Verify `formatCentralTime()` utility is being used
- [ ] Check that `date-fns-tz` package is installed
- [ ] Confirm timezone is "America/Chicago"

### If Stripe Webhook Failing
- [ ] Verify webhook URL in Stripe dashboard
- [ ] Check STRIPE_WEBHOOK_SECRET matches Stripe
- [ ] Review Vercel function logs for webhook errors

---

## Validation Sign-Off

**Date Validated**: _______________
**Validated By**: _______________
**Status**: ☐ Pass | ☐ Issues Found (see below)

### Issues Found (if any):
```


```

### Resolution Notes:
```


```

---

**Next Steps After Validation**:
1. If all checks pass → Mark PRD as "Production Complete"
2. If issues found → Document in GitHub Issues
3. Update PAI project status
4. Begin Phase 3 planning (if approved)
