
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Calendar, Settings, FileText as FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Only use white text on home page when not scrolled
  const isHomePage = location.pathname === "/";
  
  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      // Already on home page, just scroll to footer
      const footer = document.getElementById("footer");
      if (footer) {
        footer.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Navigate to home page first, then scroll
      window.location.href = "/#footer";
    }
  };

  const navLinks = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.apartments, path: "/apartments" },
    { name: t.nav.amenities, path: "/amenities" },
    { name: "Calendario", path: "/calendar" },
    { name: t.nav.gallery, path: "/gallery" },
    { name: "Blog", path: "/blog" },
    { name: t.nav.contact, path: "/contact", isContact: true }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);
  
  return <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", scrolled ? "bg-white/80 dark:bg-card/80 backdrop-blur-lg py-3 shadow-md" : "bg-transparent py-5")}>
      <nav className="container flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <LanguageSelector className={cn(isHomePage && !scrolled ? "text-white" : "text-foreground")} />
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-8">
          {navLinks.map(link => <li key={link.name} className="relative">
              {link.isContact ? (
                <button 
                  onClick={handleContactClick}
                  className={cn("font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full", isHomePage && !scrolled ? "text-white hover:text-white/80" : "text-foreground hover:text-primary")}
                >
                  {link.name}
                </button>
              ) : (
                <Link to={link.path} className={cn("font-medium transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full", isHomePage && !scrolled ? "text-white hover:text-white/80" : "text-foreground hover:text-primary")}>
                  {link.name}
                </Link>
              )}
            </li>)}
        </ul>

        <div className="hidden md:flex items-center space-x-2">
          <ThemeToggle className={cn(isHomePage && !scrolled ? "text-white hover:bg-white/10" : "")} />
          {user ? (
            <>
              <Button asChild className="btn-primary">
                <Link to="/booking">{t.nav.bookNow}</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("rounded-full", isHomePage && !scrolled ? "text-white hover:text-white/80 hover:bg-white/10" : "")}>
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-sm">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Le mie prenotazioni
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/blog/admin" className="w-full">
                        <FileTextIcon className="h-4 w-4 mr-2" />
                        Gestione Blog
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/admin/dashboard" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Dashboard Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnetti
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className={cn(isHomePage && !scrolled ? "text-white hover:text-white/80 hover:bg-white/10" : "")}>
                <Link to="/auth">Accedi</Link>
              </Button>
              <Button asChild className="btn-primary">
                <Link to="/booking">{t.nav.bookNow}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle className={cn(isHomePage && !scrolled ? "text-white hover:bg-white/10" : "")} />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={cn("rounded-full", isHomePage && !scrolled ? "text-white hover:text-white/80 hover:bg-white/10" : "text-foreground hover:text-muted-foreground")}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={cn("fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-300", mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <div className={cn("fixed inset-y-0 right-0 w-3/4 max-w-sm bg-card shadow-xl p-6 transition-transform duration-300 ease-in-out", mobileMenuOpen ? "translate-x-0" : "translate-x-full")}>
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between mb-8">
                <LanguageSelector />
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="rounded-full">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <ul className="space-y-6">
                {navLinks.map(link => <li key={link.name}>
                    {link.isContact ? (
                      <button 
                        onClick={(e) => {
                          handleContactClick(e);
                          setMobileMenuOpen(false);
                        }}
                        className="text-lg font-medium transition-colors hover:text-primary"
                      >
                        {link.name}
                      </button>
                    ) : (
                      <Link to={link.path} className="text-lg font-medium transition-colors hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                        {link.name}
                      </Link>
                    )}
                  </li>)}
              </ul>
            </div>
            
            <div className="space-y-4">
              {user ? (
                <>
                  <Button asChild className="w-full btn-primary">
                    <Link to="/booking" onClick={() => setMobileMenuOpen(false)}>
                      {t.nav.bookNow}
                    </Link>
                  </Button>
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Le mie prenotazioni
                      </Link>
                    </Button>
                    {isAdmin && (
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/blog/admin" onClick={() => setMobileMenuOpen(false)}>
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Gestione Blog
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Dashboard Admin
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      variant="destructive" 
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnetti
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      Accedi
                    </Link>
                  </Button>
                  <Button asChild className="w-full btn-primary">
                    <Link to="/booking" onClick={() => setMobileMenuOpen(false)}>
                      {t.nav.bookNow}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>;
}
