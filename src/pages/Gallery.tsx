
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Apartment data - imported from apartment pages
const allApartments = [
  {
    id: "1",
    name: "Padronale",
    image: "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png",
    images: [
      "/lovable-uploads/1855fa03-9c3f-46d6-b7ce-8760cedc9f90.png",
      "/lovable-uploads/204d40d3-9d9a-411a-9f06-34ee9648960f.png",
      "/lovable-uploads/ac482e8b-5bc9-4801-a5cd-62c4e098627a.png",
      "/lovable-uploads/1a9ddcc6-3847-415a-b7e4-62542a629852.png",
      "/lovable-uploads/7ce30357-9f21-45f5-9a88-ae9cfef3a153.png",
      "/lovable-uploads/698d71b3-1f38-4d4e-a8f2-6f31e882cd08.png"
    ]
  },
  {
    id: "2", 
    name: "Ghiri",
    image: "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png",
    images: [
      "/lovable-uploads/e636d9ee-5f63-4fdd-beb9-6a3d6502048e.png",
      "/lovable-uploads/524138e8-c9d1-41e9-8867-3632efb248fc.png",
      "/lovable-uploads/a0bd4059-64fa-4bd7-a506-cd13d8fd18e5.png",
      "/lovable-uploads/d9b7a116-e425-4b55-85d0-4bdffcf35f92.png",
      "/lovable-uploads/163f6f54-8b1e-483a-82a8-c3077685d7c2.png",
      "/lovable-uploads/151c50a6-cce6-4b3c-b93e-cf9e0a2b078b.png"
    ]
  },
  {
    id: "3",
    name: "Fienile",
    image: "/lovable-uploads/4f21e3a8-c435-420a-9c45-8c828be3c0b2.png",
    images: [
      "/lovable-uploads/4f21e3a8-c435-420a-9c45-8c828be3c0b2.png",
      "/lovable-uploads/b4b7072e-42c3-4d8f-80b8-3d2ab767fbd7.png",
      "/lovable-uploads/1186d9ca-0c44-4a10-8518-69b07a812b81.png",
      "/lovable-uploads/0a4860b0-b18d-4f60-b004-c0a8cfeec2c5.png",
      "/lovable-uploads/3f1ae5ae-fa9f-4be5-b0b9-a48c88c8e1ee.png",
      "/lovable-uploads/ebf36a44-3fca-4c29-99ec-56ff07963d02.png",
      "/lovable-uploads/25f155d7-09a3-46bd-ae61-f458cd3727c8.png",
      "/lovable-uploads/6a850667-528d-4af4-ae56-7af124b28b97.png"
    ]
  },
  {
    id: "4",
    name: "Nidi",
    image: "/lovable-uploads/64f16b83-f8d5-49dc-b96e-6a208c142224.png",
    images: [
      "/lovable-uploads/64f16b83-f8d5-49dc-b96e-6a208c142224.png",
      "/lovable-uploads/f7046709-9eac-4cf9-b68b-c0fdfac4de60.png",
      "/lovable-uploads/c99136a0-db75-45c6-a328-e285d21506cc.png",
      "/lovable-uploads/4501c737-dbc3-4e68-b653-3173cb93a8fe.png",
      "/lovable-uploads/46ded70c-6837-488e-a636-4ee5de394f3a.png",
      "/lovable-uploads/a578cc1c-564c-4d1b-a5b0-aae344f7c162.png"
    ]
  }
];

// Pool images
const poolImages = [
  {
    id: 100,
    src: "/lovable-uploads/2807f271-ff86-4cdc-b11d-3edcdd325e06.png",
    alt: "Relax in piscina con libro",
    category: "pool"
  },
  {
    id: 101,
    src: "/lovable-uploads/fc598a71-9a45-49ac-a987-ca545394e171.png",
    alt: "Vista generale della piscina",
    category: "pool"
  },
  {
    id: 102,
    src: "/lovable-uploads/25347281-e633-44c8-9703-92be4df25a36.png",
    alt: "Vista panoramica piscina e struttura",
    category: "pool"
  },
  {
    id: 103,
    src: "/lovable-uploads/2ac63ed1-ab4d-46f8-8b36-66c7a1ff0914.png",
    alt: "Area piscina con ombrelloni",
    category: "pool"
  },
  {
    id: 104,
    src: "/lovable-uploads/a930fdfe-4573-422b-bb04-ebdb70b93b96.png",
    alt: "Piscina illuminata di sera",
    category: "pool"
  }
];

