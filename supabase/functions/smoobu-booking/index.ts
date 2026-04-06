import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapping: internal apartment ID → Smoobu apartment ID
const APARTMENT_MAP: Record<string, number> = {
  '1': 192379, // Padronale
  '2': 195814, // Ghiri
  '3': 195816, // Fienile
  '4': 195815, // Nidi
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

    // ─── SYNC: pull iCal feeds from Smoobu into bookings table ───────────────
    if (requestData.action === 'sync') {
      let syncedCount = 0

      const icalUrls: Record<string, string | undefined> = {
        '192379': Deno.env.get('SMOOBU_ICAL_PADRONALE'),
        '195814': Deno.env.get('SMOOBU_ICAL_GHIRI'),
        '195816': Deno.env.get('SMOOBU_ICAL_FIENILE'),
        '195815': Deno.env.get('SMOOBU_ICAL_NIDI'),
      }

      const parseICalEvent = (eventText: string) => {
        const lines = eventText.split('\n')
        const event: Record<string, unknown> = {}

        for (const line of lines) {
          const trimmed = line.trim()

          if (trimmed.startsWith('UID:')) {
            event.uid = trimmed.replace('UID:', '').trim()
          }
          if (trimmed.startsWith('SUMMARY:')) {
            event.summary = trimmed.replace('SUMMARY:', '').trim()
          }

          const parseDateLine = (raw: string): Date | undefined => {
            const dateStr = raw.split(':')[1]?.trim()
            if (!dateStr) return undefined
            if (dateStr.match(/^\d{8}$/) || dateStr.match(/^\d{8}T\d{6}Z?$/)) {
              const y = dateStr.substring(0, 4)
              const m = dateStr.substring(4, 6)
              const d = dateStr.substring(6, 8)
              return new Date(`${y}-${m}-${d}`)
            }
            return undefined
          }

          if (trimmed.startsWith('DTSTART')) {
            event.start = parseDateLine(trimmed)
          }
          if (trimmed.startsWith('DTEND')) {
            event.end = parseDateLine(trimmed)
          }
        }

        return event
      }

      for (const [smoobuApartmentId, icalUrl] of Object.entries(icalUrls)) {
        if (!icalUrl) continue

        try {
          const icalResponse = await fetch(icalUrl)
          if (!icalResponse.ok) continue

          const icalData = await icalResponse.text()
          const events = icalData.split('BEGIN:VEVENT').slice(1)

          for (const eventData of events) {
            try {
              const event = parseICalEvent('BEGIN:VEVENT\n' + eventData)
              const start = event.start as Date | undefined
              const end = event.end as Date | undefined

              if (
                start && end && event.uid &&
                !isNaN(start.getTime()) && !isNaN(end.getTime())
              ) {
                const { data: existing } = await supabaseClient
                  .from('bookings')
                  .select('id')
                  .eq('smoobu_booking_id', event.uid)
                  .maybeSingle()

                if (!existing) {
                  const { error: insertError } = await supabaseClient
                    .from('bookings')
                    .insert({
                      smoobu_booking_id: event.uid,
                      apartment_id: smoobuApartmentId,
                      guest_name: event.summary || 'Booking',
                      guest_email: '',
                      guest_phone: '',
                      check_in: start.toISOString().split('T')[0],
                      check_out: end.toISOString().split('T')[0],
                      adults: 1,
                      children: 0,
                      total_price: null,
                      currency: 'EUR',
                      status: 'confirmed',
                      notes: `Synced from iCal: ${event.summary}`,
                      user_id: '00000000-0000-0000-0000-000000000000',
                    })

                  if (!insertError) syncedCount++
                }
              }
            } catch {
              // skip invalid events
            }
          }
        } catch {
          // skip problematic apartments
        }
      }

      return new Response(
        JSON.stringify({ message: 'Calendar sync completed', synced: syncedCount, timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── CREATE BOOKING: forward to Smoobu API then save to DB ───────────────
    const { apartmentId, guestName, guestEmail, guestPhone, checkIn, checkOut, adults, children, notes, userId, paymentIntentId } = requestData

    if (!apartmentId || !guestName || !guestEmail || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: apartmentId, guestName, guestEmail, checkIn, checkOut' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smoobuApartmentId = APARTMENT_MAP[String(apartmentId)]
    if (!smoobuApartmentId) {
      return new Response(
        JSON.stringify({ error: `Unknown apartmentId: ${apartmentId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smoobuApiKey = Deno.env.get('SMOOBU_API_KEY')
    if (!smoobuApiKey) {
      return new Response(
        JSON.stringify({ error: 'SMOOBU_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Split guestName into first/last for Smoobu
    const nameParts = guestName.trim().split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || '-'

    // Call Smoobu Reservations API
    const smoobuResponse = await fetch('https://login.smoobu.com/api/reservations', {
      method: 'POST',
      headers: {
        'Api-Key': smoobuApiKey,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        arrivalDate: checkIn,
        departureDate: checkOut,
        apartmentId: smoobuApartmentId,
        firstName,
        lastName,
        email: guestEmail,
        phone: guestPhone || '',
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        notice: notes || '',
      }),
    })

    if (!smoobuResponse.ok) {
      const smoobuError = await smoobuResponse.text()
      console.error('Smoobu API error:', smoobuResponse.status, smoobuError)
      return new Response(
        JSON.stringify({ error: `Smoobu API error (${smoobuResponse.status})`, detail: smoobuError }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smoobuData = await smoobuResponse.json()
    const totalPrice: number = smoobuData.price ?? smoobuData.totalPrice ?? null

    // Persist booking in Supabase
    const { data: savedBooking, error: dbError } = await supabaseClient
      .from('bookings')
      .insert({
        smoobu_booking_id: String(smoobuData.id),
        apartment_id: String(apartmentId),
        user_id: userId ?? '00000000-0000-0000-0000-000000000000',
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || '',
        check_in: checkIn,
        check_out: checkOut,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        total_price: totalPrice,
        currency: 'EUR',
        status: 'confirmed',
        notes: [notes, paymentIntentId ? `stripe:${paymentIntentId}` : ''].filter(Boolean).join(' | '),
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      // Booking was created in Smoobu — return success anyway with a warning
      return new Response(
        JSON.stringify({ smoobuId: smoobuData.id, totalPrice, warning: 'Booking confirmed in Smoobu but DB save failed', dbError: dbError.message }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ booking: savedBooking, smoobuId: smoobuData.id, totalPrice }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
