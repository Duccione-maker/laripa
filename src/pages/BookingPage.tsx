import { useState } from "react"
import { DateRange } from "react-day-picker"
import { format, differenceInDays } from "date-fns"
import { it } from "date-fns/locale"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
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
import { Check, Loader2, CreditCard } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

const APARTMENTS = [
  { id: "1", name: "Padronale", desc: "Vista panoramica · 6 ospiti" },
  { id: "2", name: "Ghiri",     desc: "Vista sui dintorni · 4 ospiti" },
  { id: "3", name: "Fienile",   desc: "Stile rustico · 3 ospiti" },
  { id: "4", name: "Nidi",      desc: "Romantico · 2 ospiti" },
]

// ─── Step 3: card form ───────────────────────────────────────────────────────
function CardForm({ clientSecret, amount, onSuccess, bookingPayload }: {
  clientSecret: string
  amount: number
  onSuccess: () => void
  bookingPayload: Record<string, unknown>
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState(false)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !ready) return
    const card = elements.getElement(CardElement)
    if (!card) return

    setProcessing(true)
    try {
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      })

      if (error) throw new Error(error.message)
      if (paymentIntent?.status !== 'succeeded') throw new Error('Pagamento non completato')

      // create booking on Smoobu + DB
      await supabase.functions.invoke('smoobu-booking', {
        body: { ...bookingPayload, paymentIntentId: paymentIntent.id }
      })

      onSuccess()
    } catch (err: unknown) {
      toast({ title: "Errore", description: err instanceof Error ? err.message : "Pagamento fallito", variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div>
        <Label className="mb-2 block">Dati carta</Label>
        <div className="border rounded-md p-3 bg-white dark:bg-zinc-900">
          <CardElement
            onReady={() => setReady(true)}
            options={{
              style: {
                base: { fontSize: '16px', color: '#1a1a1a', '::placeholder': { color: '#9ca3af' } },
                invalid: { color: '#ef4444' }
              },
              hidePostalCode: true
            }}
          />
        </div>
        {!ready && <p className="text-xs text-muted-foreground mt-1">Caricamento modulo carta...</p>}
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={!ready || processing}>
        {processing
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Elaborazione...</>
          : <><CreditCard className="mr-2 h-4 w-4"/>Paga €{amount}</>}
      </Button>
    </form>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function BookingPage() {
  const { user } = useAuth()
  const { toast } = useToast()

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

  const [paymentInfo, setPaymentInfo] = useState<{
    clientSecret: string; amount: number; nights: number;
    pricePerNight: number; discountApplied: boolean; discountPercent: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const nights = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) : 0
  const apt = APARTMENTS.find(a => a.id === apartmentId)!

  // Step 1 → 2
  const goStep2 = () => {
    if (!dateRange?.from || !dateRange?.to || nights <= 0) {
      toast({ title: "Seleziona date valide", variant: "destructive" }); return
    }
    setStep(2)
    window.scrollTo(0, 0)
  }

  // Step 2 → 3: create PaymentIntent
  const goStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName || !guestEmail) {
      toast({ title: "Nome e email obbligatori", variant: "destructive" }); return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          apartmentId,
          checkIn: format(dateRange!.from!, 'yyyy-MM-dd'),
          checkOut: format(dateRange!.to!, 'yyyy-MM-dd'),
          discountCode,
          guestEmail,
        }
      })
      if (error) throw error
      if (!data?.clientSecret) throw new Error(data?.error ?? 'Risposta non valida')

      if (discountCode && !data.discountApplied) {
        toast({ title: "Codice sconto non valido", variant: "destructive" })
      } else if (data.discountApplied) {
        toast({ title: `Sconto ${data.discountPercent}% applicato!` })
      }

      setPaymentInfo(data)
      setStep(3)
      window.scrollTo(0, 0)
    } catch (err: unknown) {
      toast({ title: "Errore", description: err instanceof Error ? err.message : "Errore server", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const bookingPayload = {
    apartmentId,
    guestName,
    guestEmail,
    guestPhone,
    checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
    checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
    adults: parseInt(adults),
    children: parseInt(children),
    notes,
    userId: user?.id ?? '',
  }

  if (confirmed) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600"/>
          </div>
          <h2 className="text-2xl font-bold">Prenotazione confermata!</h2>
          <p className="text-muted-foreground">
            Grazie {guestName}! Riceverai una email di conferma a <strong>{guestEmail}</strong>.
          </p>
          <div className="text-sm bg-muted rounded-lg p-4 text-left space-y-1">
            <div><span className="text-muted-foreground">Appartamento:</span> {apt.name}</div>
            <div><span className="text-muted-foreground">Check-in:</span> {dateRange?.from && format(dateRange.from, 'd MMM yyyy', { locale: it })}</div>
            <div><span className="text-muted-foreground">Check-out:</span> {dateRange?.to && format(dateRange.to, 'd MMM yyyy', { locale: it })}</div>
            <div><span className="text-muted-foreground">Totale pagato:</span> €{paymentInfo?.amount}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="container max-w-3xl mx-auto px-4 py-10">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10 text-sm">
            {['Date', 'Dati ospite', 'Pagamento'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === i+1 ? 'bg-primary text-white border-primary' : step > i+1 ? 'bg-primary/20 border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                  {step > i+1 ? <Check className="h-3 w-3"/> : i+1}
                </span>
                <span className={step === i+1 ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
                {i < 2 && <span className="text-muted-foreground/40 mx-1">→</span>}
              </div>
            ))}
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Apartment */}
              <Card>
                <CardHeader><CardTitle>Appartamento</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {APARTMENTS.map(a => (
                    <button key={a.id} type="button" onClick={() => setApartmentId(a.id)}
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${apartmentId === a.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/40'}`}>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Calendar */}
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

              {/* Guests */}
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
            <form onSubmit={goStep3} className="space-y-6">
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
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={()=>setStep(1)} className="flex-1">← Indietro</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Calcolo...</> : 'Vai al pagamento →'}
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && paymentInfo && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="bg-muted/40">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Appartamento</span><span>{apt.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span>{dateRange?.from && format(dateRange.from, 'd MMM yyyy', { locale: it })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{dateRange?.to && format(dateRange.to, 'd MMM yyyy', { locale: it })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Notti</span><span>{paymentInfo.nights}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Prezzo/notte</span><span>€{paymentInfo.pricePerNight}</span></div>
                  {paymentInfo.discountApplied && (
                    <div className="flex justify-between text-green-600"><span>Sconto {paymentInfo.discountPercent}%</span><span>-€{Math.round(paymentInfo.pricePerNight * paymentInfo.nights - paymentInfo.amount)}</span></div>
                  )}
                  <Separator/>
                  <div className="flex justify-between font-bold text-base"><span>Totale</span><span>€{paymentInfo.amount}</span></div>
                </CardContent>
              </Card>

              {/* Stripe */}
              <Card>
                <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ locale: 'it' }}>
                    <CardForm
                      clientSecret={paymentInfo.clientSecret}
                      amount={paymentInfo.amount}
                      bookingPayload={bookingPayload}
                      onSuccess={() => setConfirmed(true)}
                    />
                  </Elements>
                </CardContent>
              </Card>

              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={()=>setStep(2)}>← Torna ai dati ospite</Button>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
