# FreeBeer.Studio Core Dashboard

**Status**: ✅ Week 3 Day 1 Complete (Foundation Built)
**Created**: 2026-01-03
**Phase**: 2 - Development
**Week**: 3 of 7

---

## 🎯 What This Is

Real-time monitoring dashboard for all FreeBeer.Studio business units (BUs). Provides:
- BU health status and response times
- LLM cost tracking (rolling 30-day window)
- System events timeline
- Vercel deployment links (v1 - simple links)

---

## 🚀 Quick Start

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000
```

---

## 📁 Key Files

```
dashboard/
├── app/
│   ├── api/
│   │   ├── health/route.ts       # BU health check endpoint
│   │   ├── llm-costs/route.ts    # LLM cost aggregation
│   │   ├── events/route.ts       # System events (24hr)
│   │   └── setup/route.ts        # Database initialization
│   └── page.tsx                  # Main dashboard (client component)
├── components/ui/                # shadcn/ui components
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── types.ts                 # TypeScript types
└── .env.local                   # Environment variables
```

---

## 🔌 API Endpoints

### `GET /api/health` - Business Unit Health
Returns health status for all BUs with response times and status badges.

### `GET /api/llm-costs` - LLM Cost Summary
Returns rolling 30-day LLM usage costs and call counts.

### `GET /api/events` - Recent Events
Returns system events from last 24 hours with formatted timestamps.

### `POST /api/setup` - Database Setup
One-time initialization to create views and seed data.

---

## 🎨 Features

### ✅ Completed (Week 3 Day 1)

1. **Project Foundation**
   - Next.js 15 with App Router
   - TypeScript + Tailwind CSS
   - shadcn/ui components
   - Supabase integration

2. **Dashboard UI**
   - 3-column responsive layout
   - Real-time BU health cards
   - LLM cost tracker with progress bar
   - System events timeline
   - Auto-refresh every 30 seconds

3. **API Routes**
   - Health monitoring
   - Cost aggregation
   - Event tracking

### 🔲 Next Steps (Week 3 Day 2-7)

- [ ] Run database setup
- [ ] Implement 5-minute health check cron
- [ ] Deploy to Vercel
- [ ] Configure production env vars

---

## 🐛 Known Issues

1. Need to run `/api/setup` to initialize database views
2. Health check cron job not yet implemented
3. Database empty until setup completes

---

## 📚 References

- **PRD**: `~/Obsidian/FreeBeer.Studio/Projects/PRD-core-dashboard.md`
- **Kickoff**: `~/Obsidian/FreeBeer.Studio/Projects/PHASE-2-KICKOFF.md`
- **Schema**: `~/Obsidian/FreeBeer.Studio/Resources/Build-Documentation/DATABASE-SCHEMA-FIXED.sql`

---

**Last Updated**: 2026-01-03
