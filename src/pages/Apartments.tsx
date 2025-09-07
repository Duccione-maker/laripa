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
    location: "Primo piano",
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a legna per pizza", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV", "Veranda"]
  },
  {
    id: "2", 
    name: "Ghiri",
    description: "Characteristic apartment with welcoming atmosphere and charming views of the surroundings. The most loved on booking portals.",
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
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV"]
  },
  {
    id: "3",
    name: "Fienile", 
    description: "Apartment with modern rustic charm, perfect for those seeking authenticity and comfort.",
    price: 190,
    capacity: 4,
    size: 70,
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
    image: "/lovable-uploads/64f16b83-f8d5-49dc-b96e-6a208c142224.png", // Soggiorno rustico con camino (principale)
    images: [
      "/lovable-uploads/64f16b83-f8d5-49dc-b96e-6a208c142224.png", // Soggiorno rustico con camino (principale)
      "/lovable-uploads/f7046709-9eac-4cf9-b68b-c0fdfac4de60.png", // Soggiorno con scala e libreria
      "/lovable-uploads/c99136a0-db75-45c6-a328-e285d21506cc.png", // Camera con due letti singoli
      "/lovable-uploads/4501c737-dbc3-4e68-b653-3173cb93a8fe.png", // Bagno con piastrelle blu
      "/lovable-uploads/46ded70c-6837-488e-a636-4ee5de394f3a.png", // Lavabo del bagno
      "/lovable-uploads/a578cc1c-564c-4d1b-a5b0-aae344f7c162.png"  // Tavolo per colazione in giardino
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