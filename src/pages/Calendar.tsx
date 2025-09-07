import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Apartment {
  id: string;
  name: string;
  smoobuId: string;
  smoobuWidget: string;
}

const SMOOBU_CALENDARS = {
  fienile: {
    id: "195816",
    widget: `<div id="smoobuApartment195816de" class="calendarWidget"> <div class="calendarContent" data-load-calendar-url="https://login.smoobu.com/de/cockpit/widget/single-calendar/195816" data-verification="009c2e2b4809ceab355e5db63dc55cc9a4dbcef226c66755298e198a4b041f5c" data-baseUrl="https://login.smoobu.com" data-disable-css="false" ></div> <script type="text/javascript" src="https://login.smoobu.com/js/Apartment/CalendarWidget.js"></script></div>`
  },
  ghiri: {
    id: "195814", 
    widget: `<div id="smoobuApartment195814de" class="calendarWidget"> <div class="calendarContent" data-load-calendar-url="https://login.smoobu.com/de/cockpit/widget/single-calendar/195814" data-verification="633c7651d8cbd905da5e4e17a93a1269dd53126bb0a7984854d73e0d41d64367" data-baseUrl="https://login.smoobu.com" data-disable-css="false" ></div> <script type="text/javascript" src="https://login.smoobu.com/js/Apartment/CalendarWidget.js"></script></div>`
  },
  nidi: {
    id: "195815",
    widget: `<div id="smoobuApartment195815de" class="calendarWidget"> <div class="calendarContent" data-load-calendar-url="https://login.smoobu.com/de/cockpit/widget/single-calendar/195815" data-verification="f4ebf02b81dfe90118497fa57c5ee52400d84127b23220ebc861d8fc76a93b20" data-baseUrl="https://login.smoobu.com" data-disable-css="false" ></div> <script type="text/javascript" src="https://login.smoobu.com/js/Apartment/CalendarWidget.js"></script></div>`
  },
  padronale: {
    id: "192379",
    widget: `<div id="smoobuApartment192379de" class="calendarWidget"> <div class="calendarContent" data-load-calendar-url="https://login.smoobu.com/de/cockpit/widget/single-calendar/192379" data-verification="9307c05a6b4ecbf2240e3ce01d11bef8d2584235660e6437ad52f086e058ddbc" data-baseUrl="https://login.smoobu.com" data-disable-css="false" ></div> <script type="text/javascript" src="https://login.smoobu.com/js/Apartment/CalendarWidget.js"></script></div>`
  }
};

