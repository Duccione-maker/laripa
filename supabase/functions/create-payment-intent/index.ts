import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APARTMENT_MAP: Record<string, string> = {
  '1': '192379', '2': '195814', '3': '195816', '4': '195815',
}

const APARTMENT_NAMES: Record<string, string> = {
  '1': 'Padronale', '2': 'Ghiri', '3': 'Fienile', '4': 'Nidi',
}

const FALLBACK_PRICE: Record<string, number> = {
  '1': 139, '2': 129, '3': 119, '4': 109,
}

// Lookup discount code from Supabase, fallback to hardcoded
async function resolveDiscount(supabase: ReturnType<typeof createClient>, code: string): Promise<{ type: 'fixed' | 'percent'; value: number } | null> {
  if (!code) return null
  try {
    const { data } = await supabase
      .from('discount_codes')
      .select('discount_type, value, active, expires_at')
      .eq('code', code)
      .single()
    if (!data || !data.active) return null
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null
    return { type: data.discount_type as 'fixed' | 'percent', value: Number(data.value) }
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const {
      apartmentId, checkIn, checkOut,
      discountCode, guestEmail, guestName,
      successUrl, cancelUrl,
    } = await req.json()

    if (!apartmentId || !checkIn || !checkOut || !guestEmail || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Campi mancanti' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const nights = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    if (nights <= 0) return new Response(
      JSON.stringify({ error: 'Date non valide' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    )

    // Price from Smoobu or fallback
    let pricePerNight = FALLBACK_PRICE[apartmentId] ?? 150
    const smoobuApiKey = Deno.env.get('SMOOBU_API_KEY')
    const smoobuId = APARTMENT_MAP[apartmentId]

    if (smoobuApiKey && smoobuId) {
      try {
        const r = await fetch(
          `https://login.smoobu.com/api/rates?apartments[]=${smoobuId}&start_date=${checkIn}&end_date=${checkOut}`,
          { headers: { 'Api-Key': smoobuApiKey } }
        )
        if (r.ok) {
          const json = await r.json()
          const rates = json?.data?.[smoobuId]
          if (rates) {
            const prices = Object.entries(rates as Record<string, { price: number }>)
              .filter(([d]) => d >= checkIn && d < checkOut)
              .map(([, v]) => v.price)
            if (prices.length > 0)
              pricePerNight = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          }
        }
      } catch (_) { /* use fallback */ }
    }

    const code = (discountCode ?? '').trim().toUpperCase()
    const discount = await resolveDiscount(supabase, code)
    let total = pricePerNight * nights
    let discountPercent = 0
    let discountValue = 0
    if (discount) {
      if (discount.type === 'percent') {
        discountPercent = discount.value
        total = Math.round(total * (1 - discount.value / 100))
      } else {
        discountValue = discount.value
        total = Math.max(0, total - discount.value)
      }
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return new Response(
      JSON.stringify({ error: 'STRIPE_SECRET_KEY non configurata' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )

    console.log('Creating Checkout Session, key prefix:', stripeKey.substring(0, 10))

    const aptName = APARTMENT_NAMES[apartmentId] ?? `Appartamento ${apartmentId}`
    const description = `${aptName} · ${checkIn} → ${checkOut} · ${nights} nott${nights === 1 ? 'e' : 'i'}`

    const body = new URLSearchParams({
      'mode': 'payment',
      'customer_email': guestEmail,
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(total * 100),
      'line_items[0][price_data][product_data][name]': `Soggiorno La Ripa – ${aptName}`,
      'line_items[0][price_data][product_data][description]': description,
      'metadata[apartmentId]': apartmentId,
      'metadata[checkIn]': checkIn,
      'metadata[checkOut]': checkOut,
      'metadata[nights]': String(nights),
      'metadata[pricePerNight]': String(pricePerNight),
      'metadata[discountCode]': code,
      'metadata[discountPercent]': String(discountPercent),
      'metadata[discountValue]': String(discountValue),
      'metadata[discountType]': discount?.type ?? '',
      'metadata[guestName]': guestName,
      'metadata[guestEmail]': guestEmail,
    })

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const session = await stripeRes.json()
    console.log('Stripe session status:', stripeRes.status, '| id:', session.id)

    if (!stripeRes.ok) {
      console.error('Stripe error:', session?.error?.message)
      return new Response(
        JSON.stringify({ error: session?.error?.message ?? 'Errore Stripe' }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
        amount: total,
        nights,
        pricePerNight,
        discountApplied: discount !== null,
        discountPercent,
        discountValue,
        discountType: discount?.type ?? null,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
