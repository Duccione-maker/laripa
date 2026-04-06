import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Our apartment ID → Smoobu apartment ID
const APARTMENT_MAP: Record<string, number> = {
  '1': 192379, // Padronale
  '2': 195814, // Ghiri
  '3': 195816, // Fienile
  '4': 195815, // Nidi
}

// Smoobu apartment ID → our apartment ID (reverse)
const SMOOBU_TO_APT: Record<number, string> = {
  192379: '1',
  195814: '2',
  195816: '3',
  195815: '4',
}

// Known Smoobu apartment IDs (to filter only our apartments)
const OUR_SMOOBU_IDS = new Set([192379, 195814, 195816, 195815])

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()

    // ── SYNC via Smoobu API /reservations ────────────────────────────────────
    if (body.action === 'sync') {
      const apiKey = Deno.env.get('SMOOBU_API_KEY')
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'SMOOBU_API_KEY mancante' }), {
          status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
        })
      }

      let synced = 0
      let updated = 0
      let page = 1
      let totalPages = 1

      while (page <= totalPages) {
        const res = await fetch(
          `https://login.smoobu.com/api/reservations?pageSize=100&page=${page}`,
          { headers: { 'Api-Key': apiKey, 'Cache-Control': 'no-cache' } }
        )
        if (!res.ok) {
          console.error('Smoobu API error:', res.status, await res.text())
          break
        }
        const json = await res.json()
        // Calculate total pages from response
        if (json.page_count) totalPages = json.page_count
        const reservations: Record<string, unknown>[] = json.bookings ?? []

        for (const r of reservations) {
          const smoobuAptId = (r.apartment as Record<string, unknown>)?.id as number
          if (!OUR_SMOOBU_IDS.has(smoobuAptId)) continue

          const smoobuBookingId = String(r.id)
          const aptId = SMOOBU_TO_APT[smoobuAptId]
          const firstName = (r.firstname as string) ?? ''
          const lastName = (r.lastname as string) ?? ''
          const guestName = [firstName, lastName].filter(Boolean).join(' ') || (r['guest-name'] as string) || 'Ospite'
          const guestEmail = (r.email as string) ?? ''
          const guestPhone = (r.phone as string) ?? ''
          const checkIn = r.arrival as string
          const checkOut = r.departure as string
          const adults = Number(r.adults) || 1
          const children = Number(r.children) || 0
          const totalPrice = Number(r.price) || null
          const channel = (r.channel as Record<string, unknown>)?.name as string ?? 'Smoobu'
          const isCancelled = Boolean(r['is-cancelled'])
          const status = isCancelled ? 'cancelled' : 'confirmed'

          const record = {
            smoobu_booking_id: smoobuBookingId,
            apartment_id: aptId,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
            check_in: checkIn,
            check_out: checkOut,
            adults,
            children,
            total_price: totalPrice,
            currency: 'EUR',
            status,
            notes: channel,
            user_id: '00000000-0000-0000-0000-000000000000',
          }

          // Check if exists
          const { data: existing } = await supabase
            .from('bookings')
            .select('id, status')
            .eq('smoobu_booking_id', smoobuBookingId)
            .maybeSingle()

          if (!existing) {
            const { error } = await supabase.from('bookings').insert(record)
            if (!error) synced++
            else console.error('Insert error:', error.message)
          } else {
            // Update status and price in case they changed
            const { error } = await supabase
              .from('bookings')
              .update({ status, total_price: totalPrice, guest_name: guestName,
                        guest_email: guestEmail, adults, children, notes: channel })
              .eq('smoobu_booking_id', smoobuBookingId)
            if (!error) updated++
            else console.error('Update error:', error.message)
          }
        }

        page++
      }

      return new Response(JSON.stringify({ synced, updated }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      })
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
