import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData = await req.json().catch(() => ({}))
    
    if (requestData.action === 'sync') {
      let syncedCount = 0;
      
      const icalUrls = {
        '192379': Deno.env.get('SMOOBU_ICAL_PADRONALE'),
        '195814': Deno.env.get('SMOOBU_ICAL_GHIRI'),
        '195816': Deno.env.get('SMOOBU_ICAL_FIENILE'),
        '195815': Deno.env.get('SMOOBU_ICAL_NIDI'),
      };

      // Improved iCal event parser
      const parseICalEvent = (eventText: string) => {
        const lines = eventText.split('\n');
        const event: any = {};
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Parse UID
          if (trimmedLine.startsWith('UID:')) {
            event.uid = trimmedLine.replace('UID:', '').trim();
          }
          
          // Parse SUMMARY
          if (trimmedLine.startsWith('SUMMARY:')) {
            event.summary = trimmedLine.replace('SUMMARY:', '').trim();
          }
          
          // Parse DTSTART - support multiple formats
          if (trimmedLine.startsWith('DTSTART')) {
            const dateStr = trimmedLine.split(':')[1]?.trim();
            if (dateStr) {
              // Handle YYYYMMDD format
              if (dateStr.match(/^\d{8}$/)) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                event.start = new Date(`${year}-${month}-${day}`);
              }
              // Handle YYYYMMDDTHHMMSSZ format
              else if (dateStr.match(/^\d{8}T\d{6}Z?$/)) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                event.start = new Date(`${year}-${month}-${day}`);
              }
            }
          }
          
          // Parse DTEND - support multiple formats
          if (trimmedLine.startsWith('DTEND')) {
            const dateStr = trimmedLine.split(':')[1]?.trim();
            if (dateStr) {
              // Handle YYYYMMDD format
              if (dateStr.match(/^\d{8}$/)) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                event.end = new Date(`${year}-${month}-${day}`);
              }
              // Handle YYYYMMDDTHHMMSSZ format
              else if (dateStr.match(/^\d{8}T\d{6}Z?$/)) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                event.end = new Date(`${year}-${month}-${day}`);
              }
            }
          }
        }
        
        return event;
      };

      // Sync each apartment's iCal feed
      for (const [apartmentId, icalUrl] of Object.entries(icalUrls)) {
        if (!icalUrl) continue;

        try {
          const icalResponse = await fetch(icalUrl);
          if (!icalResponse.ok) continue;

          const icalData = await icalResponse.text();
          const events = icalData.split('BEGIN:VEVENT').slice(1);
          
          for (const eventData of events) {
            try {
              const event = parseICalEvent('BEGIN:VEVENT\n' + eventData);
              
              // Check if we have all required fields and valid dates
              if (event.start && event.end && event.uid && !isNaN(event.start.getTime()) && !isNaN(event.end.getTime())) {
                // Check if booking already exists
                const { data: existingBooking } = await supabaseClient
                  .from('bookings')
                  .select('id')
                  .eq('smoobu_booking_id', event.uid)
                  .maybeSingle();

                if (!existingBooking) {
                  const { error: insertError } = await supabaseClient
                    .from('bookings')
                    .insert({
                      smoobu_booking_id: event.uid,
                      apartment_id: apartmentId,
                      guest_name: event.summary || 'Booking',
                      guest_email: '',
                      guest_phone: '',
                      check_in: event.start.toISOString().split('T')[0],
                      check_out: event.end.toISOString().split('T')[0],
                      adults: 1,
                      children: 0,
                      total_price: null,
                      currency: 'EUR',
                      status: 'confirmed',
                      notes: `Synced from iCal: ${event.summary}`,
                      user_id: '00000000-0000-0000-0000-000000000000',
                    });
                  
                  if (!insertError) {
                    syncedCount++;
                  }
                }
              }
            } catch (eventError) {
              // Skip invalid events
            }
          }
        } catch (error) {
          // Skip problematic apartments
        }
      }
      
      return new Response(JSON.stringify({ 
        message: 'Calendar sync completed',
        synced: syncedCount,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})