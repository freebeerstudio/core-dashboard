-- Dashboard Views for FreeBeer.Studio Core Dashboard
-- Created: 2026-01-03
-- Purpose: Create optimized views for dashboard data aggregation

-- =============================================================================
-- View 1: Business Unit Health Summary
-- =============================================================================
-- Aggregates latest health check data for each site/BU

CREATE OR REPLACE VIEW dashboard_bu_health AS
SELECT
  s.id as site_id,
  s.name as site_name,
  s.domain,
  s.bu_name,
  s.status as site_status,

  -- Latest health check data
  hc.status as health_status,
  hc.response_time_ms,
  hc.checked_at as last_check,
  hc.error_message,

  -- Status badge (healthy, degraded, warning, critical, unknown)
  CASE
    WHEN hc.status = 'healthy' THEN 'healthy'
    WHEN hc.status = 'degraded' THEN 'degraded'
    WHEN hc.status = 'warning' THEN 'warning'
    WHEN hc.status = 'critical' THEN 'critical'
    ELSE 'unknown'
  END as status_badge,

  -- Vercel project URL (v1 - simple link)
  CONCAT('https://vercel.com/freebeerstudio/', REPLACE(LOWER(s.domain), '.', '-')) as vercel_url

FROM sites s
LEFT JOIN LATERAL (
  SELECT status, response_time_ms, checked_at, error_message
  FROM health_checks
  WHERE site_id = s.id
  ORDER BY checked_at DESC
  LIMIT 1
) hc ON true
WHERE s.status IN ('production', 'development', 'staging')
ORDER BY s.bu_name;

-- =============================================================================
-- View 2: LLM Cost Summary (Rolling 30-day)
-- =============================================================================
-- Aggregates LLM costs for the dashboard cost panel

CREATE OR REPLACE VIEW dashboard_llm_costs AS
SELECT
  -- Total cost (rolling 30-day)
  COALESCE(SUM(cost), 0) as total_cost_30d,

  -- Daily average
  COALESCE(AVG(cost), 0) as avg_daily_cost,

  -- Count of API calls
  COUNT(*) as total_calls,

  -- Most used model
  (
    SELECT model_name
    FROM llm_usage
    WHERE timestamp >= NOW() - INTERVAL '30 days'
    GROUP BY model_name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as most_used_model,

  -- Cost breakdown by provider
  jsonb_object_agg(
    provider,
    provider_cost
  ) as cost_by_provider

FROM llm_usage
WHERE timestamp >= NOW() - INTERVAL '30 days'
LEFT JOIN LATERAL (
  SELECT
    provider,
    SUM(cost) as provider_cost
  FROM llm_usage
  WHERE timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY provider
) costs ON true;

-- =============================================================================
-- View 3: Recent System Events (Last 24 hours)
-- =============================================================================
-- Timeline of business operations events for dashboard

CREATE OR REPLACE VIEW dashboard_recent_events AS
SELECT
  id,
  event_type,
  description,
  metadata,
  created_at,

  -- Human-readable time ago
  CASE
    WHEN created_at > NOW() - INTERVAL '1 minute' THEN 'Just now'
    WHEN created_at > NOW() - INTERVAL '1 hour' THEN
      FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::TEXT || ' minutes ago'
    WHEN created_at > NOW() - INTERVAL '24 hours' THEN
      FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)::TEXT || ' hours ago'
    ELSE TO_CHAR(created_at, 'Mon DD at HH:MI AM')
  END as time_ago

FROM system_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 50;

-- =============================================================================
-- View 4: Dashboard Overview Stats
-- =============================================================================
-- High-level metrics for the dashboard header/summary

CREATE OR REPLACE VIEW dashboard_overview_stats AS
SELECT
  -- Business Units
  (SELECT COUNT(*) FROM sites WHERE status IN ('production', 'staging', 'development')) as total_bus,
  (SELECT COUNT(*) FROM sites s
   JOIN LATERAL (
     SELECT status FROM health_checks
     WHERE site_id = s.id
     ORDER BY checked_at DESC
     LIMIT 1
   ) hc ON hc.status = 'up'
   WHERE s.status = 'production') as healthy_bus,

  -- LLM Costs
  (SELECT COALESCE(SUM(cost), 0) FROM llm_usage WHERE timestamp >= NOW() - INTERVAL '30 days') as llm_cost_30d,

  -- Active Subscriptions
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,

  -- Recent Events
  (SELECT COUNT(*) FROM system_events WHERE created_at >= NOW() - INTERVAL '24 hours') as events_24h;

-- =============================================================================
-- Grant permissions (for authenticated users)
-- =============================================================================

GRANT SELECT ON dashboard_bu_health TO authenticated;
GRANT SELECT ON dashboard_llm_costs TO authenticated;
GRANT SELECT ON dashboard_recent_events TO authenticated;
GRANT SELECT ON dashboard_overview_stats TO authenticated;
