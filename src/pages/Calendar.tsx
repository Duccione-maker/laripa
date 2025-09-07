import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, RefreshCw, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedApartment, setSelectedApartment] = useState<string>("all");
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
        .select('id, name')
        .order('name');

      if (apartmentsError) throw apartmentsError;
      setApartments(apartmentsData || []);

      // Set first apartment as default if none selected
      if (apartmentsData && apartmentsData.length > 0 && selectedApartment === "all") {
        setSelectedApartment(apartmentsData[0].id);
      }

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
      const response = await fetch(`https://dsylclbnkddaghmsptax.supabase.co/functions/v1/smoobu-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync' })
      });

      if (!response.ok) throw new Error('Sync failed');

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

  // Get bookings for specific apartment and date
  const getBookingsForApartmentAndDate = (apartmentId: string, date: Date) => {
    return bookings.filter(booking => {
      if (booking.apartment_id !== apartmentId) return false;
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      // Fix date comparison to work correctly with different years
      const targetDate = startOfDay(date);
      return targetDate >= startOfDay(checkIn) && targetDate < startOfDay(checkOut);
    });
  };

  // Get all bookings for specific apartment
  const getBookingsForApartment = (apartmentId: string) => {
    return bookings.filter(booking => booking.apartment_id === apartmentId);
  };

  // Get apartment name by ID
  const getApartmentName = (apartmentId: string) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    return apartment?.name || `Appartamento ${apartmentId}`;
  };

  // Custom day content to show booking indicators for specific apartment
  const getDayContent = (apartmentId: string) => ({ date }: { date: Date }) => {
    const dayBookings = getBookingsForApartmentAndDate(apartmentId, date);
    const hasBookings = dayBookings.length > 0;
    const isOccupied = dayBookings.some(b => b.status === 'confirmed');
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {hasBookings && (
          <div className={cn(
            "absolute inset-0 rounded-sm -z-10",
            isOccupied ? "bg-destructive/20 border border-destructive" : "bg-yellow-500/20 border border-yellow-500"
          )}></div>
        )}
        <span className={cn(
          "relative z-10 font-medium",
          hasBookings && isOccupied ? "text-destructive" : hasBookings ? "text-yellow-600" : "text-foreground"
        )}>{date.getDate()}</span>
      </div>
    );
  };

  const selectedDateBookings = selectedDate && selectedApartment !== "all" 
    ? getBookingsForApartmentAndDate(selectedApartment, selectedDate) 
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-96 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  <CalendarIcon className="inline-block mr-3 h-8 w-8" />
                  Calendario Prenotazioni
                </h1>
                <p className="text-lg text-muted-foreground">
                  Visualizza disponibilità e prenotazioni per appartamento
                </p>
              </div>
              <div className="flex gap-4">
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

            {/* Apartment Filter */}
            <div className="flex items-center gap-4 mb-6">
              <Filter className="h-5 w-5" />
              <Select value={selectedApartment} onValueChange={setSelectedApartment}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleziona appartamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli appartamenti</SelectItem>
                  {apartments.map((apartment) => (
                    <SelectItem key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedApartment === "all" ? (
            // Show all apartments in grid
            <div className="grid lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {apartments.map((apartment) => {
                const apartmentBookings = getBookingsForApartment(apartment.id);
                const confirmedBookings = apartmentBookings.filter(b => b.status === 'confirmed').length;
                const pendingBookings = apartmentBookings.filter(b => b.status === 'pending').length;

                return (
                  <Card key={apartment.id} className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{apartment.name}</span>
                        <div className="flex gap-2">
                          <Badge variant="default">{confirmedBookings} confermate</Badge>
                          <Badge variant="secondary">{pendingBookings} in attesa</Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={it}
                        className="p-4 pointer-events-auto"
                        components={{
                          DayContent: getDayContent(apartment.id)
                        }}
                      />
                      <div className="px-4 pb-4">
                        <Button 
                          onClick={() => setSelectedApartment(apartment.id)}
                          variant="outline" 
                          className="w-full"
                        >
                          Visualizza dettagli
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Show single apartment with details
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Single Calendar */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>{getApartmentName(selectedApartment)}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={it}
                    className="p-4 pointer-events-auto"
                    components={{
                      DayContent: getDayContent(selectedApartment)
                    }}
                  />
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-destructive rounded-sm"></div>
                        <span>Occupato</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                        <span>In attesa</span>
                      </div>
                    </div>
                  </div>
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

                {/* Statistics for selected apartment */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Statistiche {getApartmentName(selectedApartment)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {getBookingsForApartment(selectedApartment).filter(b => b.status === 'confirmed').length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Prenotazioni Confermate
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary">
                          {getBookingsForApartment(selectedApartment).filter(b => b.status === 'pending').length}
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
          )}

          {/* Legend */}
          <Card className="glass-card mt-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded-sm"></div>
                  <span>Giorni occupati (prenotazione confermata)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
                  <span>Giorni in attesa di conferma</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-muted rounded-sm"></div>
                  <span>Giorni liberi</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}