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

    // Create calendar div
    const calendarDiv = document.createElement('div');
    calendarDiv.innerHTML = smoobuData.widget;
    calendarContainer.appendChild(calendarDiv);

    // Load Smoobu script if not already loaded
    if (!document.querySelector('script[src*="CalendarWidget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://login.smoobu.com/js/Apartment/CalendarWidget.js';
      script.onload = () => {
        // Script loaded, calendar should initialize automatically
        console.log('Smoobu calendar script loaded');
      };
      document.head.appendChild(script);
    } else {
      // Script already exists, try to reinitialize
      setTimeout(() => {
        if (window.CalendarWidget) {
          // Reinitialize if the global is available
          window.CalendarWidget.init();
        }
      }, 100);
    }
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  <CalendarIcon className="inline-block mr-3 h-8 w-8" />
                  Calendario Prenotazioni Smoobu
                </h1>
                <p className="text-lg text-muted-foreground">
                  Visualizza disponibilità e prenotazioni sincronizzate con Smoobu
                </p>
              </div>
            </div>

            {/* Apartment Filter */}
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-5 w-5" />
              <Select value={selectedApartment} onValueChange={setSelectedApartment}>
                <SelectTrigger className="w-64">
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
            <CardHeader>
              <CardTitle className="text-2xl">
                {getApartmentName(selectedApartment)} - Calendario Smoobu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                id="smoobu-calendar-container" 
                className="min-h-[600px] w-full"
                style={{ 
                  background: 'transparent',
                  border: 'none'
                }}
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="glass-card mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">
                  📅 Calendario sincronizzato in tempo reale con Smoobu
                </p>
                <p>
                  ✅ Tutte le prenotazioni, blocchi e disponibilità sono aggiornate automaticamente
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