import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ApartmentCard, { ApartmentProps } from "@/components/ApartmentCard";
import { useLanguage } from "@/contexts/LanguageContext";

// Apartments data
const allApartments: ApartmentProps[] = [
  {
    id: "1",
    name: "Padronale",
    description: "Main apartment with panoramic sea views, generous spaces and luxury comforts.",
    price: 280,
    capacity: 6,
    size: 120,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=600&fit=crop",
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
    image: "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=800&h=600&fit=crop",
    location: "Mansarda",
    features: ["Wi-Fi", "Angolo cottura", "Bagno", "Aria condizionata", "TV", "Vista panoramica"]
  }
];

export default function Apartments() {
  const { t } = useLanguage();
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted/30 to-muted/60">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Header Section */}
        <section className="relative py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary font-medium mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                I Nostri Appartamenti
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t.apartments.title}
              </h1>
              <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto">
                {t.apartments.subtitle}
              </p>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl" />
            <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-gradient-to-r from-accent/10 to-primary/10 blur-3xl" />
          </div>
        </section>
        
        
        {/* Apartments Grid */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {allApartments.map((apartment, index) => (
                <div 
                  key={apartment.id} 
                  className="animate-fade-in hover-scale group" 
                  style={{ animationDelay: `${(index + 1) * 150}ms` }}
                >
                  <div className="bg-card/40 backdrop-blur-sm rounded-3xl p-1 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-primary/30">
                    <ApartmentCard apartment={apartment} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}