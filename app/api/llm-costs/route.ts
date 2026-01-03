import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get LLM usage for rolling 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: usage, error } = await supabaseAdmin
      .from('llm_usage')
      .select('total_cost')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (error) {
      throw error
    }

    const totalCost = (usage || []).reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0)
    const avgDailyCost = usage && usage.length > 0 ? totalCost / 30 : 0

    return NextResponse.json({
      data: {
        total_cost_30d: parseFloat(totalCost.toFixed(2)),
        avg_daily_cost: parseFloat(avgDailyCost.toFixed(2)),
        total_calls: usage?.length || 0
      }
    })
  } catch (error: any) {
    console.error('LLM costs error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
