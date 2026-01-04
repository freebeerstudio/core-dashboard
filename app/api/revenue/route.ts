import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Get revenue events from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: revenueEvents, error: revenueError } = await supabase
      .from('revenue_events')
      .select('*')
      .eq('event_type', 'invoice_paid')
      .gte('invoice_date', thirtyDaysAgo)
      .order('invoice_date', { ascending: false })

    if (revenueError) throw revenueError

    // Calculate totals
    const totalRevenue30d = revenueEvents?.reduce((sum, event) => sum + (event.amount || 0), 0) || 0
    const totalTransactions = revenueEvents?.length || 0

    // Calculate MRR (Monthly Recurring Revenue) from active subscriptions
    const { data: activeSubscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trialing'])

    if (subsError) throw subsError

    // Get active subscription count
    const activeSubscriptionCount = activeSubscriptions?.length || 0

    // MRR placeholder - would need to fetch pricing data from Stripe for accurate calculation
    const mrr = 0

    // Calculate daily average
    const avgDailyRevenue = totalRevenue30d > 0 ? totalRevenue30d / 30 : 0

    return NextResponse.json({
      success: true,
      data: {
        total_revenue_30d: totalRevenue30d / 100, // Convert from cents to dollars
        mrr: mrr, // Monthly Recurring Revenue
        active_subscriptions: activeSubscriptionCount,
        total_transactions: totalTransactions,
        avg_daily_revenue: avgDailyRevenue / 100,
        recent_transactions: revenueEvents?.slice(0, 10).map(event => ({
          id: event.id,
          amount: event.amount / 100,
          currency: event.currency,
          date: event.invoice_date,
          customer_id: event.customer_id,
        })) || [],
      },
      period: 'last_30_days',
    })
  } catch (error) {
    console.error('Revenue calculation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate revenue',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
