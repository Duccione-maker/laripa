import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APARTMENT_MAP: Record<string, number> = {
  '1': 192379, // Padronale
  '2': 195814, // Ghiri
  '3': 195816, // Fienile
  '4': 195815, // Nidi
}

const ICAL_SECRETS: Record<string, string> = {
  '192379': 'SMOOBU_ICAL_PADRONALE',
  '195814': 'SMOOBU_ICAL_GHIRI',
  '195816': 'SMOOBU_ICAL_FIENILE',
  '195815': 'SMOOBU_ICAL_NIDI',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()

    // ── SYNC iCal ────────────────────────────────────────────────────────────
    if (body.action === 'sync') {
      let synced = 0
      for (const [smoobuId, secretName] of Object.entries(ICAL_SECRETS)) {
        const url = Deno.env.get(secretName)
        if (!url) continue
        try {
          const ical = await (await fetch(url)).text()
          for (const block of ical.split('BEGIN:VEVENT').slice(1)) {
            const uid = block.match(/UID:(.+)/)?.[1]?.trim()
            const dtstart = block.match(/DTSTART[^:]*:(\d{8})/)?.[1]
            const dtend = block.match(/DTEND[^:]*:(\d{8})/)?.[1]
            const summary = block.match(/SUMMARY:(.+)/)?.[1]?.trim() ?? 'Booking'
            if (!uid || !dtstart || !dtend) continue
            const checkIn = `${dtstart.slice(0,4)}-${dtstart.slice(4,6)}-${dtstart.slice(6,8)}`
            const checkOut = `${dtend.slice(0,4)}-${dtend.slice(4,6)}-${dtend.slice(6,8)}`
            const { data: existing } = await supabase.from('bookings').select('id').eq('smoobu_booking_id', uid).maybeSingle()
            if (!existing) {
              const { error } = await supabase.from('bookings').insert({
                smoobu_booking_id: uid,
                apartment_id: smoobuId,
                guest_name: summary,
                guest_email: '',
                guest_phone: '',
                check_in: checkIn,
                check_out: checkOut,
                adults: 1,
                children: 0,
                currency: 'EUR',
                status: 'confirmed',
                notes: `iCal sync: ${summary}`,
                user_id: '00000000-0000-0000-0000-000000000000',
              })
              if (!error) synced++
            }
          }
        } catch (_) { /* skip */ }
      }
      return new Response(JSON.stringify({ synced }), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // ── CREATE BOOKING ────────────────────────────────────────────────────────
    const { apartmentId, guestName, guestEmail, guestPhone, checkIn, checkOut,
            adults, children, notes, userId, paymentIntentId } = body

    if (!apartmentId || !guestName || !guestEmail || !checkIn || !checkOut) {
      return new Response(JSON.stringify({ error: 'Campi mancanti' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const smoobuId = APARTMENT_MAP[String(apartmentId)]
    if (!smoobuId) return new Response(JSON.stringify({ error: 'apartmentId non valido' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })

    const apiKey = Deno.env.get('SMOOBU_API_KEY')
    if (!apiKey) return new Response(JSON.stringify({ error: 'SMOOBU_API_KEY mancante' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })

    const nameParts = guestName.trim().split(/\s+/)
    const smoobuRes = await fetch('https://login.smoobu.com/api/reservations', {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        arrivalDate: checkIn,
        departureDate: checkOut,
        apartmentId: smoobuId,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || '-',
        email: guestEmail,
        phone: guestPhone ?? '',
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        notice: [notes, paymentIntentId ? `stripe:${paymentIntentId}` : ''].filter(Boolean).join(' | '),
      }),
    })

    const smoobuData = await smoobuRes.json()
    if (!smoobuRes.ok) {
      console.error('Smoobu error:', smoobuData)
      return new Response(JSON.stringify({ error: 'Errore Smoobu', detail: smoobuData }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const { data: saved, error: dbErr } = await supabase.from('bookings').insert({
      smoobu_booking_id: String(smoobuData.id),
      apartment_id: String(apartmentId),
      user_id: userId || '00000000-0000-0000-0000-000000000000',
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone ?? '',
      check_in: checkIn,
      check_out: checkOut,
      adults: Number(adults) || 1,
      children: Number(children) || 0,
      total_price: smoobuData.price ?? null,
      currency: 'EUR',
      status: 'confirmed',
      notes: [notes, paymentIntentId ? `stripe:${paymentIntentId}` : ''].filter(Boolean).join(' | '),
    }).select().single()

    if (dbErr) console.error('DB insert error:', dbErr)

    return new Response(JSON.stringify({ ok: true, smoobuId: smoobuData.id, booking: saved }), {
      status: 201, headers: { ...cors, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('smoobu-booking error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
