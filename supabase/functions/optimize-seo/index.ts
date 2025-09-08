import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { title, content } = await req.json();

    console.log('Optimizing SEO for:', title);

    const prompt = `Analizza questo articolo di blog su una struttura ricettiva in Toscana a San Gimignano e ottimizza gli elementi SEO.

TITOLO: ${title}
CONTENUTO: ${content}

Genera una risposta JSON con questi campi esatti (mantieni il formato JSON valido):

{
  "metaTitle": "Meta title ottimizzato per SEO (max 60 caratteri), include parole chiave come San Gimignano, Toscana, appartamenti",
  "metaDescription": "Meta description accattivante (max 160 caratteri) che inviti a leggere l'articolo, con parole chiave locali",
  "slug": "url-slug-seo-friendly-senza-spazi",
  "excerpt": "Breve estratto accattivante dell'articolo (2-3 frasi) che riassuma il contenuto principale",
  "keywords": ["parola1", "parola2", "parola3", "san gimignano", "toscana"]
}

REGOLE:
- Meta title: massimo 60 caratteri, include sempre "San Gimignano" o "Toscana"
- Meta description: massimo 160 caratteri, deve essere accattivante
- Slug: solo minuscole, trattini, senza caratteri speciali
- Excerpt: 2-3 frasi che riassumano il valore dell'articolo
- Keywords: 5-8 parole chiave rilevanti, includi sempre termini locali

Rispondi SOLO con il JSON valido, senza testo aggiuntivo.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Sei un esperto SEO specialist per strutture ricettive in Toscana. Genera sempre JSON valido senza commenti o testo aggiuntivo.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('OpenAI response:', generatedText);

    // Parse the JSON response
    let seoData;
    try {
      seoData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback to manual extraction if JSON parsing fails
      seoData = {
        metaTitle: title.slice(0, 60),
        metaDescription: `Scopri di più su ${title} nella nostra struttura a San Gimignano, Toscana.`,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        excerpt: content.slice(0, 200) + '...',
        keywords: ['san gimignano', 'toscana', 'appartamenti', 'vacanze']
      };
    }

    return new Response(JSON.stringify(seoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in optimize-seo function:', error);
    return new Response(JSON.stringify({ 
      error: 'Errore nell\'ottimizzazione SEO',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});