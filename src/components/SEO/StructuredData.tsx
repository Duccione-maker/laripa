import { useLanguage } from '@/contexts/LanguageContext';

interface StructuredDataProps {
  type: 'Organization' | 'LocalBusiness' | 'Product' | 'Article' | 'BreadcrumbList';
  data: any;
}

export function useStructuredData() {
  const { language } = useLanguage();

  const getOrganizationData = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "San Gimignano Holiday Rentals",
    "description": language === 'it' 
      ? "Casa vacanze a San Gimignano con appartamenti dotati di piscina per vacanze indimenticabili in Toscana"
      : "Holiday rentals in San Gimignano with pool apartments for unforgettable vacations in Tuscany",
    "url": window.location.origin,
    "logo": `${window.location.origin}/og-image.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["Italian", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IT",
      "addressRegion": "Tuscany",
      "addressLocality": "San Gimignano"
    }
  });

  const getLocalBusinessData = () => ({
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": "San Gimignano Holiday Rentals",
    "description": language === 'it' 
      ? "Appartamenti vacanza a San Gimignano con piscina, perfetti per esplorare la bella Toscana"
      : "Holiday apartments in San Gimignano with swimming pool, perfect for exploring beautiful Tuscany",
    "url": window.location.origin,
    "image": `${window.location.origin}/og-image.png`,
    "priceRange": "€€",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IT",
      "addressRegion": "Tuscany", 
      "addressLocality": "San Gimignano"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "43.4674",
      "longitude": "11.0431"
    },
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": language === 'it' ? "Piscina" : "Swimming Pool",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification", 
        "name": language === 'it' ? "WiFi gratuito" : "Free WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": language === 'it' ? "Parcheggio" : "Parking",
        "value": true
      }
    ]
  });

  const getProductData = (apartment: any) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": apartment.name,
    "description": apartment.description,
    "image": apartment.image,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "EUR",
      "price": apartment.price
    }
  });

  const getArticleData = (article: any) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featured_image,
    "author": {
      "@type": "Organization",
      "name": "San Gimignano Holiday Rentals"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "San Gimignano Holiday Rentals",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/og-image.png`
      }
    },
    "datePublished": article.published_at,
    "dateModified": article.updated_at || article.published_at
  });

  const getBreadcrumbData = (breadcrumbs: Array<{name: string, url: string}>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  });

  return {
    getOrganizationData,
    getLocalBusinessData,
    getProductData,
    getArticleData,
    getBreadcrumbData
  };
}