import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = 'G-47KQTMQGEK';
const SESSION_KEY = 'laripa_session_id';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function getCountryCode(): Promise<string | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.country_code ?? null;
  } catch {
    return null;
  }
}

export const Analytics = () => {
  const location = useLocation();
  const countryRef = useRef<string | null>(undefined as unknown as string);

  // Load GA once
  useEffect(() => {
    if (typeof window === 'undefined' || window.gtag) return;
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(s1);
    const s2 = document.createElement('script');
    s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`;
    document.head.appendChild(s2);
  }, []);

  // Fetch country once per session
  useEffect(() => {
    if (countryRef.current !== undefined) return;
    countryRef.current = null; // mark as loading
    getCountryCode().then(c => { countryRef.current = c; });
  }, []);

  // Track page view on route change
  useEffect(() => {
    const pagePath = location.pathname;

    // GA
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    // Internal — wait briefly for country if not yet resolved
    const track = async () => {
      // Give country fetch up to 1s if still pending
      if (countryRef.current === null) {
        await new Promise(r => setTimeout(r, 1000));
      }
      try {
        await supabase.from('analytics_events').insert({
          event_type: 'page_view',
          page_path: pagePath,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          session_id: getSessionId(),
          country_code: countryRef.current ?? null,
          device_type: isMobile() ? 'mobile' : 'desktop',
        } as Record<string, unknown>);
      } catch (e) {
        // silent
      }
    };
    track();
  }, [location.pathname]);

  return null;
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    } as Record<string, unknown>);
  }
};

export const trackCustomEvent = async (eventType: string, data: {
  page_path?: string;
  apartment_id?: string;
  [key: string]: unknown;
}) => {
  try {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      page_path: data.page_path ?? window.location.pathname,
      apartment_id: data.apartment_id ?? null,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      session_id: getSessionId(),
    } as Record<string, unknown>);
  } catch { /* silent */ }
};

export const trackBooking = (apartmentId: string, totalPrice: number, currency: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: `booking_${Date.now()}`,
      value: totalPrice,
      currency,
      items: [{ item_id: apartmentId, item_name: `Apartment ${apartmentId}`, category: 'Accommodation', price: totalPrice, quantity: 1 }],
    } as Record<string, unknown>);
  }
  trackCustomEvent('booking_completed', { apartment_id: apartmentId });
};

export const trackApartmentView = (apartmentId: string) => {
  trackEvent('view_item', 'apartment', apartmentId);
  trackCustomEvent('apartment_view', { apartment_id: apartmentId });
};
