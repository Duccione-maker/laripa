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
    const { title, excerpt, slug, imageUrl } = await req.json();
    
    if (!title || !slug) {
      return new Response(
        JSON.stringify({ error: 'Titolo e slug sono richiesti' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    const pageId = '105934702166031'; // ID della tua pagina Facebook
    
    if (!accessToken) {
      console.error('Facebook access token not found');
      return new Response(
        JSON.stringify({ error: 'Facebook access token non configurato' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // URL dell'articolo (assumendo che sia ospitato su Lovable)
    const articleUrl = `https://15ad7b77-3cf0-4a5c-9b07-d510b564a510.sandbox.lovable.dev/blog/${slug}`;
    
    // Prepara il messaggio per Facebook
    let message = `🏡 Nuovo articolo sul nostro blog!\n\n📖 ${title}`;
    
    if (excerpt) {
      message += `\n\n${excerpt}`;
    }
    
    message += `\n\n👉 Leggi tutto: ${articleUrl}`;
    
    // Aggiungi hashtag pertinenti
    message += `\n\n#SanGimignano #Tuscany #Travel #Blog #LaRipadiSanGimignano`;

    console.log(`Publishing blog post to Facebook: ${title}`);
    console.log(`Message: ${message}`);

    // Pubblica su Facebook
    const facebookUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    
    const postData = {
      message: message,
      access_token: accessToken
    };

    // Se c'è un'immagine, includila
    if (imageUrl) {
      postData.link = articleUrl;
      postData.picture = imageUrl;
    }

    const response = await fetch(facebookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Errore durante la pubblicazione su Facebook',
          details: errorText 
        }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const result = await response.json();
    console.log('Facebook post published successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true,
        facebookPostId: result.id,
        message: 'Articolo pubblicato su Facebook con successo'
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in publish-to-facebook function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Errore interno del server',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});