import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmoobuSyncRequest {
  action: 'sync'
}

interface SmoobuBookingRequest {
  apartmentId: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  notes?: string
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

    const smoobuApiKey = Deno.env.get('SMOOBU_API_KEY')
    if (!smoobuApiKey) {
      throw new Error('Smoobu API key not configured')
    }

    const requestData = await req.json().catch(() => ({}))
    
    // Handle sync request (no auth required) - Updated
    if (requestData.action === 'sync') {
      console.log('Syncing calendar data from iCal feeds - Starting sync process...')
      
      let syncedCount = 0;
      
      console.log('Environment variables check:');
      console.log('SMOOBU_ICAL_PADRONALE:', Deno.env.get('SMOOBU_ICAL_PADRONALE') ? 'SET' : 'NOT SET');
      console.log('SMOOBU_ICAL_GHIRI:', Deno.env.get('SMOOBU_ICAL_GHIRI') ? 'SET' : 'NOT SET');
      console.log('SMOOBU_ICAL_FIENILE:', Deno.env.get('SMOOBU_ICAL_FIENILE') ? 'SET' : 'NOT SET');
      console.log('SMOOBU_ICAL_NIDI:', Deno.env.get('SMOOBU_ICAL_NIDI') ? 'SET' : 'NOT SET');
      
      // Get iCal URLs from environment
      const icalUrls = {
        '192379': Deno.env.get('SMOOBU_ICAL_PADRONALE'),
        '195814': Deno.env.get('SMOOBU_ICAL_GHIRI'),
        '195816': Deno.env.get('SMOOBU_ICAL_FIENILE'),
        '195815': Deno.env.get('SMOOBU_ICAL_NIDI'),
      };

      // Function to parse iCal data
      const parseICalEvent = (eventText: string, apartmentId: string) => {
        const lines = eventText.split('\n');
        const event: any = {};
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('DTSTART:')) {
            const dateStr = trimmedLine.replace('DTSTART:', '');
            event.start = new Date(dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8));
          } else if (trimmedLine.startsWith('DTEND:')) {
            const dateStr = trimmedLine.replace('DTEND:', '');
            event.end = new Date(dateStr.substring(0, 4) + '-' + dateStr.substring(4, 6) + '-' + dateStr.substring(6, 8));
          } else if (trimmedLine.startsWith('SUMMARY:')) {
            event.summary = trimmedLine.replace('SUMMARY:', '');
          } else if (trimmedLine.startsWith('UID:')) {
            event.uid = trimmedLine.replace('UID:', '');
          }
        }
        
        return event;
      };

      // Sync each apartment's iCal feed
      for (const [apartmentId, icalUrl] of Object.entries(icalUrls)) {
        if (!icalUrl) {
          console.log(`No iCal URL configured for apartment ${apartmentId}`);
          continue;
        }

        try {
          console.log(`Fetching iCal data for apartment ${apartmentId} from ${icalUrl}`);
          const icalResponse = await fetch(icalUrl);
          
          if (!icalResponse.ok) {
            console.error(`Failed to fetch iCal for apartment ${apartmentId}: ${icalResponse.status}`);
            continue;
          }

          const icalData = await icalResponse.text();
          console.log(`iCal data fetched for apartment ${apartmentId}, length: ${icalData.length}`);

          // Parse iCal events
          const events = icalData.split('BEGIN:VEVENT').slice(1);
          
          for (const eventData of events) {
            try {
              const event = parseICalEvent('BEGIN:VEVENT\n' + eventData, apartmentId);
              
              if (event.start && event.end && event.uid) {
                // Check if booking already exists
                const { data: existingBooking } = await supabaseClient
                  .from('bookings')
                  .select('id')
                  .eq('smoobu_booking_id', event.uid)
                  .maybeSingle();

                if (!existingBooking) {
                  await supabaseClient
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
                  
                  syncedCount++;
                  console.log(`Created booking for apartment ${apartmentId}: ${event.summary}`);
                } else {
                  console.log(`Booking already exists: ${event.uid}`);
                }
              }
            } catch (eventError) {
              console.error('Error parsing event:', eventError);
            }
          }
        } catch (error) {
          console.error(`Error fetching iCal for apartment ${apartmentId}:`, error);
        }
      }

      console.log(`Total events synced: ${syncedCount}`);
      
      return new Response(JSON.stringify({ 
        message: 'Calendar sync completed',
        synced: syncedCount,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For booking operations, require authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    if (req.method === 'GET') {
      // Fetch apartments from Smoobu
      console.log('Fetching apartments from Smoobu...')
      
      const smoobuResponse = await fetch('https://login.smoobu.com/api/apartments', {
        method: 'GET',
        headers: {
          'Api-Key': smoobuApiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!smoobuResponse.ok) {
        throw new Error(`Smoobu API error: ${smoobuResponse.status}`)
      }

      const smoobuData = await smoobuResponse.json()
      console.log('Smoobu apartments fetched:', smoobuData)

      // Update local apartments table
      if (smoobuData.apartments && Array.isArray(smoobuData.apartments)) {
        for (const apartment of smoobuData.apartments) {
          await supabaseClient
            .from('apartments')
            .upsert({
              id: apartment.id.toString(),
              name: apartment.name || 'Unnamed Apartment',
              description: apartment.description || '',
              max_guests: apartment.max_guests || 2,
              price_per_night: apartment.default_price || 0,
              currency: apartment.currency || 'EUR',
              amenities: apartment.amenities || [],
              images: apartment.images || [],
            })
        }
      }

      // Also fetch reservations for calendar sync
      const reservationsResponse = await fetch('https://login.smoobu.com/api/reservations', {
        method: 'GET',
        headers: {
          'Api-Key': smoobuApiKey,
          'Content-Type': 'application/json',
        },
      })

      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json()
        console.log('Smoobu reservations fetched:', reservationsData)

        // Update local bookings table with Smoobu reservations
        if (reservationsData.reservations && Array.isArray(reservationsData.reservations)) {
          for (const reservation of reservationsData.reservations) {
            // Check if booking already exists
            const { data: existingBooking } = await supabaseClient
              .from('bookings')
              .select('id')
              .eq('smoobu_booking_id', reservation.id.toString())
              .single()

            if (!existingBooking) {
              // Create new booking from Smoobu data
              await supabaseClient
                .from('bookings')
                .insert({
                  smoobu_booking_id: reservation.id.toString(),
                  apartment_id: reservation.apartment?.id?.toString() || '',
                  guest_name: `${reservation.guests?.[0]?.firstname || ''} ${reservation.guests?.[0]?.lastname || ''}`.trim() || 'Guest',
                  guest_email: reservation.guests?.[0]?.email || '',
                  guest_phone: reservation.guests?.[0]?.phone || '',
                  check_in: reservation.arrival,
                  check_out: reservation.departure,
                  adults: reservation.adults || 1,
                  children: reservation.children || 0,
                  total_price: reservation.price?.total,
                  currency: reservation.price?.currency || 'EUR',
                  status: reservation.status || 'confirmed',
                  notes: reservation.notice || '',
                  // Use a system user ID for Smoobu synced bookings
                  user_id: '00000000-0000-0000-0000-000000000000',
                })
            }
          }
        }
      }

      return new Response(JSON.stringify({ 
        apartments: smoobuData,
        message: 'Data synchronized successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      // Create a booking
      const bookingData: SmoobuBookingRequest = requestData
      console.log('Creating booking:', bookingData)

      // Create booking in Smoobu
      const smoobuBooking = {
        apartment: parseInt(bookingData.apartmentId),
        arrival: bookingData.checkIn,
        departure: bookingData.checkOut,
        guests: [
          {
            firstname: bookingData.guestName.split(' ')[0] || bookingData.guestName,
            lastname: bookingData.guestName.split(' ').slice(1).join(' ') || '',
            email: bookingData.guestEmail,
            phone: bookingData.guestPhone || '',
          }
        ],
        adults: bookingData.adults,
        children: bookingData.children,
        notice: bookingData.notes || '',
      }

      const smoobuResponse = await fetch('https://login.smoobu.com/api/reservations', {
        method: 'POST',
        headers: {
          'Api-Key': smoobuApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smoobuBooking),
      })

      if (!smoobuResponse.ok) {
        const errorText = await smoobuResponse.text()
        console.error('Smoobu booking error:', errorText)
        throw new Error(`Smoobu booking failed: ${smoobuResponse.status}`)
      }

      const smoobuResult = await smoobuResponse.json()
      console.log('Smoobu booking created:', smoobuResult)

      // Save booking to our database
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .insert({
          user_id: user.id,
          smoobu_booking_id: smoobuResult.id?.toString(),
          apartment_id: bookingData.apartmentId,
          guest_name: bookingData.guestName,
          guest_email: bookingData.guestEmail,
          guest_phone: bookingData.guestPhone,
          check_in: bookingData.checkIn,
          check_out: bookingData.checkOut,
          adults: bookingData.adults,
          children: bookingData.children,
          total_price: smoobuResult.price?.total,
          currency: smoobuResult.price?.currency || 'EUR',
          status: 'confirmed',
          notes: bookingData.notes,
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Database booking error:', bookingError)
        throw new Error('Failed to save booking to database')
      }

      return new Response(JSON.stringify({ booking, smoobuResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Method not allowed
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