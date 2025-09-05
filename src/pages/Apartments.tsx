import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ApartmentCard, { ApartmentProps } from "@/components/ApartmentCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  const [filteredApartments, setFilteredApartments] = useState<ApartmentProps[]>(allApartments);
  const [capacityFilter, setCapacityFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number[]>([160, 280]);
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  
  // Apply filters
  useEffect(() => {
    let result = allApartments;
    
    // Filter by capacity
    if (capacityFilter !== "all") {
      const capacity = parseInt(capacityFilter);
      result = result.filter(apt => apt.capacity >= capacity);
    }
    
    // Filter by location
    if (locationFilter !== "all") {
      result = result.filter(apt => apt.location === locationFilter);
    }
    
    // Filter by price range
    result = result.filter(apt => apt.price >= priceRange[0] && apt.price <= priceRange[1]);
    
    setFilteredApartments(result);
  }, [capacityFilter, locationFilter, priceRange]);
  
  // Get unique locations for filter
  const locations = ["all", ...new Set(allApartments.map(apt => apt.location))];
  
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
        
        {/* Filter Section */}
        <section className="py-12 bg-card/30 border-y border-border/50">
          <div className="container">
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-lg animate-fade-in">
              <h2 className="text-xl font-semibold mb-6 text-center">Filtra gli Appartamenti</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Capacity Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                    </span>
                    {t.apartments.filters.guests}
                  </label>
                  <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                    <SelectTrigger className="w-full bg-background/80 border-border/50 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder={t.apartments.filters.guests} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.apartments.filters.anyGuests}</SelectItem>
                      <SelectItem value="1">{t.apartments.filters.onePlus}</SelectItem>
                      <SelectItem value="2">{t.apartments.filters.twoPlus}</SelectItem>
                      <SelectItem value="3">{t.apartments.filters.threePlus}</SelectItem>
                      <SelectItem value="4">{t.apartments.filters.fourPlus}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Location Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    </span>
                    {t.apartments.filters.location}
                  </label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full bg-background/80 border-border/50 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder={t.apartments.filters.location} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.apartments.filters.allLocations}</SelectItem>
                      {locations.filter(loc => loc !== "all").map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Price Range Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-accent"></span>
                    </span>
                    {t.apartments.filters.priceRange}: €{priceRange[0]} - €{priceRange[1]}
                  </label>
                  <Slider
                    defaultValue={[160, 280]}
                    min={160}
                    max={280}
                    step={10}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="my-4"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-border/50 gap-4 animate-fade-in [animation-delay:200ms]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">{filteredApartments.length}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {t.apartments.filters.showing} {filteredApartments.length} {t.apartments.filters.of} {allApartments.length} {t.apartments.filters.accommodations}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="hover:bg-primary/5 transition-colors"
                  onClick={() => {
                    setCapacityFilter("all");
                    setLocationFilter("all");
                    setPriceRange([160, 280]);
                  }}
                >
                  {t.apartments.filters.resetFilters}
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Apartments Grid */}
        <section className="py-20">
          <div className="container">
            {filteredApartments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {filteredApartments.map((apartment, index) => (
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
            ) : (
              <div className="text-center py-20 animate-fade-in">
                <div className="max-w-md mx-auto bg-card/40 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏖️</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{t.apartments.filters.noMatch}</h3>
                  <p className="text-muted-foreground mb-6">{t.apartments.filters.adjustFilters}</p>
                  <Button 
                    variant="outline" 
                    className="hover:bg-primary/5 transition-colors"
                    onClick={() => {
                      setCapacityFilter("all");
                      setLocationFilter("all");
                      setPriceRange([160, 280]);
                    }}
                  >
                    {t.apartments.filters.resetFilters}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}