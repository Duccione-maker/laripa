import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PricingData {
  price: number;
  currency: string;
  source: 'smoobu' | 'fallback';
  error?: string;
}

export function useSmoobuPricing(apartmentId: string, checkIn?: string, checkOut?: string) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke('fetch-smoobu-prices', {
          body: {
            apartmentId,
            checkIn,
            checkOut
          }
        });

        if (functionError) {
          throw functionError;
        }

        setPricing(data);
      } catch (err) {
        console.error('Error fetching pricing:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch pricing');
        
        // Set fallback pricing
        const fallbackPrices: Record<string, number> = {
          '1': 280,
          '2': 220,
          '3': 190,
          '4': 160
        };

        setPricing({
          price: fallbackPrices[apartmentId] || 200,
          currency: 'EUR',
          source: 'fallback'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [apartmentId, checkIn, checkOut]);

  return { pricing, loading, error };
}