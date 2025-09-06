import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface Booking {
  id: string;
  apartment_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  adults: number;
  children: number;
}

interface Apartment {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch apartments
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select('id, name');

      if (apartmentsError) throw apartmentsError;
      setApartments(apartmentsData || []);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('check_in', { ascending: true });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del calendario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithSmoobu = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('smoobu-booking', {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast({
        title: "Sincronizzazione completata",
        description: "I dati sono stati aggiornati con Smoobu",
      });

      // Refresh data after sync
      fetchData();
    } catch (error) {
      console.error('Error syncing with Smoobu:', error);
      toast({
        title: "Errore sincronizzazione",
        description: "Impossibile sincronizzare con Smoobu",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Get bookings for selected date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return date >= checkIn && date <= checkOut;
    });
  };

  // Get apartment name by ID
  const getApartmentName = (apartmentId: string) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    return apartment?.name || `Appartamento ${apartmentId}`;
  };

  // Custom day content to show booking indicators
  const dayContent = (day: Date) => {
    const dayBookings = getBookingsForDate(day);
    const hasBookings = dayBookings.length > 0;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{day.getDate()}</span>
        {hasBookings && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
        )}
      </div>
    );
  };

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  <CalendarIcon className="inline-block mr-3 h-8 w-8" />
                  Calendario Prenotazioni
                </h1>
                <p className="text-lg text-muted-foreground">
                  Visualizza disponibilità e prenotazioni degli appartamenti
                </p>
              </div>
              <Button 
                onClick={syncWithSmoobu} 
                disabled={syncing}
                className="btn-primary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizzando...' : 'Sincronizza Smoobu'}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Calendario</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={it}
                  className="p-4 pointer-events-auto"
                  components={{
                    DayContent: ({ date }) => dayContent(date)
                  }}
                />
              </CardContent>
            </Card>

            {/* Booking Details */}
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>
                    {selectedDate 
                      ? `Prenotazioni del ${format(selectedDate, 'dd MMMM yyyy', { locale: it })}`
                      : 'Seleziona una data'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateBookings.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nessuna prenotazione per questa data
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedDateBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="p-4 border rounded-lg bg-card/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{booking.guest_name}</h4>
                            <Badge variant={
                              booking.status === 'confirmed' ? 'default' :
                              booking.status === 'pending' ? 'secondary' :
                              'destructive'
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {getApartmentName(booking.apartment_id)}
                          </p>
                          <p className="text-sm">
                            <strong>Check-in:</strong> {format(parseISO(booking.check_in), 'dd/MM/yyyy')}
                          </p>
                          <p className="text-sm">
                            <strong>Check-out:</strong> {format(parseISO(booking.check_out), 'dd/MM/yyyy')}
                          </p>
                          <p className="text-sm">
                            <strong>Ospiti:</strong> {booking.adults} adulti
                            {booking.children > 0 && `, ${booking.children} bambini`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking Statistics */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Statistiche</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {bookings.filter(b => b.status === 'confirmed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Prenotazioni Confermate
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">
                        {bookings.filter(b => b.status === 'pending').length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        In Attesa
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}