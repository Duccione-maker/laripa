import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleReview {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface GooglePlaceResponse {
  result: {
    reviews: GoogleReview[];
    rating: number;
    user_ratings_total: number;
  };
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google Places API key not configured');
    }

    const { placeId } = await req.json();
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    console.log('Fetching reviews for place ID:', placeId);

    // Google Places API request for place details with reviews
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${googleApiKey}&language=it`;

    const response = await fetch(googleUrl);
    const data: GooglePlaceResponse = await response.json();

    console.log('Google API response status:', data.status);

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // Transform Google reviews to our format
    const reviews = data.result.reviews?.map(review => ({
      id: `google_${review.time}`,
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      date: new Date(review.time * 1000).toISOString(),
      relative_time: review.relative_time_description,
      profile_photo: review.profile_photo_url,
      source: 'google'
    })) || [];

    const result = {
      reviews,
      average_rating: data.result.rating,
      total_reviews: data.result.user_ratings_total,
      source: 'google'
    };

    console.log(`Fetched ${reviews.length} reviews with average rating ${data.result.rating}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        reviews: [],
        average_rating: 0,
        total_reviews: 0
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});