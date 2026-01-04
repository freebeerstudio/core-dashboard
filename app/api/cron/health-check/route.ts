import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron configuration - runs every 5 minutes
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  // Verify this is coming from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all active sites from database
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('site_id, domain, site_name')
      .eq('active', true);

    if (sitesError) {
      throw new Error(`Failed to fetch sites: ${sitesError.message}`);
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        message: 'No active sites to check',
        checks: 0
      });
    }

    // Check health of each site
    const healthChecks = await Promise.all(
      sites.map(async (site) => {
        const startTime = Date.now();
        let status = 'healthy';
        let responseTimeMs = 0;
        let statusCode = 0;

        try {
          const response = await fetch(`https://${site.domain}`, {
            method: 'GET',
            headers: { 'User-Agent': 'FreeBeer-HealthCheck/1.0' },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          responseTimeMs = Date.now() - startTime;
          statusCode = response.status;

          // Determine health status based on response
          if (response.ok) {
            if (responseTimeMs > 3000) {
              status = 'degraded'; // Slow but working
            } else {
              status = 'healthy';
            }
          } else if (response.status >= 500) {
            status = 'critical';
          } else {
            status = 'warning';
          }
        } catch (error) {
          // Site is down or unreachable
          status = 'critical';
          responseTimeMs = Date.now() - startTime;
          statusCode = 0;
        }

        // Insert health check result into database
        const { error: insertError } = await supabase
          .from('health_checks')
          .insert({
            site_id: site.site_id,
            status,
            response_time_ms: responseTimeMs,
            status_code: statusCode,
          });

        if (insertError) {
          console.error(`Failed to insert health check for ${site.domain}:`, insertError);
        }

        // Log critical events
        if (status === 'critical') {
          await supabase.from('system_events').insert({
            site_id: site.site_id,
            event_type: 'alert',
            severity: 'critical',
            description: `${site.site_name} is DOWN (${site.domain})`,
            metadata: {
              status_code: statusCode,
              response_time_ms: responseTimeMs,
            },
          });
        }

        return {
          site: site.site_name,
          domain: site.domain,
          status,
          responseTimeMs,
          statusCode,
        };
      })
    );

    return NextResponse.json({
      message: 'Health checks completed',
      timestamp: new Date().toISOString(),
      checks: healthChecks.length,
      results: healthChecks,
    });
  } catch (error) {
    console.error('Health check cron failed:', error);
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
