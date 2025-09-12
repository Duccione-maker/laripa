
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="footer" className="bg-card text-card-foreground pt-16 pb-8 border-t">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="animate-fade-in [animation-delay:100ms]">
            <h4 className="text-xl font-bold mb-4">La Ripa</h4>
            <p className="text-muted-foreground mb-4">
              {t.footer.description}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>
          
          <div className="animate-fade-in [animation-delay:200ms]">
            <h4 className="text-xl font-bold mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2">
              {[
                { name: t.nav.home, path: "/" },
                { name: t.nav.apartments, path: "/apartments" },
                { name: t.nav.amenities, path: "/amenities" },
                { name: t.nav.gallery, path: "/gallery" },
                { name: t.nav.contact, path: "/contact" },
                { name: t.nav.bookNow, path: "/booking" },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="animate-fade-in [animation-delay:300ms]">
            <h4 className="text-xl font-bold mb-4">{t.footer.contact}</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Via+Santa+Maria+70%2C+53037+San+Gimignano+SI%2C+Italy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer underline decoration-1 underline-offset-2"
                  >
                    Via Santa Maria 70<br />
                    53037 San Gimignano (SI)<br />
                    Toscana, Italia
                  </a>
                </div>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-2 text-primary" />
                <a 
                  href="tel:+393476521141" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  +39 3476521141
                </a>
              </li>
              <li className="flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-primary" />
                <a 
                  href="https://wa.me/393476521141" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary" />
                <a 
                  href="mailto:info@laripadisangimignano.com" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  info@laripadisangimignano.com
                </a>
              </li>
            </ul>
          </div>
          
        </div>
        
        <div className="border-t border-border pt-8 mt-8">
          <div className="text-center text-muted-foreground mb-4">
            <p>&copy; {currentYear} La Ripa. {t.footer.allRights}</p>
          </div>
          
          {/* CIN Codes Section */}
          <div className="text-xs text-muted-foreground/60 text-center space-y-1">
            <p className="font-medium mb-2">Codici Identificativi Nazionali (C.I.N.)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
              <div>
                <span className="font-medium">Fienile:</span> <span>IT052028C26UHINPXN</span>
              </div>
              <div>
                <span className="font-medium">Ghiri:</span> <span>IT052028C29AHM6MQX</span>
              </div>
              <div>
                <span className="font-medium">Nidi:</span> <span>IT052028C2AYAJTFOQ</span>
              </div>
              <div>
                <span className="font-medium">Padronale:</span> <span>IT052028C25S9SGLM5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
