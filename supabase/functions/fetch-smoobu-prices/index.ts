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
      throw new Error('SMOOBU_API_KEY not configured');
    }

    // Map apartment IDs to Smoobu apartment IDs
    const apartmentMapping: Record<string, string> = {
      '1': 'padronale', // You'll need to replace with actual Smoobu apartment IDs
      '2': 'ghiri',
      '3': 'fienile', 
      '4': 'nidi'
    };

    const smoobuApartmentId = apartmentMapping[apartmentId];
    if (!smoobuApartmentId) {
      throw new Error('Apartment not found');
    }

    // If no dates provided, get base price
    if (!checkIn || !checkOut) {
      // Fetch base pricing from Smoobu apartments endpoint
      const response = await fetch(`https://login.smoobu.com/api/apartments`, {
        headers: {
          'Api-Key': smoobuApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Smoobu API error: ${response.status}`);
      }

      const apartments = await response.json();
      const apartment = apartments.find((apt: any) => 
        apt.name.toLowerCase().includes(smoobuApartmentId.toLowerCase())
      );

      if (!apartment) {
        // Fallback to static prices if apartment not found
        const fallbackPrices: Record<string, number> = {
          '1': 280,
          '2': 220, 
          '3': 190,
          '4': 160
        };

        return new Response(
          JSON.stringify({
            price: fallbackPrices[apartmentId] || 200,
            currency: 'EUR',
            source: 'fallback'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      return new Response(
        JSON.stringify({
          price: apartment.defaultPrice || 200,
          currency: 'EUR',
          source: 'smoobu'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
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
      '1': 280,
      '2': 220,
      '3': 190, 
      '4': 160
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