# FreeBeer.Studio Core Dashboard

**Status**: ✅ Production Ready
**Created**: 2026-01-03
**Last Updated**: 2026-01-04

---

## 🎯 What This Is

Real-time monitoring dashboard for all FreeBeer.Studio business units. Provides:
- Business unit health monitoring (every 5 minutes)
- LLM cost tracking (rolling 30-day window)
- Revenue tracking (Stripe integration)
- System events timeline (last 24 hours)
- Vercel deployment links

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

---

## 🌐 Live Environments

- **Production**: https://dashboard.freebeer.studio
- **Staging**: https://staging.freebeer.studio
- **Dev**: https://dev.freebeer.studio

---

## 🔌 API Endpoints

### Business Unit Health

**`GET /api/health`**

Returns current health status for all business units with latest check data.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "site_id": "uuid",
      "site_name": "HughMann.life",
      "domain": "hughmanni.life",
      "bu_name": "FreeBeer.Studio Core",
      "site_status": "production",
      "health_status": "healthy",
      "response_time_ms": 245,
      "last_check": "2026-01-03T21:05:04.000Z",
      "error_message": null,
      "status_badge": "healthy",
      "vercel_url": "https://vercel.com/freebeerstudio/hughmanni-life"
    }
  ]
}
```

**Status Badge Values:**
- `healthy` - Response time < 1000ms
- `warning` - Response time 1000-3000ms
- `critical` - Site down or error
- `unknown` - No health check data

---

### LLM Cost Tracking

**`GET /api/llm-costs`**

Returns LLM usage costs for rolling 30-day window.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cost_30d": 12.45,
    "avg_daily_cost": 0.42,
    "total_calls": 156,
    "most_used_model": "claude-sonnet-4",
    "cost_by_provider": {
      "anthropic": 8.30,
      "openai": 4.15
    }
  }
}
```

---

### Revenue Tracking

**`GET /api/revenue`**

Returns revenue data from Stripe webhooks (rolling 30-day).

**Response:**
```json
{
  "success": true,
  "data": {
    "total_revenue_30d": 299.00,
    "mrr": 99.00,
    "total_transactions": 3,
    "active_subscriptions": 2,
    "avg_daily_revenue": 9.97
  }
}
```

---

### System Events

**`GET /api/events`**

Returns recent system events from last 24 hours.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_type": "alert",
      "severity": "critical",
      "description": "HughMann.life is DOWN",
      "metadata": {
        "status_code": 0,
        "response_time_ms": 10000
      },
      "created_at": "2026-01-03T20:15:00.000Z",
      "time_ago": "2 hours ago"
    }
  ]
}
```

**Event Severity Levels:**
- `critical` - Site down, service failures
- `warning` - Performance degradation
- `info` - Normal operations

---

### Uptime Statistics

**`GET /api/uptime`**

Returns uptime percentage for all sites (last 24 hours).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "site_id": "uuid",
      "site_name": "HughMann.life",
      "domain": "hughmanni.life",
      "uptime_percentage": 99.8,
      "total_checks": 288,
      "successful_checks": 287,
      "failed_checks": 1
    }
  ]
}
```

---

### Stripe Configuration

**`GET /api/stripe/config`**

Returns Stripe publishable key for client-side integration.

**Response:**
```json
{
  "publishableKey": "pk_live_..."
}
```

---

### Health Check Cron Job

**`GET /api/cron/health-check`**

Automated health monitoring (runs every 5 minutes via Vercel Cron).

**Authentication Required:**
- Header: `Authorization: Bearer ${CRON_SECRET}`
- Only accessible from Vercel Cron service

**What it does:**
1. Fetches all active sites from database
2. Checks HTTP response for each site
3. Records response time and status code
4. Inserts health check into database
5. Logs critical events when sites are down

**Response:**
```json
{
  "message": "Health checks completed",
  "timestamp": "2026-01-03T21:05:04.000Z",
  "checks": 3,
  "results": [
    {
      "site": "HughMann.life",
      "domain": "hughmanni.life",
      "status": "healthy",
      "responseTimeMs": 245,
      "statusCode": 200
    }
  ]
}
```

---

## ⚙️ Environment Variables

Create `.env.local` with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Vercel Cron (Production only)
CRON_SECRET=your-random-secret
```

### Setting Up Stripe

1. **Create Stripe Account**: https://dashboard.stripe.com/register
2. **Get API Keys**: Dashboard → Developers → API keys
   - Copy Secret key → `STRIPE_SECRET_KEY`
   - Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Configure Webhook**:
   - Dashboard → Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://dashboard.freebeer.studio/api/stripe/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `invoice.paid`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`

4. **Add to Vercel**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add all three Stripe variables to Production, Preview, and Development

---

## 🏗️ Architecture

### Database Views

The dashboard uses optimized Supabase views for performance:

