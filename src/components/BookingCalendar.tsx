import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface Props {
  apartmentId: string
  selected: DateRange | undefined
  onSelect: (r: DateRange | undefined) => void
}

export default function BookingCalendar({ apartmentId, selected, onSelect }: Props) {
  const [unavailable, setUnavailable] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.functions.invoke('fetch-calendar', { body: { apartment: apartmentId } })
      .then(({ data }) => {
        const dates: Date[] = (data?.unavailableDates ?? []).map((s: string) => new Date(s + 'T12:00:00'))
        setUnavailable(dates)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apartmentId])

  const isDisabled = (date: Date) => {
    const today = new Date(); today.setHours(0,0,0,0)
    if (date < today) return true
    const d = date.toISOString().split('T')[0]
    return unavailable.some(u => u.toISOString().split('T')[0] === d)
  }

  if (loading) return (
    <div className="flex items-center gap-2 justify-center py-16 text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin" /> Caricamento calendario...
    </div>
  )

  return (
    <div className="space-y-2">
      <Calendar
        mode="range"
        selected={selected}
        onSelect={onSelect}
        numberOfMonths={2}
        disabled={isDisabled}
        modifiers={{ unavailable: (d) => unavailable.some(u => u.toISOString().split('T')[0] === d.toISOString().split('T')[0]) }}
        modifiersStyles={{ unavailable: { textDecoration: 'line-through', color: 'hsl(var(--destructive))' } }}
      />
      <div className="flex gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary inline-block"/>Selezionato</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border inline-block"/>Disponibile</span>
        <span className="flex items-center gap-1 line-through">xx Non disponibile</span>
      </div>
    </div>
  )
}