// Generate gallery images from apartment data
const generateGalleryImages = () => {
  const galleryImages: Array<{id: number; src: string; alt: string; category: string; apartment?: string}> = [];
  let idCounter = 1;

  allApartments.forEach(apartment => {
    // Add main image
    galleryImages.push({
      id: idCounter++,
      src: apartment.image,
      alt: `${apartment.name} - Vista principale`,
      category: "apartments",
      apartment: apartment.name
    });

    // Add additional images
    apartment.images?.forEach((image, index) => {
      if (image !== apartment.image) { // Avoid duplicates
        galleryImages.push({
          id: idCounter++,
          src: image,
          alt: `${apartment.name} - Foto ${index + 1}`,
          category: "apartments",
          apartment: apartment.name
        });
      }
    });
  });

  // Add pool images
  galleryImages.push(...poolImages);

  return galleryImages;
};

const galleryImages = generateGalleryImages();

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filteredImages, setFilteredImages] = useState(galleryImages);
  const [activeFilter, setActiveFilter] = useState("all");
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  
  // Filter gallery images by apartment, category or show all
  const filterGallery = (filter: string) => {
    setActiveFilter(filter);
    
    if (filter === "all") {
      setFilteredImages(galleryImages);
    } else if (filter === "pool") {
      setFilteredImages(galleryImages.filter(img => img.category === "pool"));
    } else {
      setFilteredImages(galleryImages.filter(img => img.apartment === filter));
    }
  };
  
  // Handle lightbox navigation
  const navigateGallery = (direction: "prev" | "next") => {
    if (selectedImage === null) return;
    
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
    let newIndex;
    
    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    } else {
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(filteredImages[newIndex].id);
  };
  
  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      if (e.key === "Escape") {
        setSelectedImage(null);
      } else if (e.key === "ArrowLeft") {
        navigateGallery("prev");
      } else if (e.key === "ArrowRight") {
        navigateGallery("next");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, filteredImages]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted/30 to-muted/60">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Header Section */}
        <section className="relative py-20 bg-gradient-to-r from-sea-light to-white dark:from-sea-dark dark:to-background overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {t.gallery.title}
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                {t.gallery.subtitle}
              </p>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary/50 blur-3xl" />
            <div className="absolute bottom-10 right-40 w-48 h-48 rounded-full bg-sea-light blur-3xl" />
          </div>
        </section>
        
        {/* Gallery Filters */}
        <section className="py-8">
          <div className="container">
            <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-in">
              {["all", "Padronale", "Ghiri", "Fienile", "Nidi", "pool"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => filterGallery(filter)}
                  className={cn(
                    "px-6 py-2 rounded-full transition-all",
                    activeFilter === filter
                      ? "bg-primary text-white shadow-lg"
                      : "bg-card hover:bg-muted"
                  )}
                >
                  {filter === "all" 
                    ? "Tutte le foto" 
                    : filter === "pool" 
                      ? "Piscina" 
                      : `Appartamento ${filter}`}
                </button>
              ))}
            </div>
            
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((image, index) => (
                <div 
                  key={image.id} 
                  className="relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedImage(image.id)}
                >
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="text-white">
                      <p className="font-medium">{image.alt}</p>
                      {image.apartment && (
                        <p className="text-sm text-white/80">Appartamento {image.apartment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Lightbox */}
        {selectedImage !== null && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
            <button 
              className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
            
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-4 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => navigateGallery("prev")}
            >
              <span className="sr-only">Previous</span>
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="max-w-5xl max-h-[80vh] overflow-hidden">
              {filteredImages.find(img => img.id === selectedImage) && (
                <img 
                  src={filteredImages.find(img => img.id === selectedImage)?.src} 
                  alt={filteredImages.find(img => img.id === selectedImage)?.alt}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
            </div>
            
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-4 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => navigateGallery("next")}
            >
              <span className="sr-only">Next</span>
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
