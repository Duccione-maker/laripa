import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APARTMENT_MAP: Record<string, string> = {
  '1': '192379', // Padronale
  '2': '195814', // Ghiri
  '3': '195816', // Fienile
  '4': '195815', // Nidi
}

const FALLBACK_PRICES: Record<string, number> = {
  '1': 139,
  '2': 129,
  '3': 119,
  '4': 109,
}

// Discount codes: code → percent off
const DISCOUNT_CODES: Record<string, number> = {
  'MIMANDADUCCIO': 10,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { apartmentId, checkIn, checkOut, adults, children, discountCode, guestName, guestEmail } =
      await req.json()

    if (!apartmentId || !checkIn || !checkOut || !guestName || !guestEmail) {
      return new Response(
        JSON.stringify({ error: 'Campi obbligatori mancanti: apartmentId, checkIn, checkOut, guestName, guestEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const smoobuApartmentId = APARTMENT_MAP[String(apartmentId)]
    if (!smoobuApartmentId) {
      return new Response(
        JSON.stringify({ error: `apartmentId non valido: ${apartmentId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate nights
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (nights <= 0) {
      return new Response(
        JSON.stringify({ error: 'Intervallo di date non valido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch per-night prices from Smoobu rates API
    const smoobuApiKey = Deno.env.get('SMOOBU_API_KEY')
    let pricePerNight = FALLBACK_PRICES[apartmentId] ?? 200
    let priceSource: 'smoobu' | 'fallback' = 'fallback'

    if (smoobuApiKey) {
      try {
        const ratesRes = await fetch(
          `https://login.smoobu.com/api/rates?apartments[]=${smoobuApartmentId}&start_date=${checkIn}&end_date=${checkOut}`,
          {
            headers: { 'Api-Key': smoobuApiKey, 'Content-Type': 'application/json' },
          }
        )
        if (ratesRes.ok) {
          const ratesData = await ratesRes.json()
          // Smoobu structure: { data: { [smoobuApartmentId]: { [date]: { price, available } } } }
          const apartmentRates = ratesData.data?.[smoobuApartmentId] as Record<string, { price: number }> | undefined
          if (apartmentRates) {
            let total = 0
            let count = 0
            for (const [date, info] of Object.entries(apartmentRates)) {
              if (date >= checkIn && date < checkOut) {
                total += info.price ?? 0
                count++
              }
            }
            if (count > 0) {
              pricePerNight = Math.round(total / count)
              priceSource = 'smoobu'
            }
          }
        }
      } catch (e) {
        console.error('Smoobu rates fetch failed, using fallback:', e)
      }
    }

    let totalPrice = pricePerNight * nights

    // Apply discount code
    const codeUpper = (discountCode ?? '').trim().toUpperCase()
    const discountPercent = DISCOUNT_CODES[codeUpper] ?? 0
    const discountApplied = discountPercent > 0
    if (discountApplied) {
      totalPrice = Math.round(totalPrice * (1 - discountPercent / 100))
    }

    // Create Stripe PaymentIntent
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY non configurata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // in centesimi
      currency: 'eur',
      receipt_email: guestEmail,
      metadata: {
        apartmentId: String(apartmentId),
        checkIn,
        checkOut,
        adults: String(adults ?? 1),
        children: String(children ?? 0),
        guestName,
        guestEmail,
        nights: String(nights),
        pricePerNight: String(pricePerNight),
        discountCode: codeUpper,
        discountPercent: String(discountPercent),
        priceSource,
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalPrice,
        currency: 'EUR',
        nights,
        pricePerNight,
        discountApplied,
        discountPercent,
        priceSource,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('create-payment-intent error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