export default function CalendarPage() {
  const [selectedApartment, setSelectedApartment] = useState<string>("fienile");
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchApartments();
  }, []);

  useEffect(() => {
    // Load calendar widget when apartment changes
    if (selectedApartment && SMOOBU_CALENDARS[selectedApartment as keyof typeof SMOOBU_CALENDARS]) {
      loadSmoobuCalendar();
    }
  }, [selectedApartment]);

  const fetchApartments = async () => {
    try {
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select('id, name')
        .order('name');

      if (apartmentsError) throw apartmentsError;
      
      // Map database apartments to Smoobu calendars
      const mappedApartments = apartmentsData?.map(apt => {
        const smoobuKey = apt.name.toLowerCase().replace(/\s+/g, '');
        const smoobuData = SMOOBU_CALENDARS[smoobuKey as keyof typeof SMOOBU_CALENDARS];
        return {
          ...apt,
          smoobuId: smoobuData?.id || '',
          smoobuWidget: smoobuData?.widget || ''
        };
      }) || [];

      setApartments(mappedApartments);
    } catch (error) {
      console.error('Error fetching apartments:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli appartamenti",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSmoobuCalendar = () => {
    const calendarContainer = document.getElementById('smoobu-calendar-container');
    if (!calendarContainer) return;

    const smoobuData = SMOOBU_CALENDARS[selectedApartment as keyof typeof SMOOBU_CALENDARS];
    if (!smoobuData) return;

    // Clear previous calendar
    calendarContainer.innerHTML = '';

    // Insert the widget HTML directly
    calendarContainer.innerHTML = smoobuData.widget;

    // Add custom styling to improve appearance
    const customStyles = `
      <style>
        .calendarWidget {
          border: none !important;
          background: transparent !important;
          font-family: inherit !important;
        }
        .calendarContent {
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: none !important;
          border: none !important;
        }
        .calendarWidget table {
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }
        .calendarWidget th {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          font-weight: 600 !important;
          padding: 12px 8px !important;
        }
        .calendarWidget td {
          border: 1px solid hsl(var(--border)) !important;
          padding: 8px !important;
        }
        .calendarWidget .calendar-month-header {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
          font-weight: 600 !important;
          padding: 16px !important;
          text-align: center !important;
        }
        /* Mobile responsive - show only one month */
        @media (max-width: 768px) {
          .calendarWidget {
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          /* Hide second month on mobile */
          .calendarWidget .calendar-month:nth-child(2),
          .calendarWidget .calendar-month:nth-child(n+2),
          .calendarWidget table:nth-child(2),
          .calendarWidget table:nth-child(n+2),
          .calendarWidget > div > div:nth-child(2),
          .calendarWidget > div > div:nth-child(n+2),
          .calendarWidget .month:nth-child(2),
          .calendarWidget .month:nth-child(n+2) {
            display: none !important;
          }
          .calendarWidget table {
            min-width: 100% !important;
            font-size: 12px !important;
            width: 100% !important;
          }
          .calendarWidget th,
          .calendarWidget td {
            padding: 4px 2px !important;
            font-size: 11px !important;
          }
          /* Ensure container doesn't allow horizontal scroll */
          .calendarContent {
            overflow-x: hidden !important;
          }
        }
        /* Hide Smoobu branding */
        .calendarWidget [style*="Powered by"] {
          display: none !important;
        }
        .calendarWidget a[href*="smoobu"] {
          display: none !important;
        }
      </style>
    `;
    
    calendarContainer.insertAdjacentHTML('afterbegin', customStyles);

    // Force reload of the script to initialize the widget
    const existingScript = document.querySelector('script[src*="CalendarWidget.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create and load the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://login.smoobu.com/js/Apartment/CalendarWidget.js';
    script.onload = () => {
      console.log('Smoobu calendar script loaded and should initialize automatically');
      // Apply additional styling after load
      setTimeout(() => {
        const calendarElements = calendarContainer.querySelectorAll('.calendarWidget *');
        calendarElements.forEach(el => {
          if (el.textContent?.includes('Powered by Smoobu') || el.textContent?.includes('Smoobu')) {
            (el as HTMLElement).style.display = 'none';
          }
        });
      }, 1000);
    };
    script.onerror = () => {
      console.error('Failed to load Smoobu calendar script');
    };
    document.head.appendChild(script);
  };

  const getApartmentName = (apartmentKey: string) => {
    const names = {
      fienile: "Fienile",
      ghiri: "Ghiri", 
      nidi: "Nidi",
      padronale: "Padronale"
    };
    return names[apartmentKey as keyof typeof names] || apartmentKey;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50 pt-20">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 md:mb-8">
            <div className="mb-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold mb-2">
                  <CalendarIcon className="inline-block mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8" />
                  Calendario Prenotazioni
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground">
                  Visualizza disponibilità e gestisci prenotazioni
                </p>
              </div>
            </div>

            {/* Apartment Filter */}
            <div className="flex items-center gap-2 md:gap-4 mb-6">
              <Filter className="h-4 w-4 md:h-5 md:w-5" />
              <Select value={selectedApartment} onValueChange={setSelectedApartment}>
                <SelectTrigger className="w-full max-w-64">
                  <SelectValue placeholder="Seleziona appartamento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SMOOBU_CALENDARS).map((key) => (
                    <SelectItem key={key} value={key}>
                      {getApartmentName(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Smoobu Calendar Widget */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-2xl">
                {getApartmentName(selectedApartment)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              <div 
                id="smoobu-calendar-container" 
                className="min-h-[400px] md:min-h-[600px] w-full bg-gradient-to-br from-background to-muted/20 rounded-lg overflow-hidden border"
                style={{
                  maxWidth: '100%',
                  overflow: 'auto'
                }}
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="glass-card mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">
                  📅 Calendario sincronizzato in tempo reale
                </p>
                <p>
                  ✅ Prenotazioni e disponibilità aggiornate automaticamente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Extend window type for TypeScript
declare global {
  interface Window {
    CalendarWidget: any;
  }
}