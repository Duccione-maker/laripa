import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CustomCalendar from "@/components/CustomCalendar";

interface Apartment {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const [selectedApartment, setSelectedApartment] = useState<string>("fienile");
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select('id, name')
        .order('name');

      if (apartmentsError) throw apartmentsError;
      
      // Map to apartment keys used in calendar
      const apartmentMapping = [
        { id: 'fienile', name: 'Fienile' },
        { id: 'ghiri', name: 'Ghiri' },
        { id: 'nidi', name: 'Nidi' },
        { id: 'padronale', name: 'Padronale' }
      ];

      setApartments(apartmentMapping);
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Aggiornamento",
      description: "Calendario aggiornato con gli ultimi dati",
    });
  };

  const getApartmentName = (apartmentKey: string) => {
    const apartment = apartments.find(apt => apt.id === apartmentKey);
    return apartment?.name || apartmentKey;
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 md:mb-8">
            <div className="mb-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold mb-2">
                  <CalendarIcon className="inline-block mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8" />
                  Calendario Prenotazioni
                </h1>
                <p className="text-sm md:text-lg text-muted-foreground">
                  Visualizza disponibilità in tempo reale
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 md:h-5 md:w-5" />
                <Select value={selectedApartment} onValueChange={setSelectedApartment}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Seleziona appartamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Aggiorna
              </Button>
            </div>
          </div>

          {/* Custom Calendar */}
          <CustomCalendar 
            key={`${selectedApartment}-${refreshKey}`}
            apartmentId={selectedApartment}
            apartmentName={getApartmentName(selectedApartment)}
          />

          {/* Info Card */}
          <Card className="glass-card mt-6">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">
                  📅 Calendario sincronizzato in tempo reale con Smoobu
                </p>
                <p>
                  ✅ Disponibilità aggiornata automaticamente ogni ora
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}