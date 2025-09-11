export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export function generateSitemapUrls(baseUrl: string): SitemapUrl[] {
  return [
    {
      loc: baseUrl,
      changefreq: 'weekly',
      priority: 1.0,
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      loc: `${baseUrl}/apartments`,
      changefreq: 'weekly', 
      priority: 0.9,
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      loc: `${baseUrl}/gallery`,
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      loc: `${baseUrl}/amenities`,
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      loc: `${baseUrl}/booking`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0]
    },
    {
      loc: `${baseUrl}/blog`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString().split('T')[0]
    }
  ];
}

export function optimizeMetaDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description;
  
  const truncated = description.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

export function generatePageTitle(pageTitle: string, siteName: string, maxLength: number = 60): string {
  const fullTitle = `${pageTitle} | ${siteName}`;
  
  if (fullTitle.length <= maxLength) return fullTitle;
  
  // If too long, try just the page title
  if (pageTitle.length <= maxLength) return pageTitle;
  
  // Truncate page title if necessary
  return pageTitle.substring(0, maxLength - 3) + '...';
}

export function extractKeywords(text: string, language: string = 'it'): string[] {
  // Common stop words to filter out
  const stopWords = language === 'it' 
    ? ['il', 'la', 'di', 'che', 'e', 'a', 'un', 'in', 'con', 'per', 'da', 'su', 'del', 'dei', 'delle']
    : ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'a', 'an'];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  // Count word frequency
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Return top keywords sorted by frequency
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}