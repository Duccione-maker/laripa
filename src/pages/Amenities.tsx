
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
                La Ripa
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
          
          // Special handling for arrival section - show only map
          if (category === 'arrival') {
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
                  
                  {/* Embedded Google Map */}
                  <div className="max-w-4xl mx-auto">
                    <div className="rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2881.8654329876543!2d11.0690857!3d43.5022375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132a393046da9965%3A0x28d181af2928ef32!2sLa%20Ripa!5e0!3m2!1sen!2sit!4v1234567890123!5m2!1sen!2sit"
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen={true}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="La Ripa San Gimignano Location"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // Special handling for checkin section - show videos
          if (category === 'checkin') {
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
                  
                  {/* YouTube Videos Section */}
                  <div className="max-w-6xl mx-auto">
                    <h3 className="text-2xl font-semibold text-center mb-8">Video Tutorial di Accesso</h3>
                    
                    {/* Main Access Video */}
                    <div className="mb-12">
                      <div className="max-w-3xl mx-auto rounded-xl overflow-hidden shadow-lg">
                        <iframe
                          width="100%"
                          height="400"
                          src="https://www.youtube.com/embed/YOUR_MAIN_ACCESS_VIDEO_ID"
                          title="Accesso Principale - La Ripa"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        <div className="p-4 bg-muted text-center">
                          <h4 className="font-semibold mb-2">Accesso Principale alla Proprietà</h4>
                          <p className="text-sm text-muted-foreground">Come raggiungere La Ripa e accedere alla struttura</p>
                        </div>
                      </div>
                    </div>

                    {/* Apartment Specific Videos */}
                    <h4 className="text-xl font-semibold text-center mb-6">Accesso Specifico per Appartamento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Padronale */}
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <iframe
                          width="100%"
                          height="200"
                          src="https://www.youtube.com/embed/YOUR_PADRONALE_VIDEO_ID"
                          title="Accesso Padronale"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        <div className="p-3 bg-muted">
                          <h5 className="font-semibold mb-1">Padronale</h5>
                          <p className="text-xs text-muted-foreground">Accesso appartamento Padronale</p>
                        </div>
                      </div>
                      
                      {/* Ghiri */}
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <iframe
                          width="100%"
                          height="200"
                          src="https://www.youtube.com/embed/YOUR_GHIRI_VIDEO_ID"
                          title="Accesso Ghiri"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        <div className="p-3 bg-muted">
                          <h5 className="font-semibold mb-1">Ghiri</h5>
                          <p className="text-xs text-muted-foreground">Accesso appartamento Ghiri</p>
                        </div>
                      </div>
                      
                      {/* Nidi */}
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <iframe
                          width="100%"
                          height="200"
                          src="https://www.youtube.com/embed/YOUR_NIDI_VIDEO_ID"
                          title="Accesso Nidi"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        <div className="p-3 bg-muted">
                          <h5 className="font-semibold mb-1">Nidi</h5>
                          <p className="text-xs text-muted-foreground">Accesso appartamento Nidi</p>
                        </div>
                      </div>
                      
                      {/* Fienile */}
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <iframe
                          width="100%"
                          height="200"
                          src="https://www.youtube.com/embed/YOUR_FIENILE_VIDEO_ID"
                          title="Accesso Fienile"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        <div className="p-3 bg-muted">
                          <h5 className="font-semibold mb-1">Fienile</h5>
                          <p className="text-xs text-muted-foreground">Accesso appartamento Fienile</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 text-center">
                      <p className="text-muted-foreground">
                        Per qualsiasi domanda o assistenza, contattaci al{" "}
                        <a href="tel:+393476521141" className="text-primary hover:underline">
                          +39 3476521141
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            );
          }
          
          // Regular rendering for other sections
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
