import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Users, Maximize, MapPin, Bath, Coffee, Wifi, Calendar, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomCalendar from "@/components/CustomCalendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmoobuPricing } from "@/hooks/useSmoobuPricing";
import { ApartmentProps } from "@/components/ApartmentCard";

// Import apartment data
const allApartments: ApartmentProps[] = [
  {
    id: "1",
    name: "Deluxe Apartment with Sea View",
    description: "Luxurious apartment with stunning sea views. Perfect for couples seeking a romantic getaway.",
    price: 280,
    capacity: 2,
    size: 45,
    image: "/public/lovable-uploads/99f7a726-ed92-4c63-b687-ba579de8c20b.png",
    location: "Seafront, Monterosso",
    features: ["Sea View", "Balcony", "Kitchen", "Bathroom", "Wi-Fi", "Air Conditioning"]
  },
  {
    id: "2", 
    name: "Classic Two-Bedroom Apartment",
    description: "Spacious apartment in the heart of the old town. Ideal for families or groups of friends.",
    price: 220,
    capacity: 4,
    size: 65,
    image: "/public/lovable-uploads/99f7a726-ed92-4c63-b687-ba579de8c20b.png",
    location: "Old Town Center",
    features: ["Two Bedrooms", "Living Room", "Kitchen", "Bathroom", "Wi-Fi", "Washing Machine"]
  },
  {
    id: "3",
    name: "Cozy Studio near Train Station", 
    description: "Perfect for budget travelers. Close to the train station with easy access to other Cinque Terre villages.",
    price: 190,
    capacity: 2,
    size: 35,
    image: "/public/lovable-uploads/99f7a726-ed92-4c63-b687-ba579de8c20b.png",
    location: "Near Train Station",
    features: ["Studio", "Kitchenette", "Bathroom", "Wi-Fi", "Close to Transport"]
  },
  {
    id: "4",
    name: "Family Apartment with Garden",
    description: "Large apartment with private garden. Perfect for families with children.",
    price: 160,
    capacity: 6,
    size: 80,
    image: "/public/lovable-uploads/99f7a726-ed92-4c63-b687-ba579de8c20b.png",
    location: "Residential Area",
    features: ["Three Bedrooms", "Private Garden", "Kitchen", "Two Bathrooms", "Wi-Fi", "Parking"]
  }
];

export default function ApartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [apartment, setApartment] = useState<ApartmentProps | null>(null);
  const { pricing, loading } = useSmoobuPricing(id || "");

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (id) {
      const foundApartment = allApartments.find(apt => apt.id === id);
      setApartment(foundApartment || null);
    }
  }, [id]);

  if (!apartment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Appartamento non trovato</h1>
          <Button onClick={() => navigate("/apartments")} className="btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna agli Appartamenti
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Use translated content if available
  const translatedName = language !== 'en' && t.apartmentDescriptions[apartment.id]?.name 
    ? t.apartmentDescriptions[apartment.id].name 
    : apartment.name;
    
  const translatedDescription = language !== 'en' && t.apartmentDescriptions[apartment.id]?.description 
    ? t.apartmentDescriptions[apartment.id].description 
    : apartment.description;

  const displayPrice = pricing?.price || apartment.price;
  const currency = pricing?.currency === 'EUR' ? '€' : '$';

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes("bathroom")) return <Bath className="h-4 w-4" />;
    if (feature.toLowerCase().includes("kitchen")) return <Coffee className="h-4 w-4" />;
    if (feature.toLowerCase().includes("wi-fi")) return <Wifi className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/apartments")}
          className="mb-6 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna agli Appartamenti
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative overflow-hidden rounded-xl h-96">
              <img 
                src={apartment.image} 
                alt={translatedName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Apartment Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{translatedName}</h1>
                    <div className="flex items-center text-muted-foreground mb-4">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="text-lg">{apartment.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-primary">
                          {currency}{displayPrice}
                        </div>
                        <div className="text-muted-foreground">per notte</div>
                        {pricing?.source === 'smoobu' && (
                          <Badge variant="secondary" className="mt-1">Prezzo in tempo reale</Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center space-x-6 mb-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">{apartment.capacity} ospiti</span>
                  </div>
                  <div className="flex items-center">
                    <Maximize className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">{apartment.size} m²</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Descrizione</h2>
                  <p className="text-muted-foreground leading-relaxed">{translatedDescription}</p>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Servizi e Comfort</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {apartment.features.map((feature, index) => (
                      <div 
                        key={index}
                        className="flex items-center p-3 bg-muted rounded-lg"
                      >
                        {getFeatureIcon(feature)}
                        <span className="ml-3 text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Prenota ora</h3>
                
                <Button 
                  className="w-full mb-4 btn-primary"
                  onClick={() => navigate(`/booking?apartment=${apartment.id}`)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Prenota Appartamento
                </Button>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>+39 123 456 7890</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>info@cinqueterreapartments.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Disponibilità</h3>
                <CustomCalendar 
                  apartmentId={apartment.id} 
                  apartmentName={translatedName} 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}