import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateView() {
  console.log('Updating dashboard_bu_health view...')

  // Read the migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/20260103_dashboard_views.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  // Extract just the dashboard_bu_health view SQL
  const viewSQL = `
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
`

  const { error } = await supabase.rpc('exec_sql', { sql: viewSQL })

  if (error) {
    console.error('Error updating view:', error)
    process.exit(1)
  }

  console.log('✅ View updated successfully')
}

updateView()
