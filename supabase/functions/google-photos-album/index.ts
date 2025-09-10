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

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { albumId, action, authCode } = await req.json();

    // Handle OAuth flow - exchange auth code for access token
    if (action === 'auth' && authCode) {
      return await handleOAuthFlow(authCode);
    }

    // Handle fetching photos
    if (action === 'fetch' && albumId) {
      return await fetchPhotos(albumId);
    }

    throw new Error('Invalid request. Provide either auth code or album ID with appropriate action.');

  } catch (error) {
    console.error('Error in google-photos-album function:', error);
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

async function handleOAuthFlow(authCode: string) {
  const clientId = Deno.env.get('GOOGLE_PHOTOS_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_PHOTOS_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Google Photos OAuth credentials not configured');
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-photos-album`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth token exchange error:', errorText);
    throw new Error(`OAuth token exchange failed: ${response.status}`);
  }

  const tokenData: TokenResponse = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    accessToken: tokenData.access_token,
    expiresIn: tokenData.expires_in
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function fetchPhotos(albumId: string) {
  // For now, we'll use a stored access token
  // In production, you'd want to store and refresh tokens properly
  const accessToken = Deno.env.get('GOOGLE_PHOTOS_ACCESS_TOKEN');
  
  if (!accessToken) {
    throw new Error('Google Photos access token not configured. Please authenticate first.');
  }

  console.log('Fetching photos for album ID:', albumId);

  const googleUrl = `https://photoslibrary.googleapis.com/v1/mediaItems:search`;
  
  const requestBody = {
    albumId: albumId,
    pageSize: 50,
    filters: {
      mediaTypeFilter: {
        mediaTypes: ['PHOTO']
      }
    }
  };

  const response = await fetch(googleUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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