import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch all sites
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .in('status', ['production', 'development', 'staging'])

    if (sitesError) {
      throw sitesError
    }

    // For each site, get the latest health check
    const healthData = await Promise.all(
      (sites || []).map(async (site) => {
        const { data: healthCheck } = await supabaseAdmin
          .from('health_checks')
          .select('*')
          .eq('site_id', site.id)
          .order('checked_at', { ascending: false })
          .limit(1)
          .single()

        return {
          site_id: site.id,
          site_name: site.name,
          domain: site.domain,
          bu_name: site.bu_name,
          site_status: site.status,
          health_status: healthCheck?.status || 'unknown',
          response_time_ms: healthCheck?.response_time_ms || null,
          last_check: healthCheck?.checked_at || null,
          error_message: healthCheck?.error_message || null,
          status_badge: getStatusBadge(
            healthCheck?.status,
            healthCheck?.response_time_ms
          )
        }
      })
    )

    return NextResponse.json({ data: healthData })
  } catch (error: any) {
    console.error('Health check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getStatusBadge(
  status: string | undefined,
  responseTime: number | undefined | null
): string {
  // Status comes directly from health_checks table: 'healthy', 'warning', 'critical'
  if (status === 'healthy') return 'healthy'
  if (status === 'warning') return 'warning'
  if (status === 'critical') return 'critical'
  return 'unknown'
}