- **`dashboard_bu_health`** - Latest health check for each business unit
- **`dashboard_llm_costs`** - Aggregated LLM costs (30-day rolling)
- **`dashboard_recent_events`** - System events timeline (24 hours)
- **`dashboard_overview_stats`** - High-level metrics

Migration: `supabase/migrations/20260103_dashboard_views.sql`

### Automated Processes

**Health Check Cron** (Every 5 minutes):
- Configured in `vercel.json`
- Checks all sites in `production`, `staging`, `development` status
- Records response time, status code, and errors
- Logs critical events when sites are down

**Data Refresh** (Client-side):
- Dashboard auto-refreshes every 30 seconds
- Uses React `useEffect` with interval

---

## 📁 Project Structure

```
dashboard/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── health-check/route.ts  # Automated health monitoring
│   │   ├── stripe/
│   │   │   ├── config/route.ts        # Stripe publishable key
│   │   │   ├── webhook/route.ts       # Stripe webhook handler
│   │   │   └── subscriptions/route.ts # Subscription management
│   │   ├── health/route.ts            # BU health status
│   │   ├── llm-costs/route.ts         # LLM cost aggregation
│   │   ├── revenue/route.ts           # Revenue tracking
│   │   ├── events/route.ts            # System events (24hr)
│   │   └── uptime/route.ts            # Uptime statistics
│   └── page.tsx                       # Main dashboard UI
├── components/ui/                     # shadcn/ui components
├── lib/
│   ├── formatDate.ts                  # Timezone utilities (CST/CDT)
│   ├── supabase.ts                    # Supabase client
│   └── types.ts                       # TypeScript types
├── scripts/
│   └── seed-database.ts               # Database seeding
├── supabase/
│   └── migrations/                    # Database migrations
├── vercel.json                        # Vercel cron configuration
└── .env.local                         # Environment variables
```

---

## 🧪 Testing

### Manual Testing Checklist

**Health Monitoring:**
- [ ] Dashboard shows current health status
- [ ] Response times display correctly
- [ ] Timestamps show in Central Time (CST/CDT)
- [ ] Auto-refresh works (30 seconds)
- [ ] Vercel links work

**Revenue Tracking:**
- [ ] Revenue displays correctly
- [ ] MRR calculation accurate
- [ ] Active subscriptions count correct
- [ ] Handles zero revenue state

**LLM Costs:**
- [ ] Cost displays with 2 decimal places
- [ ] Progress bar shows correctly
- [ ] Handles zero usage state

**System Events:**
- [ ] Events display with correct severity
- [ ] Time ago formatting correct
- [ ] Handles empty state

**Cron Job:**
- [ ] Check Vercel cron logs for execution
- [ ] Verify health checks run every 5 minutes
- [ ] Confirm timestamps update in dashboard

### Testing All Three Environments

```bash
# Production
curl https://dashboard.freebeer.studio/api/health

# Staging
curl https://staging.freebeer.studio/api/health

# Dev
curl https://dev.freebeer.studio/api/health
```

---

## 🐛 Known Issues & Solutions

### Issue: Timestamps showing in UTC instead of CST
**Solution**: Use `formatCentralTime()` utility from `lib/formatDate.ts`

### Issue: Health check cron not running
**Solution**:
1. Verify `CRON_SECRET` environment variable exists in Vercel
2. Check Vercel cron logs: Dashboard → Settings → Crons
3. Ensure Vercel Pro plan is active (crons require Pro)

### Issue: Stripe webhook failing
**Solution**:
1. Verify webhook URL: `https://dashboard.freebeer.studio/api/stripe/webhook`
2. Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Review Vercel function logs for errors

---

## 📚 References

- **Database Schema**: `supabase/migrations/20260103_dashboard_views.sql`
- **Stripe Documentation**: https://stripe.com/docs
- **Vercel Cron Jobs**: https://vercel.com/docs/cron-jobs
- **Next.js 15**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs

---

## 🚢 Deployment

### GitHub Workflow

```bash
# Feature development
git checkout -b feature/my-feature
git commit -am "feat: Add my feature"
git push origin feature/my-feature

# Merge to dev → deploys to dev.freebeer.studio
git checkout dev
git merge feature/my-feature
git push origin dev

# Merge to staging → deploys to staging.freebeer.studio
git checkout staging
git merge dev
git push origin staging

# Merge to main → deploys to dashboard.freebeer.studio
git checkout main
git merge staging
git push origin main
```

### Vercel Configuration

**Deployment Settings:**
- **Production Branch**: `main` → dashboard.freebeer.studio
- **Preview Branches**: `staging`, `dev`
- **Domain Aliases**:
  - staging.freebeer.studio → staging branch
  - dev.freebeer.studio → dev branch

**Environment Variables:**
All variables should be added to all three environments (Production, Preview, Development).

---

**Built by**: Free Beer Studio
**Powered by**: Next.js 15, Supabase, Stripe, Vercel
