import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  apartmentId: string;
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
}

export default function BookingCalendar({ apartmentId, selected, onSelect }: BookingCalendarProps) {
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnavailable = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('fetch-calendar', {
          body: { apartment: apartmentId },
        });
        if (error) throw error;
        const dates: Date[] = (data?.unavailableDates ?? []).map((s: string) => new Date(s + 'T00:00:00'));
        setUnavailableDates(dates);
      } catch (e) {
        console.error('BookingCalendar: failed to fetch unavailable dates', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUnavailable();
  }, [apartmentId]);

  const isUnavailable = (date: Date): boolean => {
    const d = date.toISOString().split('T')[0];
    return unavailableDates.some((u) => u.toISOString().split('T')[0] === d);
  };

  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Caricamento disponibilità...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Calendar
        mode="range"
        selected={selected}
        onSelect={onSelect}
        numberOfMonths={2}
        disabled={(date) => isPast(date) || isUnavailable(date)}
        modifiers={{ unavailable: isUnavailable }}
        modifiersStyles={{
          unavailable: {
            backgroundColor: 'hsl(var(--destructive) / 0.15)',
            color: 'hsl(var(--destructive))',
            textDecoration: 'line-through',
          },
        }}
        className={cn("rounded-md border")}
      />
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
          Disponibile
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-destructive/15 border border-destructive/40" />
          Non disponibile
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
          Selezionato
        </span>
      </div>
    </div>
  );
}
