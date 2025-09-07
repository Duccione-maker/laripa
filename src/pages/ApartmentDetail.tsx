import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Users, Maximize, MapPin, Bath, Coffee, Wifi, Calendar, Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";
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
    name: "Padronale",
    description: "Main apartment with panoramic sea views, generous spaces and luxury comforts.",
    price: 280,
    capacity: 6,
    size: 120,
    image: "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png",
    images: [
      "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png", // Cucina (principale)
      "/lovable-uploads/204d40d3-9d9a-411a-9f06-34ee9648960f.png", // Bagno
      "/lovable-uploads/ac482e8b-5bc9-4801-a5cd-62c4e098627a.png", // Veranda
      "/lovable-uploads/1a9ddcc6-3847-415a-b7e4-62542a629852.png", // Stanza singola
      "/lovable-uploads/7ce30357-9f21-45f5-9a88-ae9cfef3a153.png", // Stanza matrimoniale
      "/lovable-uploads/698d71b3-1f38-4d4e-a8f2-6f31e882cd08.png"  // Soggiorno
    ],
    location: "Primo piano",
    features: ["Wi-Fi", "Cucina completa", "2 Bagni", "Aria condizionata", "TV", "Terrazza vista mare", "Jacuzzi", "Soggiorno"]
  },
  {
    id: "2", 
    name: "Ghiri",
    description: "Characteristic apartment with welcoming atmosphere and charming views of the surroundings.",
    price: 220,
    capacity: 4,
    size: 85,
    image: "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png", // Giardino (principale)
    images: [
      "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png", // Giardino (principale)
      "/lovable-uploads/524138e8-c9d1-41e9-8867-3632efb248fc.png", // Cucina
      "/lovable-uploads/a0bd4059-64fa-4bd7-a506-cd13d8fd18e5.png", // Camera matrimoniale
      "/lovable-uploads/d9b7a116-e425-4b55-85d0-4bdffcf35f92.png", // Camera singola
      "/lovable-uploads/163f6f54-8b1e-483a-82a8-c3077685d7c2.png", // Bagno
      "/lovable-uploads/151c50a6-cce6-4b3c-b93e-cf9e0a2b078b.png"  // Esterno
    ],
    location: "Piano terra",
    features: ["Wi-Fi", "Cucina", "Bagno", "Aria condizionata", "TV", "Giardino privato", "Patio"]
  },
  {
    id: "3",
    name: "Fienile", 
    description: "Apartment with modern rustic charm, perfect for those seeking authenticity and comfort.",
    price: 190,
    capacity: 4,
    size: 70,
    image: "/lovable-uploads/1186d9ca-0c44-4a10-8518-69b07a812b81.png", // Giardino con gazebo (principale)
    images: [
      "/lovable-uploads/1186d9ca-0c44-4a10-8518-69b07a812b81.png", // Giardino con gazebo (principale)
      "/lovable-uploads/0a4860b0-b18d-4f60-b004-c0a8cfeec2c5.png", // Cucina
      "/lovable-uploads/3f1ae5ae-fa9f-4be5-b0b9-a48c88c8e1ee.png", // Camera matrimoniale con baldacchino
      "/lovable-uploads/ebf36a44-3fca-4c29-99ec-56ff07963d02.png", // Camera con due letti singoli
      "/lovable-uploads/25f155d7-09a3-46bd-ae61-f458cd3727c8.png", // Bagno con doccia
      "/lovable-uploads/6a850667-528d-4af4-ae56-7af124b28b97.png"  // Bagno con vasca
    ],
    location: "Dependance",
    features: ["Wi-Fi", "Cucina", "Bagno", "Aria condizionata", "TV", "Camino", "Terrazza"]
  },
  {
    id: "4",
    name: "Nidi",
    description: "Intimate and cozy apartment, ideal for couples seeking romance and tranquility.",
    price: 160,
    capacity: 2,
    size: 45,
    image: "/lovable-uploads/99f7a726-ed92-4c63-b687-ba579de8c20b.png",
    images: [
      "/lovable-uploads/nidi-1.jpg",
      "/lovable-uploads/nidi-2.jpg",
      "/lovable-uploads/nidi-3.jpg",
      "/lovable-uploads/nidi-4.jpg",
      "/lovable-uploads/nidi-5.jpg",
      "/lovable-uploads/nidi-6.jpg"
    ],
    location: "Mansarda",
    features: ["Wi-Fi", "Angolo cottura", "Bagno", "Aria condizionata", "TV", "Vista panoramica"]
  }
];

export default function ApartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [apartment, setApartment] = useState<ApartmentProps | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  // Get all images for gallery (main image + additional images)
  const allImages = apartment ? [apartment.image, ...(apartment.images || [])] : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
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
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative overflow-hidden rounded-xl h-96 group">
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={`${translatedName} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Navigation arrows - only show if multiple images */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    
                    {/* Image counter */}
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        currentImageIndex === index 
                          ? 'border-primary shadow-lg' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`${translatedName} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
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