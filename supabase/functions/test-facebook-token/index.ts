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
    const accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Token Facebook non trovato' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test 1: Verifica il token
    console.log('Testing Facebook token...');
    const tokenResponse = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`);
    const tokenData = await tokenResponse.json();
    
    console.log('Token response:', tokenData);

    // Test 2: Verifica le pagine accessibili
    console.log('Testing page access...');
    const pagesResponse = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();
    
    console.log('Pages response:', pagesData);

    // Test 3: Verifica la pagina specifica
    const pageId = '130801953656622'; // La Ripa page ID
    console.log(`Testing specific page: ${pageId}`);
    const pageResponse = await fetch(`https://graph.facebook.com/${pageId}?access_token=${accessToken}`);
    const pageData = await pageResponse.json();
    
    console.log('Page response:', pageData);

    return new Response(
      JSON.stringify({ 
        tokenTest: tokenData,
        pagesTest: pagesData,
        pageTest: pageData,
        message: 'Test completato - controlla i log per i dettagli'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error testing Facebook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Errore durante il test',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});