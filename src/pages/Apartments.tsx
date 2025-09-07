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
    image: "/lovable-uploads/99f7a726-ed92-4c63-b687-ba579de8c20b.png",
    images: [
      "/lovable-uploads/ghiri-1.jpg",
      "/lovable-uploads/ghiri-2.jpg",
      "/lovable-uploads/ghiri-3.jpg",
      "/lovable-uploads/ghiri-4.jpg",
      "/lovable-uploads/ghiri-5.jpg",
      "/lovable-uploads/ghiri-6.jpg"
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
    image: "/lovable-uploads/99f7a726-ed92-4c63-b687-ba579de8c20b.png",
    images: [
      "/lovable-uploads/fienile-1.jpg",
      "/lovable-uploads/fienile-2.jpg",
      "/lovable-uploads/fienile-3.jpg",
      "/lovable-uploads/fienile-4.jpg",
      "/lovable-uploads/fienile-5.jpg",
      "/lovable-uploads/fienile-6.jpg"
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