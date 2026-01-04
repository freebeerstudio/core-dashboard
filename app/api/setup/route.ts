import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🚀 Setting up dashboard database...')

    // Step 1: Create dashboard views
    const viewsSQL = `
-- Dashboard Views for FreeBeer.Studio Core Dashboard

-- View 1: Business Unit Health Summary
CREATE OR REPLACE VIEW dashboard_bu_health AS
SELECT
  s.id as site_id,
  s.name as site_name,
  s.domain,
  s.bu_name,
  s.status as site_status,
  hc.status as health_status,
  hc.response_time_ms,
  hc.checked_at as last_check,
  hc.error_message,
  CASE
    WHEN hc.status = 'up' AND hc.response_time_ms < 1000 THEN 'healthy'
    WHEN hc.status = 'up' AND hc.response_time_ms < 3000 THEN 'warning'
    WHEN hc.status = 'down' THEN 'critical'
    ELSE 'unknown'
  END as status_badge
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

-- View 2: LLM Cost Summary (Rolling 30-day)
CREATE OR REPLACE VIEW dashboard_llm_costs AS
SELECT
  COALESCE(SUM(cost), 0) as total_cost_30d,
  COALESCE(AVG(cost), 0) as avg_daily_cost,
  COUNT(*) as total_calls
FROM llm_usage
WHERE timestamp >= NOW() - INTERVAL '30 days';

-- View 3: Recent System Events (Last 24 hours)
CREATE OR REPLACE VIEW dashboard_recent_events AS
SELECT
  id,
  event_type,
  description,
  metadata,
  created_at,
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
    `

    const { error: viewsError } = await supabaseAdmin.rpc('exec_sql', {
      query: viewsSQL
    })

    if (viewsError) {
      console.error('Views error:', viewsError)
      return NextResponse.json({ error: 'Failed to create views: ' + viewsError.message }, { status: 500 })
    }

    // Step 2: Insert HughMann.life site if it doesn't exist
    const { data: existingSite } = await supabaseAdmin
      .from('sites')
      .select('id')
      .eq('domain', 'hughmanni.life')
      .single()

    if (!existingSite) {
      const { error: siteError } = await supabaseAdmin
        .from('sites')
        .insert({
          name: 'HughMann.life',
          domain: 'hughmanni.life',
          bu_name: 'Personal AI Infrastructure',
          status: 'development',
          uses_auth: false,
          uses_billing: false
        })

      if (siteError) {
        console.error('Site error:', siteError)
        return NextResponse.json({ error: 'Failed to create site: ' + siteError.message }, { status: 500 })
      }
    }

    // Step 3: Create initial system event
    const { error: eventError } = await supabaseAdmin
      .from('system_events')
      .insert({
        event_type: 'system',
        source: 'core_dashboard',
        title: 'Dashboard Initialized',
        description: 'FreeBeer.Studio Core Dashboard has been initialized',
        severity: 'info',
        metadata: { version: '1.0.0' }
      })

    if (eventError) {
      console.error('Event error:', eventError)
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard setup complete!',
      steps: [
        'Created dashboard views',
        'Initialized HughMann.life site',
        'Created system event'
      ]
    })

  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
