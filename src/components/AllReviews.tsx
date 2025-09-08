import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  review_text: string;
  platform: string;
  review_date: string;
  is_featured: boolean;
}

const platformColors = {
  airbnb: "bg-red-500",
  booking: "bg-blue-500", 
  google: "bg-green-500",
  other: "bg-gray-500"
};

const platformLabels = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  google: "Google",
  other: "Altro"
};

export default function AllReviews() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch featured reviews with 4-5 stars
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_published', true)
        .gte('rating', 4)
        .eq('is_featured', true)
        .order('review_date', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle recensioni');
    } finally {
      setLoading(false);
    }
  };

  const nextReview = () => {
    if (reviews.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }
  };

  const prevReview = () => {
    if (reviews.length > 0) {
      setCurrentIndex((prev) => 
        prev === 0 ? reviews.length - 1 : prev - 1
      );
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Recensioni dei Nostri Ospiti</h2>
          <p className="text-muted-foreground">
            {error}
          </p>
          <Button 
            onClick={fetchReviews} 
            className="mt-4"
            variant="outline"
          >
            Riprova
          </Button>
        </div>
      </section>
    );
  }

  if (!reviews.length) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Recensioni dei Nostri Ospiti</h2>
          <p className="text-muted-foreground">
            Nessuna recensione disponibile al momento.
          </p>
        </div>
      </section>
    );
  }

  const currentReview = reviews[currentIndex];
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Recensioni dei Nostri Ospiti</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {renderStars(Math.round(averageRating))}
            <span className="text-2xl font-bold ml-2">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <p className="text-muted-foreground">
            Le migliori recensioni da Airbnb, Booking.com e altre piattaforme
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="relative">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="font-semibold text-lg mb-1">
                    {currentReview.author_name}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(currentReview.rating)}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(currentReview.review_date)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs text-white font-medium ${
                      platformColors[currentReview.platform as keyof typeof platformColors]
                    }`}
                  >
                    {platformLabels[currentReview.platform as keyof typeof platformLabels]}
                  </span>
                </div>
              </div>
              
              <blockquote className="text-lg leading-relaxed mb-6">
                "{currentReview.review_text}"
              </blockquote>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    La Ripa di San Gimignano
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevReview}
                    disabled={reviews.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-3">
                    {currentIndex + 1} di {reviews.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextReview}
                    disabled={reviews.length <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}