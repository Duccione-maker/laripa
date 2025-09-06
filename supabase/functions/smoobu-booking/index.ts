import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user from auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    const smoobuApiKey = Deno.env.get('SMOOBU_API_KEY')
    if (!smoobuApiKey) {
      throw new Error('Smoobu API key not configured')
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

      return new Response(JSON.stringify(smoobuData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      // Create a booking
      const bookingData: SmoobuBookingRequest = await req.json()
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