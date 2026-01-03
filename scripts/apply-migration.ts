import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('📦 Applying dashboard views migration...')

  const sql = readFileSync(
    join(__dirname, '..', 'supabase', 'migrations', '20260103_dashboard_views.sql'),
    'utf-8'
  )

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    console.log(`\n[${i + 1}/${statements.length}] Executing statement...`)

    const { error } = await supabase.rpc('exec_sql', { query: statement })

    if (error) {
      console.error('❌ Error:', error.message)
      process.exit(1)
    }

    console.log('✅ Success')
  }

  console.log('\n✅ Migration applied successfully!')
}

applyMigration().catch(console.error)
