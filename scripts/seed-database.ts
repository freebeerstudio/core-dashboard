#!/usr/bin/env tsx
/**
 * Database Seeding Script for FreeBeer.Studio Dashboard
 *
 * This script:
 * 1. Creates HughMann.life site record
 * 2. Creates initial health check
 * 3. Creates initial system event
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // 1. Create HughMann.life site
    console.log('📦 Step 1: Creating HughMann.life site...')

    const { data: existingSite } = await supabase
      .from('sites')
      .select('id')
      .eq('domain', 'hughmanni.life')
      .single()

    let siteId: string

    if (existingSite) {
      console.log('   ℹ️  Site already exists, using existing ID')
      siteId = existingSite.id
    } else {
      const { data: newSite, error: siteError } = await supabase
        .from('sites')
        .insert({
          name: 'HughMann.life',
          domain: 'hughmanni.life',
          bu_name: 'Personal AI Infrastructure',
          status: 'development',
          uses_auth: false,
          uses_billing: false,
          uses_idea_engine: false,
          uses_newsletter: false
        })
        .select('id')
        .single()

      if (siteError) throw siteError
      siteId = newSite.id
      console.log('   ✅ Site created successfully')
    }

    // 2. Create initial health check
    console.log('\n📊 Step 2: Creating initial health check...')

    const { error: healthError } = await supabase
      .from('health_checks')
      .insert({
        site_id: siteId,
        status: 'healthy',
        response_time_ms: 245,
        endpoint: 'https://hughmanni.life',
        status_code: 200,
        checked_at: new Date().toISOString()
      })

    if (healthError) {
      console.log('   ⚠️  Health check insert failed (may already exist):', healthError.message)
    } else {
      console.log('   ✅ Health check created')
    }

    // 3. Create system event
    console.log('\n📝 Step 3: Creating system event...')

    const { error: eventError } = await supabase
      .from('system_events')
      .insert({
        event_type: 'system',
        source: 'core_dashboard',
        title: 'Dashboard Initialized',
        description: 'FreeBeer.Studio Core Dashboard has been initialized',
        severity: 'info',
        metadata: {
          version: '1.0.0',
          pilot_bu: 'HughMann.life'
        }
      })

    if (eventError) {
      console.log('   ⚠️  Event insert failed:', eventError.message)
    } else {
      console.log('   ✅ System event created')
    }

    console.log('\n✅ Database seeding complete!\n')
    console.log('🎯 Next steps:')
    console.log('   1. Visit http://localhost:3000')
    console.log('   2. You should see HughMann.life in the dashboard')
    console.log('   3. Implement health check cron job next\n')

  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

seedDatabase()
