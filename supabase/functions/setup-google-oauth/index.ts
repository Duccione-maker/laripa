import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleClientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!googleClientId || !googleClientSecret) {
      throw new Error('Missing Google OAuth credentials. Please configure GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET');
    }

    console.log('Setting up Google OAuth provider...');

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Configure Google OAuth provider
    const { data, error } = await supabase.auth.admin.updateAuthConfig({
      providers: {
        google: {
          enabled: true,
          client_id: googleClientId,
          client_secret: googleClientSecret,
        }
      }
    });

    if (error) {
      console.error('Error configuring Google OAuth:', error);
      throw error;
    }

    console.log('Google OAuth provider configured successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Google OAuth provider configured successfully',
      data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in setup-google-oauth function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});