import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await supabaseAdmin.from('subscriptions').upsert({
          stripe_subscription_id: subscription.id,
          customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stripe_subscription_id'
        })

        await supabaseAdmin.from('system_events').insert({
          event_type: event.type,
          severity: 'info',
          description: `Subscription ${subscription.id} ${event.type === 'customer.subscription.created' ? 'created' : 'updated'}`,
          metadata: {
            subscription_id: subscription.id,
            status: subscription.status,
          },
        })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        await supabaseAdmin.from('system_events').insert({
          event_type: 'subscription_canceled',
          severity: 'warning',
          description: `Subscription ${subscription.id} was canceled`,
          metadata: { subscription_id: subscription.id },
        })

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        await supabaseAdmin.from('revenue_events').insert({
          event_type: 'invoice_paid',
          stripe_invoice_id: invoice.id,
          customer_id: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
          amount: invoice.amount_paid,
          currency: invoice.currency,
          subscription_id: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id || null,
          invoice_date: new Date(invoice.created * 1000).toISOString(),
        })

        await supabaseAdmin.from('system_events').insert({
          event_type: 'payment_received',
          severity: 'info',
          description: `Payment received: $${(invoice.amount_paid / 100).toFixed(2)}`,
          metadata: {
            invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
          },
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        await supabaseAdmin.from('system_events').insert({
          event_type: 'payment_failed',
          severity: 'critical',
          description: `Payment failed for invoice ${invoice.id}`,
          metadata: {
            invoice_id: invoice.id,
            amount: invoice.amount_due,
            customer_id: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
          },
        })

        break
      }

      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer

        await supabaseAdmin.from('customers').upsert({
          stripe_customer_id: customer.id,
          email: customer.email || '',
          customer_name: customer.name || customer.email || 'Unknown',
          metadata: customer.metadata,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stripe_customer_id'
        })

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
