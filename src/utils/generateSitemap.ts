import { generateSitemap, generateSitemapUrls } from './seoUtils';

export function createSitemap() {
  const baseUrl = 'https://your-domain.com'; // Replace with your actual domain
  const urls = generateSitemapUrls(baseUrl);
  
  // Add blog posts URLs dynamically if needed
  // This could be enhanced to fetch from Supabase in a build script
  
  return generateSitemap(urls);
}

// Function to write sitemap to public directory during build
export function writeSitemapToPublic() {
  const sitemap = createSitemap();
  return sitemap;
}