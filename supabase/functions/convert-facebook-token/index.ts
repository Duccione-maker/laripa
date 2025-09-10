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
    const { currentToken, pageId } = await req.json();
    
    if (!currentToken) {
      return new Response(
        JSON.stringify({ error: 'Token Facebook richiesto' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const appId = Deno.env.get('FACEBOOK_APP_ID');
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
    
    if (!appId || !appSecret) {
      return new Response(
        JSON.stringify({ error: 'Configurazione Facebook mancante' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Step 1: Converting to long-lived user token...');
    
    // Passo 1: Converti il token in un token utente di lunga durata (60 giorni)
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${currentToken}`
    );

    if (!longLivedTokenResponse.ok) {
      const error = await longLivedTokenResponse.text();
      console.error('Error getting long-lived token:', error);
      return new Response(
        JSON.stringify({ error: 'Errore nella conversione del token utente', details: error }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const longLivedTokenData = await longLivedTokenResponse.json();
    const longLivedUserToken = longLivedTokenData.access_token;
    
    console.log('Step 2: Getting user ID...');
    
    // Ottieni l'ID utente per il passo successivo
    const userResponse = await fetch(`https://graph.facebook.com/me?access_token=${longLivedUserToken}`);
    const userData = await userResponse.json();
    const userId = userData.id;

    console.log('Step 3: Converting to permanent page token...');
    
    // Passo 2: Usa il token utente di lunga durata per ottenere il token pagina permanente
    const pageTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/accounts?access_token=${longLivedUserToken}`
    );

    if (!pageTokenResponse.ok) {
      const error = await pageTokenResponse.text();
      console.error('Error getting page token:', error);
      return new Response(
        JSON.stringify({ error: 'Errore nella conversione del token pagina', details: error }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const pageTokenData = await pageTokenResponse.json();
    
    // Trova la pagina specifica se pageId è fornito, altrimenti restituisci tutte
    let targetPage = null;
    if (pageId) {
      targetPage = pageTokenData.data.find((page: any) => page.id === pageId);
      if (!targetPage) {
        return new Response(
          JSON.stringify({ 
            error: `Pagina con ID ${pageId} non trovata`, 
            availablePages: pageTokenData.data.map((p: any) => ({ id: p.id, name: p.name }))
          }), 
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      // Se non specificata, prendi la prima pagina disponibile
      targetPage = pageTokenData.data[0];
    }

    console.log('Token conversion completed successfully!');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        permanentPageToken: targetPage.access_token,
        pageInfo: {
          id: targetPage.id,
          name: targetPage.name,
          category: targetPage.category
        },
        longLivedUserToken: longLivedUserToken,
        expiresIn: longLivedTokenData.expires_in,
        availablePages: pageTokenData.data.map((p: any) => ({ id: p.id, name: p.name })),
        message: 'Token convertito con successo! Il token della pagina non scade mai.'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error converting Facebook token:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Errore durante la conversione del token',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});