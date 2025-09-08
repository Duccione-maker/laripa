import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  date: string;
  relative_time: string;
  profile_photo?: string;
  source: string;
}

interface ReviewsData {
  reviews: GoogleReview[];
  average_rating: number;
  total_reviews: number;
  source: string;
}

export default function GoogleReviews() {
  const { t } = useLanguage();
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Place ID estratto dall'URL che hai fornito (potrebbe dover essere convertito)
  const PLACE_ID = "ChIJZZna-TY5MhMR8u8oKK-B0Sg"; // Questo è un esempio, dobbiamo trovare quello corretto

  useEffect(() => {
    fetchGoogleReviews();
  }, []);

  const fetchGoogleReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('fetch-google-reviews', {
        body: { placeId: PLACE_ID }
      });

      if (error) throw error;

      setReviewsData(data);
    } catch (err) {
      console.error('Error fetching Google reviews:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle recensioni');
    } finally {
      setLoading(false);
    }
  };

  const nextReview = () => {
    if (reviewsData?.reviews) {
      setCurrentIndex((prev) => (prev + 1) % reviewsData.reviews.length);
    }
  };

  const prevReview = () => {
    if (reviewsData?.reviews) {
      setCurrentIndex((prev) => 
        prev === 0 ? reviewsData.reviews.length - 1 : prev - 1
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
          <h2 className="text-3xl font-bold mb-4">Recensioni Google</h2>
          <p className="text-muted-foreground">
            {error}
          </p>
          <Button 
            onClick={fetchGoogleReviews} 
            className="mt-4"
            variant="outline"
          >
            Riprova
          </Button>
        </div>
      </section>
    );
  }

  if (!reviewsData?.reviews?.length) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Recensioni Google</h2>
          <p className="text-muted-foreground">
            Nessuna recensione disponibile al momento.
          </p>
        </div>
      </section>
    );
  }

  const currentReview = reviewsData.reviews[currentIndex];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Recensioni Google</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {renderStars(Math.round(reviewsData.average_rating))}
            <span className="text-2xl font-bold ml-2">
              {reviewsData.average_rating.toFixed(1)}
            </span>
          </div>
          <p className="text-muted-foreground">
            Basato su {reviewsData.total_reviews} recensioni Google
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="relative">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                {currentReview.profile_photo && (
                  <img 
                    src={currentReview.profile_photo} 
                    alt={currentReview.author_name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-lg">
                    {currentReview.author_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(currentReview.rating)}
                    <span className="text-sm text-muted-foreground">
                      {currentReview.relative_time}
                    </span>
                  </div>
                </div>
              </div>
              
              <blockquote className="text-lg leading-relaxed mb-6">
                "{currentReview.text}"
              </blockquote>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Recensione da Google
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevReview}
                    disabled={reviewsData.reviews.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-3">
                    {currentIndex + 1} di {reviewsData.reviews.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextReview}
                    disabled={reviewsData.reviews.length <= 1}
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