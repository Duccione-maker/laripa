import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Coordinate estratte dall'URL fornito dall'utente
    const lat = 43.5022375;
    const lng = 11.071666;

    console.log(`Searching for place near coordinates: ${lat}, ${lng}`);

    // Prima provo con la ricerca testuale
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=La%20Ripa%20San%20Gimignano&inputtype=textquery&fields=place_id,name,formatted_address&key=${googleApiKey}`;
    
    const textResponse = await fetch(textSearchUrl);
    const textData = await textResponse.json();

    console.log('Text search response:', JSON.stringify(textData, null, 2));

    if (textData.status === 'OK' && textData.candidates?.length > 0) {
      const placeId = textData.candidates[0].place_id;
      console.log(`Found Place ID via text search: ${placeId}`);
      
      return new Response(JSON.stringify({ 
        place_id: placeId,
        method: 'text_search',
        name: textData.candidates[0].name,
        address: textData.candidates[0].formatted_address
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se la ricerca testuale non funziona, provo con nearby search
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&keyword=La%20Ripa&key=${googleApiKey}`;
    
    const nearbyResponse = await fetch(nearbyUrl);
    const nearbyData = await nearbyResponse.json();

    console.log('Nearby search response:', JSON.stringify(nearbyData, null, 2));

    if (nearbyData.status === 'OK' && nearbyData.results?.length > 0) {
      const place = nearbyData.results[0];
      console.log(`Found Place ID via nearby search: ${place.place_id}`);
      
      return new Response(JSON.stringify({ 
        place_id: place.place_id,
        method: 'nearby_search',
        name: place.name,
        address: place.vicinity
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('No place found with the given criteria');

  } catch (error) {
    console.error('Error finding place ID:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        place_id: null
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});