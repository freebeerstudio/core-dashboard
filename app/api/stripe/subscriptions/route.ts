import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import type Stripe from 'stripe'

// GET /api/stripe/subscriptions - List all subscriptions
export async function GET() {
  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.customer', 'data.latest_invoice'],
    })

    // Enrich with customer metadata from Supabase
    const enrichedSubscriptions = await Promise.all(
      subscriptions.data.map(async (sub: Stripe.Subscription) => {
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id

        // Get customer info from Supabase
        const { data: customerData } = await supabaseAdmin
          .from('customers')
          .select('customer_name, email')
          .eq('stripe_customer_id', customerId)
          .single()

        const customer = typeof sub.customer !== 'string' ? sub.customer as Stripe.Customer : null
        const subscription = sub as any // TypeScript workaround for Stripe types

        return {
          id: subscription.id,
          customer_id: customerId,
          customer_name: customerData?.customer_name || 'Unknown',
          customer_email: customerData?.email || customer?.email || '',
          status: subscription.status,
          current_period_start: new Date((subscription.current_period_start || 0) * 1000).toISOString(),
          current_period_end: new Date((subscription.current_period_end || 0) * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          amount: subscription.items.data[0]?.price?.unit_amount || 0,
          currency: subscription.items.data[0]?.price?.currency || 'usd',
          interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
          created: new Date((subscription.created || 0) * 1000).toISOString(),
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedSubscriptions,
      total: subscriptions.data.length,
    })
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscriptions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/stripe/subscriptions - Create a new subscription
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer_id, price_id } = body

    if (!customer_id || !price_id) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, price_id' },
        { status: 400 }
      )
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      items: [{ price: price_id }],
      expand: ['latest_invoice.payment_intent'],
    })

    const sub = subscription as any // TypeScript workaround for Stripe types

    // Record in Supabase
    await supabaseAdmin.from('subscriptions').insert({
      subscription_id: sub.id,
      customer_id,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_start: new Date((sub.current_period_start || 0) * 1000).toISOString(),
      current_period_end: new Date((sub.current_period_end || 0) * 1000).toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    console.error('Failed to create subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
