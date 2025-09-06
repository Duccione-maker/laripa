
import { useEffect, useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CalendarIcon, Users, CreditCard, Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApartmentProps } from "@/components/ApartmentCard";

// Sample apartments data
const apartmentsData: ApartmentProps[] = [
  {
    id: "1",
    name: "Padronale",
    description: "Appartamento principale con vista panoramica, spazi generosi e comfort di lusso.",
    price: 220,
    capacity: 6,
    size: 120,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
    location: "Vista panoramica",
    features: ["Wi-Fi", "Cucina completa", "2 Bagni", "Aria condizionata", "TV", "Terrazza", "Parcheggio"]
  },
  {
    id: "2",
    name: "Ghiri",
    description: "Appartamento caratteristico con atmosfera accogliente e vista suggestiva sui dintorni.",
    price: 180,
    capacity: 4,
    size: 85,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    location: "Vista sui dintorni",
    features: ["Wi-Fi", "Cucina", "Bagno", "Aria condizionata", "TV", "Balcone"]
  },
  {
    id: "3",
    name: "Fienile",
    description: "Appartamento dal fascino rustico moderno, perfetto per chi cerca autenticità e comfort.",
    price: 160,
    capacity: 3,
    size: 65,
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=600&fit=crop",
    location: "Stile rustico",
    features: ["Wi-Fi", "Angolo cottura", "Bagno", "Aria condizionata", "TV", "Giardino"]
  },
  {
    id: "4",
    name: "Nidi",
    description: "Appartamento intimo e raccolto, ideale per coppie in cerca di romanticismo e tranquillità.",
    price: 140,
    capacity: 2,
    size: 45,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop",
    location: "Romantico",
    features: ["Wi-Fi", "Angolo cottura", "Bagno", "Aria condizionata", "TV", "Vista giardino"]
  }
];

export default function BookingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [selectedApartment, setSelectedApartment] = useState<ApartmentProps | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    paymentMethod: "credit-card",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    specialRequests: ""
  });
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Load Smoobu booking widget script
    const loadSmoobuScript = () => {
      // Remove existing script if present
      const existingScript = document.querySelector('script[src="https://login.smoobu.com/js/Settings/BookingToolIframe.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://login.smoobu.com/js/Settings/BookingToolIframe.js';
      script.onload = () => {
        // Initialize Smoobu widget after script loads
        if ((window as any).BookingToolIframe) {
          (window as any).BookingToolIframe.initialize({
            "url": "https://login.smoobu.com/it/booking-tool/iframe/57025", 
            "baseUrl": "https://login.smoobu.com", 
            "target": "#apartmentIframeAll"
          });
        }
      };
      document.head.appendChild(script);
    };
    
    // Load script after a short delay to ensure DOM is ready
    const timer = setTimeout(loadSmoobuScript, 100);
    
    return () => {
      clearTimeout(timer);
      // Cleanup script on unmount
      const script = document.querySelector('script[src="https://login.smoobu.com/js/Settings/BookingToolIframe.js"]');
      if (script) {
        script.remove();
      }
    };
  }, []);
  
  // Calculate nights and total price
  const nightsCount = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  const totalPrice = selectedApartment ? selectedApartment.price * nightsCount : 0;
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Submit booking
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Accesso richiesto",
        description: "Devi essere loggato per prenotare. Ti reindirizziamo alla pagina di login.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!startDate || !endDate || !selectedApartment) {
      toast({
        title: "Errore",
        description: "Seleziona tutte le informazioni richieste per la prenotazione.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          apartment_id: selectedApartment.id,
          check_in: format(startDate, 'yyyy-MM-dd'),
          check_out: format(endDate, 'yyyy-MM-dd'),
          adults: parseInt(adults),
          children: parseInt(children),
          guest_name: `${formData.firstName} ${formData.lastName}`,
          guest_email: formData.email || user.email,
          guest_phone: formData.phone,
          total_price: totalPrice,
          currency: 'EUR',
          status: 'pending',
          notes: formData.specialRequests || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Prenotazione creata!",
        description: "La tua prenotazione è stata inviata con successo. Riceverai una conferma via email.",
      });

      // Show confirmation
      setIsBookingConfirmed(true);
      
      // Reset form after booking is confirmed
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedApartment(null);
        setStartDate(new Date());
        setEndDate(addDays(new Date(), 7));
        setAdults("2");
        setChildren("0");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          zipCode: "",
          country: "",
          paymentMethod: "credit-card",
          cardName: "",
          cardNumber: "",
          cardExpiry: "",
          cardCvc: "",
          specialRequests: ""
        });
        setIsBookingConfirmed(false);
        navigate('/my-bookings');
      }, 3000);

    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la creazione della prenotazione. Riprova.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Header Section */}
        <section className="relative py-16 bg-gradient-to-r from-sea-light to-white dark:from-sea-dark dark:to-background overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Prenota il tuo soggiorno
              </h1>
              <p className="text-muted-foreground text-lg">
                Completa la tua prenotazione in pochi semplici passi attraverso il nostro sistema di prenotazione sicuro.
              </p>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary/50 blur-3xl" />
            <div className="absolute bottom-10 right-40 w-48 h-48 rounded-full bg-sea-light blur-3xl" />
          </div>
        </section>
        
        {/* Booking Widget Section */}
        <section className="container py-12">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card p-8 animate-fade-in [animation-delay:200ms]">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Sistema di Prenotazione</h2>
                <p className="text-muted-foreground">
                  Scegli le date, seleziona l'appartamento e completa la tua prenotazione in modo sicuro.
                </p>
              </div>
              
              {/* Smoobu Booking Widget */}
              <div className="w-full">
                <div 
                  id="apartmentIframeAll" 
                  className="min-h-[600px] w-full rounded-lg overflow-hidden"
                  style={{ minHeight: '600px' }}
                />
              </div>
            </div>
            
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-fade-in [animation-delay:400ms]">
              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Prenotazione Sicura</h3>
                <p className="text-sm text-muted-foreground">
                  Tutti i pagamenti sono protetti e sicuri attraverso il nostro sistema di prenotazione certificato.
                </p>
              </div>
              
              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Disponibilità in Tempo Reale</h3>
                <p className="text-sm text-muted-foreground">
                  Il calendario è aggiornato in tempo reale per garantire la disponibilità accurata.
                </p>
              </div>
              
              <div className="glass-card p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Supporto Clienti</h3>
                <p className="text-sm text-muted-foreground">
                  Il nostro team è sempre disponibile per assisterti durante il processo di prenotazione.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
