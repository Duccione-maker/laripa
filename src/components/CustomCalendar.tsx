import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CustomCalendarProps {
  apartmentId: string;
  apartmentName: string;
}

interface CalendarData {
  unavailableDates: string[];
  lastUpdated: string;
}

export default function CustomCalendar({ apartmentId, apartmentName }: CustomCalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarData();
  }, [apartmentId]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-calendar', {
        body: { apartment: apartmentId }
      });

      if (error) {
        console.error('Error fetching calendar:', error);
        throw error;
      }

      setCalendarData(data);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del calendario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDateUnavailable = (date: Date): boolean => {
    if (!calendarData) return false;
    const dateString = date.toISOString().split('T')[0];
    return calendarData.unavailableDates.includes(dateString);
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg md:text-2xl flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 md:h-6 md:w-6" />
            {apartmentName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Caricamento calendario...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg md:text-2xl flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 md:h-6 md:w-6" />
          {apartmentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className={cn("rounded-md border")}
            modifiers={{
              unavailable: (date) => isDateUnavailable(date),
              past: (date) => isDateInPast(date)
            }}
            modifiersStyles={{
              unavailable: {
                backgroundColor: 'hsl(var(--destructive))',
                color: 'hsl(var(--destructive-foreground))',
                fontWeight: 'bold'
              },
              past: {
                color: 'hsl(var(--muted-foreground))',
                textDecoration: 'line-through'
              }
            }}
            disabled={(date) => isDateInPast(date)}
          />
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-background border rounded"></div>
            <span>Disponibile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive rounded"></div>
            <span>Non disponibile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted text-muted-foreground border rounded flex items-center justify-center text-xs">
              ×
            </div>
            <span>Date passate</span>
          </div>
        </div>

        {calendarData?.lastUpdated && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Ultimo aggiornamento: {new Date(calendarData.lastUpdated).toLocaleString('it-IT')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}