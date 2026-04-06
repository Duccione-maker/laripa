import { useState, useEffect } from "react"
import { DateRange } from "react-day-picker"
import { format, differenceInDays } from "date-fns"
import { it } from "date-fns/locale"
import { useSearchParams, useNavigate } from "react-router-dom"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import BookingCalendar from "@/components/BookingCalendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Check, Loader2, CreditCard, XCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

const APARTMENTS = [
  { id: "1", name: "Padronale", desc: "Vista panoramica · 6 ospiti" },
  { id: "2", name: "Ghiri",     desc: "Vista sui dintorni · 4 ospiti" },
  { id: "3", name: "Fienile",   desc: "Stile rustico · 3 ospiti" },
  { id: "4", name: "Nidi",      desc: "Romantico · 2 ospiti" },
]

const LS_KEY = 'laripa_booking_payload'

export default function BookingPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(1)
  const [apartmentId, setApartmentId] = useState("1")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [adults, setAdults] = useState("2")
  const [children, setChildren] = useState("0")
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState(user?.email ?? "")
  const [guestPhone, setGuestPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [loading, setLoading] = useState(false)

  // Return states from Stripe
  const [returnStatus, setReturnStatus] = useState<'success' | 'cancelled' | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [savedPayload, setSavedPayload] = useState<Record<string, unknown> | null>(null)

  const nights = dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from) : 0
  const apt = APARTMENTS.find(a => a.id === apartmentId) ?? APARTMENTS[0]

  // On mount: check if returning from Stripe
  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'success' || status === 'cancelled') {
      setReturnStatus(status)
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        try { setSavedPayload(JSON.parse(raw)) } catch (_) {}
      }
      // Clean URL
      navigate('/booking', { replace: true })
    }
  }, [])

  // After detecting success, create booking on Smoobu + DB
  useEffect(() => {
    if (returnStatus === 'success' && savedPayload && !confirmed && !confirmLoading) {
      setConfirmLoading(true)
      supabase.functions.invoke('smoobu-booking', { body: savedPayload })
        .then(({ error }) => {
          if (error) console.error('smoobu-booking error after payment:', error)
          localStorage.removeItem(LS_KEY)
          setConfirmed(true)
        })
        .catch(console.error)
        .finally(() => setConfirmLoading(false))
    }
  }, [returnStatus, savedPayload])

  // Step 1 → 2
  const goStep2 = () => {
    if (!dateRange?.from || !dateRange?.to || nights <= 0) {
      toast({ title: "Seleziona date valide", variant: "destructive" }); return
    }
    setStep(2); window.scrollTo(0, 0)
  }

  // Step 2 → Stripe Checkout
  const goCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName || !guestEmail) {
      toast({ title: "Nome e email obbligatori", variant: "destructive" }); return
    }
    setLoading(true)
    try {
      const checkIn = format(dateRange!.from!, 'yyyy-MM-dd')
      const checkOut = format(dateRange!.to!, 'yyyy-MM-dd')
      const origin = window.location.origin

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          apartmentId,
          checkIn,
          checkOut,
          discountCode,
          guestEmail,
          guestName,
          successUrl: `${origin}/booking?status=success`,
          cancelUrl:  `${origin}/booking?status=cancelled`,
        }
      })

      if (error) throw error
      if (!data?.url) throw new Error(data?.error ?? 'URL Stripe non ricevuto')

      if (discountCode && !data.discountApplied) {
        toast({ title: "Codice sconto non valido", variant: "destructive" })
      } else if (data.discountApplied) {
        toast({ title: `Sconto ${data.discountPercent}% applicato!` })
      }

      // Save booking payload to localStorage before redirect
      const payload = {
        apartmentId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        adults: parseInt(adults),
        children: parseInt(children),
        notes,
        userId: user?.id ?? '',
        amount: data.amount,
        nights: data.nights,
        pricePerNight: data.pricePerNight,
        discountApplied: data.discountApplied,
        discountPercent: data.discountPercent,
        aptName: apt.name,
      }
      localStorage.setItem(LS_KEY, JSON.stringify(payload))

      // Redirect to Stripe hosted checkout
      window.location.href = data.url

    } catch (err: unknown) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore server",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  // ── RETURN: payment cancelled ──────────────────────────────────────────────
  if (returnStatus === 'cancelled') return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-red-500"/>
          </div>
          <h2 className="text-2xl font-bold">Pagamento annullato</h2>
          <p className="text-muted-foreground">Nessun addebito è stato effettuato. Puoi riprovare quando vuoi.</p>
          <Button onClick={() => { setReturnStatus(null); setStep(1) }}>Riprova</Button>
        </div>
      </main>
      <Footer />
    </div>
  )

  // ── RETURN: payment success ────────────────────────────────────────────────
  if (returnStatus === 'success') {
    const p = savedPayload as Record<string, unknown> | null
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            {confirmLoading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary"/>
                <p className="text-muted-foreground">Conferma prenotazione in corso...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600"/>
                </div>
                <h2 className="text-2xl font-bold">Prenotazione confermata!</h2>
                <p className="text-muted-foreground">
                  Grazie {p?.guestName as string}! Riceverai una email di conferma a{' '}
                  <strong>{p?.guestEmail as string}</strong>.
                </p>
                {p && (
                  <div className="text-sm bg-muted rounded-lg p-4 text-left space-y-1">
                    <div><span className="text-muted-foreground">Appartamento:</span> {p.aptName as string}</div>
                    <div><span className="text-muted-foreground">Check-in:</span> {p.checkIn as string}</div>
                    <div><span className="text-muted-foreground">Check-out:</span> {p.checkOut as string}</div>
                    <div><span className="text-muted-foreground">Totale pagato:</span> €{p.amount as number}</div>
                  </div>
                )}
                <Button onClick={() => navigate('/')}>Torna alla home</Button>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── BOOKING WIZARD ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="container max-w-3xl mx-auto px-4 py-10">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10 text-sm">
            {['Date & Appartamento', 'Dati ospite', 'Pagamento'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step === i+1 ? 'bg-primary text-white border-primary'
                  : step > i+1  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {step > i+1 ? <Check className="h-3 w-3"/> : i+1}
                </span>
                <span className={step === i+1 ? 'font-medium' : 'text-muted-foreground hidden sm:inline'}>{label}</span>
                {i < 2 && <span className="text-muted-foreground/30 mx-1">→</span>}
              </div>
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Appartamento</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {APARTMENTS.map(a => (
                    <button key={a.id} type="button" onClick={() => setApartmentId(a.id)}
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${
                        apartmentId === a.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/40'
                      }`}>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Seleziona le date</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <BookingCalendar apartmentId={apartmentId} selected={dateRange} onSelect={setDateRange}/>
                  {nights > 0 && (
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      {format(dateRange!.from!, 'd MMM', { locale: it })} → {format(dateRange!.to!, 'd MMM yyyy', { locale: it })}
                      {' · '}<span className="font-medium text-foreground">{nights} nott{nights===1?'e':'i'}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Ospiti</CardTitle></CardHeader>
                <CardContent className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Label>Adulti</Label>
                    <Select value={adults} onValueChange={setAdults}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5,6].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Bambini</Label>
                    <Select value={children} onValueChange={setChildren}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{[0,1,2,3,4].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full" size="lg" onClick={goStep2}>Continua →</Button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={goCheckout} className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Dati ospite</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>Nome completo *</Label>
                    <Input required value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Mario Rossi"/>
                  </div>
                  <div className="space-y-1">
                    <Label>Email *</Label>
                    <Input required type="email" value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} placeholder="mario@example.com"/>
                  </div>
                  <div className="space-y-1">
                    <Label>Telefono</Label>
                    <Input type="tel" value={guestPhone} onChange={e=>setGuestPhone(e.target.value)} placeholder="+39 333 1234567"/>
                  </div>
                  <div className="space-y-1">
                    <Label>Richieste speciali</Label>
                    <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Orario di arrivo, allergie..."/>
                  </div>
                  <div className="space-y-1">
                    <Label>Codice sconto</Label>
                    <Input value={discountCode} onChange={e=>setDiscountCode(e.target.value.toUpperCase())} placeholder="CODICE"/>
                  </div>
                </CardContent>
              </Card>

              {/* Price preview */}
              <Card className="bg-muted/40">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Appartamento</span><span>{apt.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span>{dateRange?.from && format(dateRange.from, 'd MMM yyyy', { locale: it })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{dateRange?.to && format(dateRange.to, 'd MMM yyyy', { locale: it })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Notti</span><span>{nights}</span></div>
                  <Separator/>
                  <p className="text-xs text-muted-foreground">Il prezzo definitivo verrà mostrato nella pagina di pagamento Stripe.</p>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={()=>setStep(1)} className="flex-1">← Indietro</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Caricamento...</>
                    : <><CreditCard className="mr-2 h-4 w-4"/>Vai al pagamento</>}
                </Button>
              </div>
            </form>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
