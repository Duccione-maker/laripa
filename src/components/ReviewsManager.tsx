import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink, MessageSquare, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number | string;
  profile_photo_url?: string;
  relative_time_description: string;
  platform?: 'google' | 'facebook';
}

export const ReviewsManager = () => {
  const [googleReviews, setGoogleReviews] = useState<Review[]>([]);
  const [facebookReviews, setFacebookReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const allReviews = [...googleReviews, ...facebookReviews].sort((a, b) => {
    const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : a.time * 1000;
    const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : b.time * 1000;
    return timeB - timeA;
  });

  const fetchGoogleReviews = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('find-place-id');
      
      if (error) throw error;
      
      if (!data.place_id) {
        throw new Error('Place ID not found');
      }

      const { data: reviewsData, error: reviewsError } = await supabase.functions.invoke('fetch-google-reviews', {
        body: { placeId: data.place_id }
      });

      if (reviewsError) {
        console.error('Error fetching Google reviews:', reviewsError);
        toast({
          title: "Errore",
          description: "Impossibile caricare le recensioni Google",
          variant: "destructive",
        });
        return;
      }

      if (reviewsData?.reviews) {
        const reviewsWithPlatform = reviewsData.reviews.map((review: any) => ({
          author_name: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time,
          profile_photo_url: review.profile_photo_url,
          relative_time_description: review.relative_time_description,
          platform: 'google' as const
        }));
        setGoogleReviews(reviewsWithPlatform);
      }
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
    }
  };

  const fetchFacebookReviews = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-facebook-reviews', {
        body: { pageId: '105934702166031' } // ID della tua pagina Facebook
      });

      if (error) {
        console.error('Error fetching Facebook reviews:', error);
        toast({
          title: "Errore",
          description: "Impossibile caricare le recensioni Facebook",
          variant: "destructive",
        });
        return;
      }

      if (data?.reviews) {
        const reviewsWithPlatform = data.reviews.map((review: any) => ({
          ...review,
          platform: 'facebook' as const
        }));
        setFacebookReviews(reviewsWithPlatform);
      }
    } catch (error) {
      console.error('Error fetching Facebook reviews:', error);
    }
  };

  const fetchAllReviews = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchGoogleReviews(), fetchFacebookReviews()]);
      toast({
        title: "Successo",
        description: "Recensioni caricate da tutte le piattaforme",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante il caricamento delle recensioni",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReviewsToDatabase = async () => {
    if (allReviews.length === 0) {
      toast({
        title: "Attenzione",
        description: "Nessuna recensione da salvare. Carica prima le recensioni.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const reviewsToSave = allReviews.map(review => {
        const reviewDate = review.platform === 'facebook' 
          ? new Date(review.time as string).toISOString().split('T')[0]
          : new Date((review.time as number) * 1000).toISOString().split('T')[0];
          
        return {
          author_name: review.author_name,
          rating: review.rating,
          review_text: review.text,
          review_date: reviewDate,
          platform: review.platform === 'facebook' ? 'Facebook' : 'Google'
        };
      });

      const { error } = await supabase
        .from('reviews')
        .upsert(reviewsToSave, { 
          onConflict: 'author_name,review_date,platform',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Error saving reviews:', error);
        toast({
          title: "Errore",
          description: "Errore durante il salvataggio delle recensioni",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Successo",
        description: `${reviewsToSave.length} recensioni salvate nel database`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Gestione Recensioni Online
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={fetchAllReviews} 
              disabled={loading}
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {loading ? 'Caricamento...' : 'Carica Tutte le Recensioni'}
            </Button>
            
            <Button 
              onClick={saveReviewsToDatabase} 
              disabled={loading || allReviews.length === 0}
              variant="default"
            >
              Salva nel Database ({allReviews.length})
            </Button>
          </div>
          
          <div className="flex gap-4 text-sm text-muted-foreground">
            {googleReviews.length > 0 && (
              <span>Google: {googleReviews.length}</span>
            )}
            {facebookReviews.length > 0 && (
              <span>Facebook: {facebookReviews.length}</span>
            )}
            {allReviews.length > 0 && (
              <span className="font-medium">Totale: {allReviews.length}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {allReviews.length > 0 && (
        <div className="grid gap-4">
          {allReviews.map((review, index) => (
            <Card key={index} className="w-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.author_name}</span>
                    <Badge variant={review.platform === 'facebook' ? 'default' : 'secondary'}>
                      {review.platform === 'facebook' ? (
                        <Facebook className="h-3 w-3 mr-1" />
                      ) : null}
                      {review.platform === 'facebook' ? 'Facebook' : 'Google'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-medium">{review.rating}</span>
                  </div>
                </div>
                
                {review.text && (
                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                    {review.text}
                  </p>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {review.relative_time_description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};