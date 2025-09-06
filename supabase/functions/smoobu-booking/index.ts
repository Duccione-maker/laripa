import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json().catch(() => ({}))
    
    if (requestData.action === 'sync') {
      // Test direct iCal parsing
      const padronaleUrl = Deno.env.get('SMOOBU_ICAL_PADRONALE')
      
      if (!padronaleUrl) {
        return new Response(JSON.stringify({ 
          error: 'No iCal URL found',
          synced: 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        console.log('Fetching:', padronaleUrl.substring(0, 50) + '...')
        const response = await fetch(padronaleUrl)
        
        if (!response.ok) {
          return new Response(JSON.stringify({ 
            error: `HTTP ${response.status}: ${response.statusText}`,
            synced: 0 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const icalData = await response.text()
        console.log('iCal data length:', icalData.length)
        
        // Find VEVENT sections
        const vevents = icalData.split('BEGIN:VEVENT')
        console.log('Found VEVENT sections:', vevents.length - 1)
        
        const events = []
        for (let i = 1; i < vevents.length; i++) {
          const eventText = 'BEGIN:VEVENT' + vevents[i].split('END:VEVENT')[0] + 'END:VEVENT'
          
          // Parse basic info
          const uidMatch = eventText.match(/UID:(.+)/)?.[1]?.trim()
          const summaryMatch = eventText.match(/SUMMARY:(.+)/)?.[1]?.trim()
          const dtStartMatch = eventText.match(/DTSTART:(\d{8})/)?.[1]
          const dtEndMatch = eventText.match(/DTEND:(\d{8})/)?.[1]
          
          if (uidMatch && dtStartMatch && dtEndMatch) {
            events.push({
              uid: uidMatch,
              summary: summaryMatch || 'No summary',
              start: dtStartMatch,
              end: dtEndMatch
            })
          }
        }
        
        console.log('Parsed events:', events.length)
        
        return new Response(JSON.stringify({ 
          message: 'iCal test completed',
          dataLength: icalData.length,
          veventsFound: vevents.length - 1,
          validEvents: events.length,
          events: events.slice(0, 3), // Show first 3 events
          synced: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
        
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        return new Response(JSON.stringify({ 
          error: fetchError.message,
          synced: 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
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