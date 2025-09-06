import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData = await req.json().catch(() => ({}))
    
    // Handle sync request (simple test)
    if (requestData.action === 'sync') {
      console.log('=== SYNC TEST STARTED ===')
      
      // Test environment variables
      const padronaleUrl = Deno.env.get('SMOOBU_ICAL_PADRONALE')
      console.log('PADRONALE URL exists:', !!padronaleUrl)
      
      if (padronaleUrl) {
        console.log('URL length:', padronaleUrl.length)
        console.log('URL preview:', padronaleUrl.substring(0, 50) + '...')
        
        try {
          console.log('Attempting fetch...')
          const response = await fetch(padronaleUrl)
          console.log('Fetch response status:', response.status)
          
          if (response.ok) {
            const text = await response.text()
            console.log('Response length:', text.length)
            console.log('Contains VEVENT:', text.includes('BEGIN:VEVENT'))
            
            // Try to insert one test booking
            console.log('Attempting database insert...')
            const { data, error } = await supabaseClient
              .from('bookings')
              .insert({
                smoobu_booking_id: 'test-' + Date.now(),
                apartment_id: '192379',
                guest_name: 'Test Booking',
                guest_email: 'test@test.com',
                guest_phone: '',
                check_in: '2025-01-01',
                check_out: '2025-01-02',
                adults: 2,
                children: 0,
                total_price: 100,
                currency: 'EUR',
                status: 'confirmed',
                notes: 'Test sync booking',
                user_id: '00000000-0000-0000-0000-000000000000',
              })
              .select()
            
            if (error) {
              console.log('Database insert error:', error)
            } else {
              console.log('Database insert success:', data)
            }
          }
        } catch (fetchError) {
          console.log('Fetch error:', fetchError.message)
        }
      }
      
      console.log('=== SYNC TEST ENDED ===')
      
      return new Response(JSON.stringify({ 
        message: 'Sync test completed',
        synced: 1,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})