import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/stripe/subscriptions/[id] - Get subscription details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subscription = await stripe.subscriptions.retrieve(id, {
      expand: ['customer', 'latest_invoice'],
    })

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    console.error('Failed to fetch subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/stripe/subscriptions/[id] - Update subscription
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { price_id, cancel_at_period_end } = body

    const updateData: any = {}

    if (price_id) {
      // Get current subscription to update the price
      const currentSub = await stripe.subscriptions.retrieve(id)
      updateData.items = [
        {
          id: currentSub.items.data[0].id,
          price: price_id,
        },
      ]
    }

    if (typeof cancel_at_period_end === 'boolean') {
      updateData.cancel_at_period_end = cancel_at_period_end
    }

    const subscription = await stripe.subscriptions.update(id, updateData)

    // Update in Supabase
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', id)

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/stripe/subscriptions/[id] - Cancel subscription immediately
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subscription = await stripe.subscriptions.cancel(id)

    // Update in Supabase
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', id)

    // Log event
    await supabaseAdmin.from('system_events').insert({
      event_type: 'subscription_canceled',
      severity: 'warning',
      description: `Subscription ${id} was canceled`,
      metadata: { subscription_id: id },
    })

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
