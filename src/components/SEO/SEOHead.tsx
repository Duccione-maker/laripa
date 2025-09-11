import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tag?: string[];
  };
  structuredData?: object;
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  image = '/og-image.png',
  url,
  type = 'website',
  article,
  structuredData
}: SEOProps) {
  const { language } = useLanguage();
  
  // Default SEO values
  const defaultTitle = language === 'it' 
    ? 'Casa Vacanze San Gimignano - Appartamenti con Piscina'
    : 'San Gimignano Holiday Rentals - Apartments with Pool';
    
  const defaultDescription = language === 'it'
    ? 'Scopri i nostri appartamenti vacanza a San Gimignano con piscina. Perfetti per una vacanza indimenticabile in Toscana.'
    : 'Discover our San Gimignano holiday apartments with swimming pool. Perfect for an unforgettable vacation in Tuscany.';

  const siteTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const siteDescription = description || defaultDescription;
  const currentUrl = url || window.location.href;
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  const defaultKeywords = language === 'it' 
    ? ['San Gimignano', 'casa vacanze', 'appartamenti', 'piscina', 'Toscana', 'vacanze']
    : ['San Gimignano', 'holiday rental', 'apartments', 'swimming pool', 'Tuscany', 'vacation'];

  const allKeywords = [...defaultKeywords, ...keywords];

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Language and locale */}
      <html lang={language} />
      <meta property="og:locale" content={language === 'it' ? 'it_IT' : 'en_US'} />
      
      {/* Open Graph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="San Gimignano Holiday Rentals" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Article specific meta tags */}
      {type === 'article' && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.tag && article.tag.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Structured data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="San Gimignano Holiday Rentals" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Performance and resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//images.unsplash.com" />
    </Helmet>
  );
}