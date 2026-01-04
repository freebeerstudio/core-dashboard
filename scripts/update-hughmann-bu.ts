import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateBU() {
  console.log('Updating HughMann.life business unit to "FreeBeer.Studio Core"...')

  const { data, error } = await supabase
    .from('sites')
    .update({ bu_name: 'FreeBeer.Studio Core' })
    .eq('domain', 'hughmanni.life')
    .select()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('✅ Updated successfully:', JSON.stringify(data, null, 2))
}

updateBU()
