import { useState, useEffect, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingCalendar from "@/components/BookingCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Users, CreditCard, Check, Loader2, Tag, ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Stripe loader (publishable key from env) ────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

// ─── Apartments static data ──────────────────────────────────────────────────
const APARTMENTS = [
  { id: "1", name: "Padronale", capacity: 6, description: "Vista panoramica, 120 m²" },
  { id: "2", name: "Ghiri",     capacity: 4, description: "Vista sui dintorni, 85 m²" },
  { id: "3", name: "Fienile",   capacity: 3, description: "Stile rustico, 65 m²" },
  { id: "4", name: "Nidi",      capacity: 2, description: "Romantico, 45 m²" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface PaymentData {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  nights: number;
  pricePerNight: number;
  discountApplied: boolean;
  discountPercent: number;
  priceSource: string;
}

interface GuestData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes: string;
  discountCode: string;
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Date & Appartamento", icon: CalendarIcon },
    { n: 2, label: "Dati ospite",         icon: Users },
    { n: 3, label: "Pagamento",           icon: CreditCard },
    { n: 4, label: "Conferma",            icon: Check },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "bg-primary/10 border-primary text-primary" :
                         "bg-muted border-muted-foreground/30 text-muted-foreground"
              )}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                "text-xs mt-1 hidden sm:block",
                active ? "text-primary font-medium" : "text-muted-foreground"
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-8 sm:w-16 mx-1 mb-4 sm:mb-0 transition-colors",
                current > s.n ? "bg-primary" : "bg-muted-foreground/20"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Price summary card ──────────────────────────────────────────────────────
function PriceSummary({
  apartmentName, checkIn, checkOut, nights, pricePerNight,
  discountApplied, discountPercent, totalPrice
}: {
  apartmentName: string; checkIn: Date; checkOut: Date; nights: number;
  pricePerNight: number; discountApplied: boolean; discountPercent: number; totalPrice: number;
}) {
  const gross = pricePerNight * nights;
  return (
    <Card className="bg-muted/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Riepilogo prenotazione</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Appartamento</span><span className="font-medium">{apartmentName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span>{format(checkIn, "d MMM yyyy", { locale: it })}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{format(checkOut, "d MMM yyyy", { locale: it })}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Notti</span><span>{nights}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Prezzo/notte</span><span>€{pricePerNight}</span></div>
        {discountApplied && (
          <>
            <div className="flex justify-between text-muted-foreground"><span>Subtotale</span><span>€{gross}</span></div>
            <div className="flex justify-between text-green-600 font-medium">
              <span className="flex items-center gap-1"><Tag className="h-3 w-3" />Sconto {discountPercent}%</span>
              <span>-€{gross - totalPrice}</span>
            </div>
          </>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-base">
          <span>Totale</span>
          <span>€{totalPrice}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stripe payment form (inner, needs stripe context) ───────────────────────
function StripePaymentForm({
  paymentData, bookingPayload, onSuccess
}: {
  paymentData: PaymentData;
  bookingPayload: {
    apartmentId: string; guestName: string; guestEmail: string;
    guestPhone: string; checkIn: string; checkOut: string;
    adults: number; children: number; notes: string; userId: string;
  };
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !elementReady) return;

    setProcessing(true);
    try {
      // Confirm payment with Stripe
      const { paymentIntent, error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('Pagamento non completato. Stato: ' + paymentIntent?.status);
      }

      // Payment succeeded → create booking on Smoobu + Supabase
      const { error: bookingError } = await supabase.functions.invoke('smoobu-booking', {
        body: {
          ...bookingPayload,
          paymentIntentId: paymentIntent.id,
        },
      });

      if (bookingError) {
        // Payment went through but booking creation failed — show warning, not error
        console.error('Booking creation error after payment:', bookingError);
        toast({
          title: "Pagamento ricevuto",
          description: "Il pagamento è andato a buon fine. Contattaci per confermare la prenotazione.",
          variant: "destructive",
        });
      }

      onSuccess();
    } catch (err: unknown) {
      toast({
        title: "Errore pagamento",
        description: err instanceof Error ? err.message : "Pagamento non riuscito. Riprova.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <div className="rounded-lg border p-4 bg-background">
        {!elementReady && (
          <div className="flex items-center justify-center h-20 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Caricamento modulo di pagamento...
          </div>
        )}
        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{ wallets: { googlePay: 'never', applePay: 'never' } }}
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || !elementReady || processing}>
        {processing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Elaborazione...</>
        ) : (
          <><CreditCard className="mr-2 h-4 w-4" />Paga €{paymentData.amount}</>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Pagamento sicuro gestito da Stripe. I tuoi dati sono protetti.
      </p>
    </form>
  );
}

// ─── Main BookingPage ────────────────────────────────────────────────────────
export default function BookingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [apartmentId, setApartmentId] = useState("1");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");

  // Step 2 state
  const [guest, setGuest] = useState<GuestData>({
    guestName: "", guestEmail: "", guestPhone: "", notes: "", discountCode: "",
  });
  const [discountLoading, setDiscountLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  // Prefill email from auth
  useEffect(() => {
    if (user?.email && !guest.guestEmail) {
      setGuest(g => ({ ...g, guestEmail: user.email ?? "" }));
    }
  }, [user]);

  const selectedApartment = APARTMENTS.find(a => a.id === apartmentId)!;
  const nights = dateRange?.from && dateRange?.to
    ? differenceInDays(dateRange.to, dateRange.from)
    : 0;

  // ── Step 1 → Step 2 ────────────────────────────────────────────────────────
  const goToStep2 = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: "Seleziona le date", description: "Scegli check-in e check-out nel calendario.", variant: "destructive" });
      return;
    }
    if (nights <= 0) {
      toast({ title: "Date non valide", description: "Il check-out deve essere dopo il check-in.", variant: "destructive" });
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 2 → Step 3: call create-payment-intent ───────────────────────────
  const goToStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest.guestName || !guest.guestEmail) {
      toast({ title: "Dati mancanti", description: "Inserisci nome e email.", variant: "destructive" });
      return;
    }

    setDiscountLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          apartmentId,
          checkIn: format(dateRange!.from!, 'yyyy-MM-dd'),
          checkOut: format(dateRange!.to!, 'yyyy-MM-dd'),
          adults: parseInt(adults),
          children: parseInt(children),
          discountCode: guest.discountCode,
          guestName: guest.guestName,
          guestEmail: guest.guestEmail,
        },
      });

      if (error) throw error;
      if (!data?.clientSecret) throw new Error('Risposta non valida dal server');

      if (guest.discountCode && !data.discountApplied) {
        toast({ title: "Codice sconto non valido", description: "Il codice inserito non è riconosciuto.", variant: "destructive" });
      } else if (data.discountApplied) {
        toast({ title: `Sconto ${data.discountPercent}% applicato!`, description: "Il codice promozionale è stato applicato." });
      }

      setPaymentData(data);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore nella creazione del pagamento.",
        variant: "destructive",
      });
    } finally {
      setDiscountLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Memoize to avoid recreating object references on every render —
  // stable props prevent Elements / PaymentElement from remounting.
  const bookingPayload = useMemo(() => ({
    apartmentId,
    guestName: guest.guestName,
    guestEmail: guest.guestEmail,
    guestPhone: guest.guestPhone,
    checkIn: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
    checkOut: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
    adults: parseInt(adults),
    children: parseInt(children),
    notes: guest.notes,
    userId: user?.id ?? '',
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [step]); // freeze once we reach step 3; values are already validated

  const elementsOptions = useMemo(() => paymentData ? ({
    clientSecret: paymentData.clientSecret,
    appearance: { theme: 'stripe' as const },
    locale: 'it' as const,
  }) : undefined, [paymentData?.clientSecret]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Header */}
        <section className="py-12 bg-gradient-to-r from-background to-muted/40">
          <div className="container text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Prenota il tuo soggiorno</h1>
            <p className="text-muted-foreground">La Ripa di San Gimignano — prenotazione diretta</p>
          </div>
        </section>

        <section className="container py-10 max-w-4xl mx-auto px-4">
          <StepIndicator current={step} />

          {/* ── STEP 1: Apartment + Dates + Guests ───────────────────────── */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              {/* Apartment selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Scegli l'appartamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {APARTMENTS.map(apt => (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={() => setApartmentId(apt.id)}
                        className={cn(
                          "text-left rounded-lg border-2 p-4 transition-colors",
                          apartmentId === apt.id
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/40"
                        )}
                      >
                        <div className="font-semibold">{apt.name}</div>
                        <div className="text-sm text-muted-foreground">{apt.description}</div>
                        <Badge variant="secondary" className="mt-2">max {apt.capacity} ospiti</Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Seleziona le date
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <BookingCalendar
                    apartmentId={apartmentId}
                    selected={dateRange}
                    onSelect={setDateRange}
                  />
                  {dateRange?.from && dateRange?.to && (
                    <p className="mt-4 text-sm text-center text-muted-foreground">
                      {format(dateRange.from, "d MMM", { locale: it })} → {format(dateRange.to, "d MMM yyyy", { locale: it })}
                      {" · "}<span className="font-medium text-foreground">{nights} nott{nights === 1 ? "e" : "i"}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Guests */}
              <Card>
                <CardHeader>
                  <CardTitle>Numero ospiti</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-6">
                  <div className="flex-1 space-y-2">
                    <Label>Adulti</Label>
                    <Select value={adults} onValueChange={setAdults}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} adult{n === 1 ? "o" : "i"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Bambini</Label>
                    <Select value={children} onValueChange={setChildren}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3,4].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} bambin{n === 1 ? "o" : "i"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full" size="lg" onClick={goToStep2}>
                Continua <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: Guest info + discount + price preview ─────────────── */}
          {step === 2 && (
            <form onSubmit={goToStep3} className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Dati ospite
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guestName">Nome completo *</Label>
                      <Input
                        id="guestName"
                        required
                        placeholder="Mario Rossi"
                        value={guest.guestName}
                        onChange={e => setGuest(g => ({ ...g, guestName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guestEmail">Email *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        required
                        placeholder="mario@example.com"
                        value={guest.guestEmail}
                        onChange={e => setGuest(g => ({ ...g, guestEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestPhone">Telefono</Label>
                    <Input
                      id="guestPhone"
                      type="tel"
                      placeholder="+39 333 1234567"
                      value={guest.guestPhone}
                      onChange={e => setGuest(g => ({ ...g, guestPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Richieste speciali</Label>
                    <Textarea
                      id="notes"
                      placeholder="Allergie, orari di arrivo, esigenze particolari..."
                      rows={3}
                      value={guest.notes}
                      onChange={e => setGuest(g => ({ ...g, notes: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Discount code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="h-4 w-4" />
                    Codice sconto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Inserisci codice promozionale"
                    value={guest.discountCode}
                    onChange={e => setGuest(g => ({ ...g, discountCode: e.target.value.toUpperCase() }))}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Lo sconto verrà applicato nel passaggio successivo.
                  </p>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft className="mr-2 h-4 w-4" />Indietro
                </Button>
                <Button type="submit" className="flex-1" disabled={discountLoading}>
                  {discountLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calcolo prezzo...</>
                    : <>Vai al pagamento <ChevronRight className="ml-2 h-4 w-4" /></>
                  }
                </Button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Stripe payment ────────────────────────────────────── */}
          {step === 3 && paymentData && elementsOptions && (
            <div className="space-y-6 animate-fade-in">
              <PriceSummary
                apartmentName={selectedApartment.name}
                checkIn={dateRange!.from!}
                checkOut={dateRange!.to!}
                nights={paymentData.nights}
                pricePerNight={paymentData.pricePerNight}
                discountApplied={paymentData.discountApplied}
                discountPercent={paymentData.discountPercent}
                totalPrice={paymentData.amount}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pagamento sicuro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <StripePaymentForm
                      paymentData={paymentData}
                      bookingPayload={bookingPayload}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </CardContent>
              </Card>

              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)} className="w-full">
                <ChevronLeft className="mr-1 h-4 w-4" />Torna ai dati ospite
              </Button>
            </div>
          )}

          {/* ── STEP 4: Confirmation ──────────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center space-y-6 animate-fade-in py-12">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Prenotazione confermata!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Grazie {guest.guestName}! La tua prenotazione è stata ricevuta e confermata.
                  Riceverai una email di conferma a <strong>{guest.guestEmail}</strong>.
                </p>
              </div>
              <PriceSummary
                apartmentName={selectedApartment.name}
                checkIn={dateRange!.from!}
                checkOut={dateRange!.to!}
                nights={paymentData!.nights}
                pricePerNight={paymentData!.pricePerNight}
                discountApplied={paymentData!.discountApplied}
                discountPercent={paymentData!.discountPercent}
                totalPrice={paymentData!.amount}
              />
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/my-bookings')}>Le mie prenotazioni</Button>
                <Button variant="outline" onClick={() => navigate('/')}>Torna alla home</Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
