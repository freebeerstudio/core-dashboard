import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, domain')
      .in('status', ['production', 'development', 'staging']);

    if (sitesError) throw sitesError;

    // Calculate uptime for each site (last 24 hours)
    const uptimeData = await Promise.all(
      (sites || []).map(async (site) => {
        // Get health checks from last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: checks, error: checksError } = await supabase
          .from('health_checks')
          .select('status, checked_at, response_time_ms')
          .eq('site_id', site.id)
          .gte('checked_at', twentyFourHoursAgo)
          .order('checked_at', { ascending: false });

        if (checksError) {
          console.error(`Error fetching checks for ${site.site_name}:`, checksError);
          return null;
        }

        if (!checks || checks.length === 0) {
          return {
            site_id: site.id,
            site_name: site.name,
            domain: site.domain,
            uptime_percentage: null,
            total_checks: 0,
            healthy_checks: 0,
            avg_response_time: null,
            checks_last_24h: 0,
          };
        }

        // Calculate uptime percentage
        const healthyStatuses = ['healthy', 'degraded'];
        const healthyChecks = checks.filter(c => healthyStatuses.includes(c.status)).length;
        const uptimePercentage = (healthyChecks / checks.length) * 100;

        // Calculate average response time (only for successful checks)
        const successfulChecks = checks.filter(c => c.status === 'healthy' && c.response_time_ms);
        const avgResponseTime = successfulChecks.length > 0
          ? Math.round(successfulChecks.reduce((sum, c) => sum + c.response_time_ms, 0) / successfulChecks.length)
          : null;

        return {
          site_id: site.id,
          site_name: site.name,
          domain: site.domain,
          uptime_percentage: Math.round(uptimePercentage * 100) / 100, // 2 decimal places
          total_checks: checks.length,
          healthy_checks: healthyChecks,
          avg_response_time: avgResponseTime,
          checks_last_24h: checks.length,
          last_check: checks[0]?.checked_at,
        };
      })
    );

    // Filter out nulls and return
    const validData = uptimeData.filter(d => d !== null);

    return NextResponse.json({
      success: true,
      data: validData,
      period: 'last_24_hours',
    });
  } catch (error) {
    console.error('Uptime calculation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate uptime',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
