import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
    dataLayer: any[];
  }
}

const GA_MEASUREMENT_ID = 'G-47KQTMQGEK';

export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Carica Google Analytics script
    if (typeof window !== 'undefined' && !window.gtag) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}', {
          page_title: document.title,
          page_location: window.location.href,
        });
      `;
      document.head.appendChild(script2);
    }
  }, []);

  useEffect(() => {
    // Traccia cambio pagina
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname,
      });

      // Salva anche nel database personalizzato
      trackCustomEvent('page_view', {
        page_path: location.pathname,
      });
    }
  }, [location]);

  return null;
};

// Funzione per tracciare eventi personalizzati
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Funzione per tracciare eventi nel nostro database
export const trackCustomEvent = async (eventType: string, data: {
  page_path?: string;
  apartment_id?: string;
  [key: string]: any;
}) => {
  try {
    const sessionId = sessionStorage.getItem('analytics_session') || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!sessionStorage.getItem('analytics_session')) {
      sessionStorage.setItem('analytics_session', sessionId);
    }

    await supabase.from('analytics_events').insert({
      event_type: eventType,
      page_path: data.page_path || window.location.pathname,
      apartment_id: data.apartment_id,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      session_id: sessionId,
    });
  } catch (error) {
    console.error('Error tracking custom event:', error);
  }
};

// Traccia eventi di prenotazione
export const trackBooking = (apartmentId: string, totalPrice: number, currency: string) => {
  // Google Analytics Enhanced Ecommerce
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: `booking_${Date.now()}`,
      value: totalPrice,
      currency: currency,
      items: [{
        item_id: apartmentId,
        item_name: `Apartment ${apartmentId}`,
        category: 'Accommodation',
        price: totalPrice,
        quantity: 1,
      }]
    });
  }

  // Evento personalizzato
  trackCustomEvent('booking_completed', {
    apartment_id: apartmentId,
  });
};

// Traccia visualizzazioni appartamenti
export const trackApartmentView = (apartmentId: string) => {
  trackEvent('view_item', 'apartment', apartmentId);
  trackCustomEvent('apartment_view', {
    apartment_id: apartmentId,
  });
};