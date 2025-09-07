import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarEvent {
  date: string;
  available: boolean;
}

// Simple iCal parser for availability
function parseICalForAvailability(icalData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icalData.split('\n');
  
  let currentEvent: any = {};
  let inEvent = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (trimmedLine === 'END:VEVENT' && inEvent) {
      if (currentEvent.dtstart && currentEvent.dtend) {
        // Parse dates and create unavailable events
        const startDate = parseICalDate(currentEvent.dtstart);
        const endDate = parseICalDate(currentEvent.dtend);
        
        if (startDate && endDate) {
          const current = new Date(startDate);
          while (current < endDate) {
            events.push({
              date: current.toISOString().split('T')[0],
              available: false
            });
            current.setDate(current.getDate() + 1);
          }
        }
      }
      inEvent = false;
    } else if (inEvent) {
      if (trimmedLine.startsWith('DTSTART')) {
        currentEvent.dtstart = trimmedLine.split(':')[1];
      } else if (trimmedLine.startsWith('DTEND')) {
        currentEvent.dtend = trimmedLine.split(':')[1];
      }
    }
  }
  
  return events;
}

function parseICalDate(dateString: string): Date | null {
  try {
    // Handle different iCal date formats
    if (dateString.includes('T')) {
      // DateTime format: 20231201T140000Z
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1;
      const day = parseInt(dateString.substring(6, 8));
      return new Date(year, month, day);
    } else {
      // Date only format: 20231201
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1;
      const day = parseInt(dateString.substring(6, 8));
      return new Date(year, month, day);
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apartmentId = url.searchParams.get('apartment');
    
    if (!apartmentId) {
      return new Response(
        JSON.stringify({ error: 'Apartment ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Map apartment IDs to iCal secret names
    const icalSecretMap: Record<string, string> = {
      'fienile': 'SMOOBU_ICAL_FIENILE',
      'ghiri': 'SMOOBU_ICAL_GHIRI', 
      'nidi': 'SMOOBU_ICAL_NIDI',
      'padronale': 'SMOOBU_ICAL_PADRONALE'
    };

    const secretName = icalSecretMap[apartmentId.toLowerCase()];
    if (!secretName) {
      return new Response(
        JSON.stringify({ error: 'Invalid apartment ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get iCal URL from secrets
    const icalUrl = Deno.env.get(secretName);
    if (!icalUrl) {
      console.error(`Secret ${secretName} not found`);
      return new Response(
        JSON.stringify({ error: 'iCal configuration not found' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching iCal for ${apartmentId} from ${secretName}`);

    // Fetch iCal data
    const icalResponse = await fetch(icalUrl);
    if (!icalResponse.ok) {
      throw new Error(`Failed to fetch iCal: ${icalResponse.statusText}`);
    }

    const icalData = await icalResponse.text();
    console.log(`Successfully fetched iCal data for ${apartmentId}`);

    // Parse iCal for availability
    const unavailableEvents = parseICalForAvailability(icalData);
    
    console.log(`Parsed ${unavailableEvents.length} unavailable dates for ${apartmentId}`);

    return new Response(
      JSON.stringify({ 
        apartment: apartmentId,
        unavailableDates: unavailableEvents.map(e => e.date),
        lastUpdated: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-calendar function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch calendar data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});