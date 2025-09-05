
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Key, Trash2, Home, Car, Bus, Navigation, Clock, HelpCircle, Phone, Cigarette, Users } from "lucide-react";

export default function Amenities() {
  const { t } = useLanguage();
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  
  // Helper function to get the appropriate icon for each section
  const getIcon = (categoryName: string, index: number) => {
    const icons = {
      arrival: [<Car key={0} />, <MapPin key={1} />, <Bus key={2} />, <Navigation key={3} />],
      checkin: [<Clock key={0} />, <Key key={1} />, <HelpCircle key={2} />, <Phone key={3} />],
      waste: [<Trash2 key={0} />, <Trash2 key={1} />, <Trash2 key={2} />, <Trash2 key={3} />],
      rules: [<Clock key={0} />, <Users key={1} />, <Cigarette key={2} />, <Home key={3} />]
    };
    
    return icons[categoryName as keyof typeof icons]?.[index] || <HelpCircle />;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted/30 to-muted/60">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1523906921802-b5d2d899e93b?w=1920&h=800&fit=crop&crop=center')`
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
          
          <div className="container relative z-10 pt-20">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-sm text-white/90 font-medium uppercase tracking-wider">
                MareSereno
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-6 text-white">
                {t.amenitiesPage.title}
              </h1>
              <p className="text-white/90 text-lg">
                {t.amenitiesPage.subtitle}
              </p>
            </div>
          </div>
        </section>
        
        {/* Description Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-lg text-muted-foreground">
                {t.amenitiesPage.description}
              </p>
            </div>
          </div>
        </section>
        
        {/* Categories Sections */}
        {Object.keys(t.amenitiesPage.categories).map((category, categoryIndex) => {
          const categoryData = t.amenitiesPage.categories[category as keyof typeof t.amenitiesPage.categories];
          const isEven = categoryIndex % 2 === 0;
          
          return (
            <section key={category} className={`py-16 ${isEven ? 'bg-card' : ''}`}>
              <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl font-bold mb-4">
                    {categoryData.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {categoryData.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {categoryData.items.map((item, index) => (
                    <div 
                      key={index} 
                      className="glass-card p-6 rounded-xl flex flex-col items-center text-center animate-fade-in"
                      style={{ animationDelay: `${(index + 1) * 100}ms` }}
                    >
                      <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
                        {getIcon(category, index)}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </main>
      
      <Footer />
    </div>
  );
}
