import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GooglePhoto {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
  mediaMetadata: {
    width: string;
    height: string;
  };
}

interface GooglePhotosResponse {
  mediaItems: GooglePhoto[];
  nextPageToken?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googlePhotosApiKey = Deno.env.get('GOOGLE_PHOTOS_API_KEY');
    console.log('Google Photos API Key configured:', !!googlePhotosApiKey);
    if (!googlePhotosApiKey) {
      console.error('GOOGLE_PHOTOS_API_KEY environment variable not found');
      throw new Error('Google Photos API key not configured');
    }

    const { albumId } = await req.json();
    if (!albumId) {
      throw new Error('Album ID is required');
    }

    console.log('Fetching photos for album ID:', albumId);

    // Google Photos API request for album photos
    const googleUrl = `https://photoslibrary.googleapis.com/v1/mediaItems:search`;
    
    const requestBody = {
      albumId: albumId,
      pageSize: 50, // Limit to 50 photos per request
      filters: {
        mediaTypeFilter: {
          mediaTypes: ['PHOTO']
        }
      }
    };

    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googlePhotosApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Photos API error:', errorText);
      throw new Error(`Google Photos API error: ${response.status}`);
    }

    const data: GooglePhotosResponse = await response.json();
    
    console.log(`Fetched ${data.mediaItems?.length || 0} photos from album`);

    const result = {
      photos: data.mediaItems || [],
      nextPageToken: data.nextPageToken
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching Google Photos album:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        photos: []
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});