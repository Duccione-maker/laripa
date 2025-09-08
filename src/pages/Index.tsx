import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import BookingForm from "@/components/BookingForm";
import TestimonialsSection from "@/components/TestimonialsSection";
import ApartmentCard, { ApartmentProps } from "@/components/ApartmentCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Wifi, Utensils, Waves, LifeBuoy, MapPin, Coffee, Trees, Droplets, Home, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Sample apartments data
const featuredApartments: ApartmentProps[] = [
  {
    id: "1",
    name: "Padronale",
    description: "Main apartment with panoramic vineyard views, generous spaces and luxury comforts.",
    price: 280,
    capacity: 4,
    size: 146,
    image: "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png",
    images: [
      "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png",
      "/lovable-uploads/204d40d3-9d9a-411a-9f06-34ee9648960f.png",
      "/lovable-uploads/ac482e8b-5bc9-4801-a5cd-62c4e098627a.png"
    ],
    location: "Piano terra",
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a legna per pizza", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV", "Veranda"]
  },
  {
    id: "2", 
    name: "Ghiri",
    description: "Characteristic 4+2 apartment with breathtaking views of San Gimignano, Japanese bed and service bathroom on ground floor. Welcoming atmosphere and charming surroundings. The most loved on booking portals.",
    price: 220,
    capacity: 6,
    size: 117,
    image: "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png",
    images: [
      "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png",
      "/lovable-uploads/524138e8-c9d1-41e9-8867-3632efb248fc.png",
      "/lovable-uploads/a0bd4059-64fa-4bd7-a506-cd13d8fd18e5.png"
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
    size: 87,
    image: "/lovable-uploads/4f21e3a8-c435-420a-9c45-8c828be3c0b2.png",
    images: [
      "/lovable-uploads/4f21e3a8-c435-420a-9c45-8c828be3c0b2.png",
      "/lovable-uploads/b4b7072e-42c3-4d8f-80b8-3d2ab767fbd7.png",
      "/lovable-uploads/1186d9ca-0c44-4a10-8518-69b07a812b81.png"
    ],
    location: "Primo piano",
    features: ["Area pranzo", "Aria condizionata", "Asciugacapelli", "Asciugamani", "Barbecue", "Bollitore", "Camino", "Fasciatoio", "Ferro e asse da stiro", "Forno a microonde", "Forno elettrico", "Free parking", "Free WiFi", "Gazebo", "Kit di benvenuto", "Lavastoviglie", "Lavatrice", "Lenzuola", "Outdoor pool", "Pet friendly", "Riscaldamento", "Smart TV", "Vista sul giardino e piscina"]
  }
];

export default function Index() {
  const { t } = useLanguage();
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  
  // Feature items
  const features = [
    {
      icon: <Trees className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.vineyards.title,
      description: t.home.amenities.features.vineyards.description
    },
    {
      icon: <Droplets className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.pools.title,
      description: t.home.amenities.features.pools.description
    },
    {
      icon: <Wifi className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.wifi.title,
      description: t.home.amenities.features.wifi.description
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.location.title,
      description: t.home.amenities.features.location.description
    },
    {
      icon: <Coffee className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.oil.title,
      description: t.home.amenities.features.oil.description
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.family.title,
      description: t.home.amenities.features.family.description
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Welcome Section */}
        <section id="welcome" className="section">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in [animation-delay:100ms]">
                <span className="text-sm text-primary font-medium uppercase tracking-wider">
                  {t.home.welcome.subtitle}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6">
                  {t.home.welcome.title}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t.home.welcome.description1}
                </p>
                <p className="text-muted-foreground mb-8">
                  {t.home.welcome.description2}
                </p>
                <Button asChild className="btn-primary">
                  <Link to="/apartments">
                    {t.home.welcome.learnMore} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="relative animate-fade-in [animation-delay:300ms]">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                  <img 
                    src="/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png"
                    alt="Padronale kitchen" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-2/3 rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src="/lovable-uploads/524138e8-c9d1-41e9-8867-3632efb248fc.png"
                    alt="Ghiri kitchen interior" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-6 -right-6 w-1/2 rounded-2xl overflow-hidden shadow-xl">
                  <img 
                    src="/lovable-uploads/64f16b83-f8d5-49dc-b96e-6a208c142224.png"
                    alt="Nidi rustic living room" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        
        {/* Featured Apartments */}
        <section className="section">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
              <span className="text-sm text-primary font-medium uppercase tracking-wider">
                {t.home.featuredApartments.subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {t.home.featuredApartments.title}
              </h2>
              <p className="text-muted-foreground">
                {t.home.featuredApartments.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredApartments.map((apartment, index) => (
                <div key={apartment.id} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                  <ApartmentCard apartment={apartment} />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="btn-primary">
                <Link to="/apartments">
                  {t.home.featuredApartments.viewAll} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <TestimonialsSection />
        
        {/* Features Section */}
        <section className="section bg-card">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
              <span className="text-sm text-primary font-medium uppercase tracking-wider">
                {t.home.amenities.subtitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                {t.home.amenities.title}
              </h2>
              <p className="text-muted-foreground">
                {t.home.amenities.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="glass-card p-6 rounded-xl animate-fade-in flex flex-col items-center text-center"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="mb-4 p-3 rounded-full bg-olive/10 text-olive-dark">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="relative py-24 bg-primary/5">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t.home.cta.title}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t.home.cta.description}
              </p>
              <Button asChild size="lg" className="btn-primary">
                <Link to="/booking">{t.home.cta.bookNow}</Link>
              </Button>
            </div>
          </div>
          
          {/* Decorative hills */}
          <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
            <svg 
              className="absolute bottom-0 w-full h-32 fill-olive/30"
              preserveAspectRatio="none"
              viewBox="0 0 1440 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M0,60C120,40 240,30 360,45C480,60 600,90 720,85C840,80 960,40 1080,35C1200,30 1320,60 1380,75L1440,90L1440,120L0,120Z"
                className="animate-float opacity-60"
              />
            </svg>
            <svg 
              className="absolute bottom-0 w-full h-32 fill-olive/50"
              preserveAspectRatio="none"
              viewBox="0 0 1440 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M0,80C180,50 300,40 480,55C660,70 840,100 1020,95C1200,90 1350,65 1440,75L1440,120L0,120Z"
                className="animate-pulse-slow opacity-80"
              />
            </svg>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
