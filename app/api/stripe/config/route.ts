import { NextResponse } from 'next/server'
import { getStripePublishableKey } from '@/lib/stripe'

export async function GET() {
  try {
    const publishableKey = getStripePublishableKey()

    if (!publishableKey) {
      return NextResponse.json(
        { error: 'Stripe configuration not available' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      publishableKey,
    })
  } catch (error) {
    console.error('Failed to get Stripe config:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve Stripe configuration' },
      { status: 500 }
    )
  }
}
