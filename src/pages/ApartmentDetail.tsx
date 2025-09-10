import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  ArrowLeft, Users, Maximize, MapPin, Bath, Coffee, Wifi, Calendar, Phone, Mail, ChevronLeft, ChevronRight,
  UtensilsCrossed, Wind, Shirt, Flame, Baby, Pizza, Microwave, Zap, Car, Gift,
  Waves, WashingMachine, Bed, Tv, Home, Thermometer, PawPrint, Sofa, Settings, Eye, Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomCalendar from "@/components/CustomCalendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmoobuPricing } from "@/hooks/useSmoobuPricing";
import { ApartmentProps } from "@/components/ApartmentCard";
import { GooglePhotosGallery } from "@/components/GooglePhotosGallery";

// Import apartment data
const allApartments: ApartmentProps[] = [
  {
    id: "1",
    name: "Padronale",
    description: "Main apartment with panoramic vineyard views, generous spaces and luxury comforts.",
    price: 280,
    capacity: 4,
    size: 146,
    image: "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png",
    images: [
      "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png", // Cucina (principale)
      "/lovable-uploads/204d40d3-9d9a-411a-9f06-34ee9648960f.png", // Bagno
      "/lovable-uploads/ac482e8b-5bc9-4801-a5cd-62c4e098627a.png", // Veranda
      "/lovable-uploads/1a9ddcc6-3847-415a-b7e4-62542a629852.png", // Stanza singola
      "/lovable-uploads/7ce30357-9f21-45f5-9a88-ae9cfef3a153.png", // Stanza matrimoniale
      "/lovable-uploads/698d71b3-1f38-4d4e-a8f2-6f31e882cd08.png"  // Soggiorno
    ],
    location: "Piano terra",
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a legna per pizza", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV", "Veranda"],
    googlePhotosAlbumId: "AF1QipMzrwzfYMdMvYT8C6v7uPJ5KCuwwUtPVSo-uD-C"
  },
  {
    id: "2", 
    name: "Ghiri",
    description: "Characteristic 4+2 apartment with breathtaking views of San Gimignano, Japanese bed and service bathroom on ground floor. Welcoming atmosphere and charming surroundings. The most loved on booking portals.",
    price: 220,
    capacity: 6,
    size: 117,
    image: "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png", // Giardino (principale)
    images: [
      "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png", // Giardino (principale)
      "/lovable-uploads/524138e8-c9d1-41e9-8867-3632efb248fc.png", // Cucina
      "/lovable-uploads/a0bd4059-64fa-4bd7-a506-cd13d8fd18e5.png", // Camera matrimoniale
      "/lovable-uploads/d9b7a116-e425-4b55-85d0-4bdffcf35f92.png", // Camera singola
      "/lovable-uploads/163f6f54-8b1e-483a-82a8-c3077685d7c2.png", // Bagno
      "/lovable-uploads/151c50a6-cce6-4b3c-b93e-cf9e0a2b078b.png"  // Esterno
    ],
    location: "Piano terra + primo piano",
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV"],
    googlePhotosAlbumId: "your-album-id-for-ghiri"
  },
  {
    id: "3",
    name: "Fienile", 
    description: "Apartment with modern rustic charm, perfect for those seeking authenticity and comfort.",
    price: 190,
    capacity: 4,
    size: 87,
    image: "/lovable-uploads/4f21e3a8-c435-420a-9c45-8c828be3c0b2.png", // Soggiorno con camino (principale)
    images: [
      "/lovable-uploads/4f21e3a8-c435-420a-9c45-8c828be3c0b2.png", // Soggiorno con camino (principale)
      "/lovable-uploads/b4b7072e-42c3-4d8f-80b8-3d2ab767fbd7.png", // Vista panoramica giardino
      "/lovable-uploads/1186d9ca-0c44-4a10-8518-69b07a812b81.png", // Giardino con gazebo
      "/lovable-uploads/0a4860b0-b18d-4f60-b004-c0a8cfeec2c5.png", // Cucina
      "/lovable-uploads/3f1ae5ae-fa9f-4be5-b0b9-a48c88c8e1ee.png", // Camera matrimoniale con baldacchino
      "/lovable-uploads/ebf36a44-3fca-4c29-99ec-56ff07963d02.png", // Camera con due letti singoli
      "/lovable-uploads/25f155d7-09a3-46bd-ae61-f458cd3727c8.png", // Bagno con doccia
      "/lovable-uploads/6a850667-528d-4af4-ae56-7af124b28b97.png"  // Bagno con vasca
    ],
    location: "Primo piano",
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Gazebo", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV", "Vista sul giardino e piscina"],
    googlePhotosAlbumId: "your-album-id-for-fienile"
  },
  {
    id: "4",
    name: "Nidi",
    description: "Intimate and cozy apartment, ideal for couples seeking romance and tranquility.",
    price: 160,
    capacity: 4,
    size: 85,
    image: "/lovable-uploads/64f16b83-f8d5-49dc-b96e-6a208c142224.png", // Soggiorno rustico con camino (principale)
    images: [
      "/lovable-uploads/64f16b83-f8d5-49dc-b96e-6a208c142224.png", // Soggiorno rustico con camino (principale)
      "/lovable-uploads/f7046709-9eac-4cf9-b68b-c0fdfac4de60.png", // Soggiorno con scala e libreria
      "/lovable-uploads/c99136a0-db75-45c6-a328-e285d21506cc.png", // Camera con due letti singoli
      "/lovable-uploads/4501c737-dbc3-4e68-b653-3173cb93a8fe.png", // Bagno con piastrelle blu
      "/lovable-uploads/46ded70c-6837-488e-a636-4ee5de394f3a.png", // Lavabo del bagno
      "/lovable-uploads/a578cc1c-564c-4d1b-a5b0-aae344f7c162.png"  // Tavolo per colazione in giardino
    ],
    location: "Piano terra + primo piano",
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV", "Gazebo esterno", "2 bagni"],
    googlePhotosAlbumId: "your-album-id-for-nidi"
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

  // Translate location and features with safe access
  const translatedLocation = (t.apartmentLocations && t.apartmentLocations[apartment.location]) || apartment.location;
  const translatedFeatures = apartment.features.map(feature => 
    (t.apartmentFeatures && t.apartmentFeatures[feature]) || feature
  );

  const displayPrice = pricing?.price || apartment.price;
  const currency = pricing?.currency === 'EUR' ? '€' : '$';

  const getFeatureIcon = (feature: string) => {
    // Direct mapping for all features (both Italian and English)
    const iconMap: Record<string, JSX.Element> = {
      // Italian features
      "Area pranzo": <UtensilsCrossed className="h-4 w-4" />,
      "Aria condizionata": <Wind className="h-4 w-4" />,
      "Asciugacapelli": <Wind className="h-4 w-4" />,
      "Asciugamani": <Shirt className="h-4 w-4" />,
      "Barbecue": <Flame className="h-4 w-4" />,
      "Bollitore": <Coffee className="h-4 w-4" />,
      "Camino": <Flame className="h-4 w-4" />,
      "Fasciatoio": <Baby className="h-4 w-4" />,
      "Ferro e asse da stiro": <Zap className="h-4 w-4" />,
      "Forno a legna per pizza": <Pizza className="h-4 w-4" />,
      "Forno a microonde": <Microwave className="h-4 w-4" />,
      "Forno elettrico": <Zap className="h-4 w-4" />,
      "Free parking": <Car className="h-4 w-4" />,
      "Free WiFi": <Wifi className="h-4 w-4" />,
      "Kit di benvenuto": <Gift className="h-4 w-4" />,
      "Lavastoviglie": <Waves className="h-4 w-4" />,
      "Lavatrice": <WashingMachine className="h-4 w-4" />,
      "Lenzuola": <Bed className="h-4 w-4" />,
      "Outdoor pool": <Droplets className="h-4 w-4" />,
      "Pet friendly": <PawPrint className="h-4 w-4" />,
      "Riscaldamento": <Thermometer className="h-4 w-4" />,
      "Smart TV": <Tv className="h-4 w-4" />,
      "Veranda": <Home className="h-4 w-4" />,
      "Wi-Fi": <Wifi className="h-4 w-4" />,
      "Cucina": <UtensilsCrossed className="h-4 w-4" />,
      "Bagno": <Bath className="h-4 w-4" />,
      "TV": <Tv className="h-4 w-4" />,
      "Terrazza": <Home className="h-4 w-4" />,
      "Angolo cottura": <UtensilsCrossed className="h-4 w-4" />,
      "Vista panoramica": <Eye className="h-4 w-4" />,
      
      // English features
      "Dining area": <UtensilsCrossed className="h-4 w-4" />,
      "Air conditioning": <Wind className="h-4 w-4" />,
      "Hair dryer": <Wind className="h-4 w-4" />,
      "Towels": <Shirt className="h-4 w-4" />,
      "Kettle": <Coffee className="h-4 w-4" />,
      "Fireplace": <Flame className="h-4 w-4" />,
      "Changing table": <Baby className="h-4 w-4" />,
      "Iron and ironing board": <Zap className="h-4 w-4" />,
      "Wood-fired pizza oven": <Pizza className="h-4 w-4" />,
      "Microwave": <Microwave className="h-4 w-4" />,
      "Electric oven": <Zap className="h-4 w-4" />,
      "Welcome kit": <Gift className="h-4 w-4" />,
      "Dishwasher": <Waves className="h-4 w-4" />,
      "Washing machine": <WashingMachine className="h-4 w-4" />,
      "Bed linen": <Bed className="h-4 w-4" />,
      "Heating": <Thermometer className="h-4 w-4" />,
      "Kitchen": <UtensilsCrossed className="h-4 w-4" />,
      "Bathroom": <Bath className="h-4 w-4" />,
      "Terrace": <Home className="h-4 w-4" />,
      "Kitchenette": <UtensilsCrossed className="h-4 w-4" />,
      "Panoramic view": <Eye className="h-4 w-4" />,
      "Gazebo": <Home className="h-4 w-4" />,
      "Gazebo esterno": <Home className="h-4 w-4" />,
      "Outdoor gazebo": <Home className="h-4 w-4" />,
      "2 bagni": <Bath className="h-4 w-4" />,
      "2 bathrooms": <Bath className="h-4 w-4" />,
      "Vista sul giardino e piscina": <Eye className="h-4 w-4" />,
      "Garden and pool view": <Eye className="h-4 w-4" />
    };
    
    return iconMap[feature] || <Home className="h-4 w-4" />;
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
                      <span className="text-lg">{translatedLocation}</span>
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
                    {translatedFeatures.map((feature, index) => (
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

                {/* Google Photos Gallery */}
                {apartment.googlePhotosAlbumId && (
                  <GooglePhotosGallery 
                    albumId={apartment.googlePhotosAlbumId}
                    apartmentName={translatedName}
                    className="mt-6"
                  />
                )}
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
                    <a 
                      href="tel:+393476521141" 
                      className="hover:text-primary transition-colors"
                    >
                      +39 3476521141
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <a 
                      href="mailto:info@laripadisangimignano.com" 
                      className="hover:text-primary transition-colors"
                    >
                      info@laripadisangimignano.com
                    </a>
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