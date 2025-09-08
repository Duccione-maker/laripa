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
    const { pageId } = await req.json();
    
    if (!pageId) {
      return new Response(
        JSON.stringify({ error: 'Page ID is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('Facebook access token not found');
      return new Response(
        JSON.stringify({ error: 'Facebook access token not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching Facebook reviews for page: ${pageId}`);

    // Fetch reviews from Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/ratings?fields=reviewer{name},created_time,rating,review_text&access_token=${accessToken}&limit=50`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Facebook reviews',
          details: errorText 
        }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Facebook API response:', JSON.stringify(data, null, 2));

    // Transform Facebook reviews to match our format
    const reviews = data.data?.map((review: any) => ({
      id: `fb_${review.created_time}_${review.reviewer?.name || 'anonymous'}`,
      author_name: review.reviewer?.name || 'Utente Facebook',
      rating: review.rating,
      text: review.review_text || '',
      time: review.created_time,
      profile_photo_url: null,
      relative_time_description: formatRelativeTime(review.created_time)
    })) || [];

    console.log(`Successfully fetched ${reviews.length} Facebook reviews`);

    return new Response(
      JSON.stringify({ reviews }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-facebook-reviews function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays < 1) return 'oggi';
  if (diffDays === 1) return 'ieri';
  if (diffDays < 7) return `${diffDays} giorni fa`;
  if (diffWeeks === 1) return '1 settimana fa';
  if (diffWeeks < 4) return `${diffWeeks} settimane fa`;
  if (diffMonths === 1) return '1 mese fa';
  if (diffMonths < 12) return `${diffMonths} mesi fa`;
  if (diffYears === 1) return '1 anno fa';
  return `${diffYears} anni fa`;
}