import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apartmentId, checkIn, checkOut } = await req.json();
    
    const smoobuApiKey = Deno.env.get('SMOOBU_API_KEY');
    if (!smoobuApiKey) {
      console.error('SMOOBU_API_KEY not configured');
      throw new Error('SMOOBU_API_KEY not configured');
    }
    console.log('API Key configured, proceeding with Smoobu API call');

    // Map apartment IDs to Smoobu apartment IDs
    const apartmentMapping: Record<string, string> = {
      '1': '192379', // Padronale
      '2': '195814', // Ghiri
      '3': '195816', // Fienile
      '4': '195815'  // Nidi
    };

    const smoobuApartmentId = apartmentMapping[apartmentId];
    if (!smoobuApartmentId) {
      throw new Error('Apartment not found');
    }

    // If no dates provided, get today's price using rates API
    if (!checkIn || !checkOut) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`Fetching today's rate for apartment ${smoobuApartmentId} on ${today}`);
      
      // Use rates API to get today's actual price
      const response = await fetch(
        `https://login.smoobu.com/api/rates?apartments[]=${smoobuApartmentId}&start_date=${today}&end_date=${tomorrow}`,
        {
          headers: {
            'Api-Key': smoobuApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`Rates API response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Rates API error: ${response.status} - ${errorText}`);
        console.log(`Failed URL: https://login.smoobu.com/api/rates?apartments[]=${smoobuApartmentId}&start_date=${today}&end_date=${tomorrow}`);
        
        // Let's also try a simpler test to see if API key works
        const testResponse = await fetch(`https://login.smoobu.com/api/apartments`, {
          headers: {
            'Api-Key': smoobuApiKey,
            'Content-Type': 'application/json',
          },
        });
        console.log(`Test apartments API status: ${testResponse.status}`);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`Apartments API works, found ${testData?.apartments?.length || 0} apartments`);
        }
        
        // Fallback to static prices if rates API fails
        const fallbackPrices: Record<string, number> = {
          '1': 139, // Prezzo più realistico basato su quello che mi hai detto
          '2': 129, 
          '3': 119,
          '4': 109
        };

        return new Response(
          JSON.stringify({
            price: fallbackPrices[apartmentId] || 200,
            currency: 'EUR',
            source: 'fallback',
            reason: 'rates_api_error'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      const ratesData = await response.json();
      console.log('Today rates response:', JSON.stringify(ratesData, null, 2));

      // Get today's price from rates data - Smoobu structure: data[apartmentId][date]
      let rateFound = false;
      let price = 200;
      let todayRate = null;

      if (ratesData.data && ratesData.data[smoobuApartmentId]) {
        const apartmentRates = ratesData.data[smoobuApartmentId];
        
        // Try today's date first
        if (apartmentRates[today]) {
          todayRate = apartmentRates[today];
          price = todayRate.price || 200;
          rateFound = true;
          console.log(`Found price for ${today}: ${price}`);
        } else {
          // If today's date not found, try to get the first available date
          const firstDate = Object.keys(apartmentRates)[0];
          if (firstDate && apartmentRates[firstDate]) {
            todayRate = apartmentRates[firstDate];
            price = todayRate.price || 200;
            rateFound = true;
            console.log(`Found price for ${firstDate}: ${price}`);
          }
        }
      }

      if (rateFound) {
        console.log(`Successfully found price: ${price} for apartment ${smoobuApartmentId}`);
        
        return new Response(
          JSON.stringify({
            price: price,
            currency: 'EUR',
            source: 'smoobu',
            date: today,
            rateData: todayRate
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        console.log('No rate data found for today, using fallback');
        // Fallback if no rate data found
        const fallbackPrices: Record<string, number> = {
          '1': 139,
          '2': 129,
          '3': 119,
          '4': 109
        };

        return new Response(
          JSON.stringify({
            price: fallbackPrices[apartmentId] || 200,
            currency: 'EUR',
            source: 'fallback',
            reason: 'no_rate_data_today'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // For date-specific pricing, get rates for the period
    const response = await fetch(
      `https://login.smoobu.com/api/rates?apartments[]=${smoobuApartmentId}&start_date=${checkIn}&end_date=${checkOut}`,
      {
        headers: {
          'Api-Key': smoobuApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Smoobu API error: ${response.status}`);
    }

    const ratesData = await response.json();
    console.log('Smoobu rates response:', ratesData);

    // Calculate average price for the period
    let totalPrice = 0;
    let days = 0;

    if (ratesData.data && ratesData.data.length > 0) {
      ratesData.data.forEach((rate: any) => {
        totalPrice += rate.price;
        days++;
      });
    }

    const averagePrice = days > 0 ? Math.round(totalPrice / days) : 200;

    return new Response(
      JSON.stringify({
        price: averagePrice,
        currency: 'EUR',
        source: 'smoobu',
        totalDays: days
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching Smoobu prices:', error);
    
    // Return fallback prices on error
    const { apartmentId } = await req.json().catch(() => ({ apartmentId: '1' }));
    const fallbackPrices: Record<string, number> = {
      '1': 139,
      '2': 129,
      '3': 119, 
      '4': 109
    };

    return new Response(
      JSON.stringify({
        price: fallbackPrices[apartmentId] || 200,
        currency: 'EUR',
        source: 'fallback',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});