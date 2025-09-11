import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowLeftIcon, ShareIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEO/SEOHead";
import { useStructuredData } from "@/components/SEO/StructuredData";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  meta_title: string;
  meta_description: string;
  published: boolean;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();
  const { getArticleData } = useStructuredData();

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (post) {
      // Set SEO meta tags
      document.title = post.meta_title || `${post.title} | Blog`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.meta_description || post.excerpt || '');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = post.meta_description || post.excerpt || '';
        document.getElementsByTagName('head')[0].appendChild(meta);
      }

      // Add Open Graph meta tags for social sharing
      updateMetaTag('property', 'og:title', post.title);
      updateMetaTag('property', 'og:description', post.meta_description || post.excerpt || '');
      updateMetaTag('property', 'og:type', 'article');
      updateMetaTag('property', 'og:url', window.location.href);
      if (post.featured_image) {
        updateMetaTag('property', 'og:image', post.featured_image);
      }
      
      // Add Twitter Card meta tags
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', post.title);
      updateMetaTag('name', 'twitter:description', post.meta_description || post.excerpt || '');
      if (post.featured_image) {
        updateMetaTag('name', 'twitter:image', post.featured_image);
      }

      // Add structured data for article
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.featured_image,
        "datePublished": post.published_at,
        "dateModified": post.published_at,
        "author": {
          "@type": "Organization",
          "name": "Il nostro team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Casa Vacanze"
        }
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      return () => {
        // Cleanup: remove the structured data script
        document.head.removeChild(script);
      };
    }
  }, [post]);

  const updateMetaTag = (attr: string, value: string, content: string) => {
    let meta = document.querySelector(`meta[${attr}="${value}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      meta = document.createElement('meta');
      meta.setAttribute(attr, value);
      meta.setAttribute('content', content);
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  };

  const fetchPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
        return;
      }

      setPost(data);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare l'articolo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sharePost = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copiato",
      description: "Il link dell'articolo è stato copiato negli appunti",
    });
  };

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-12 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
      <article className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/blog" className="inline-flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Torna al blog
            </Link>
          </Button>
        </div>

        <Card className="glass-card">
          {post.featured_image && (
            <div className="aspect-video overflow-hidden rounded-t-lg">
              <img
                src={post.featured_image}
                alt={`Immagine dell'articolo: ${post.title}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <CardContent className="p-8">
            <header className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), 'dd MMMM yyyy', { locale: it })}
                  </time>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sharePost}
                  className="flex items-center gap-2"
                >
                  <ShareIcon className="h-4 w-4" />
                  Condividi
                </Button>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </header>

            <div 
              className="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button asChild className="btn-primary">
            <Link to="/blog">
              Leggi altri articoli
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}