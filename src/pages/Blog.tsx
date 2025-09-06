import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserIcon, ArrowRightIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  meta_title: string;
  meta_description: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set SEO meta tags
    document.title = "Blog | Scopri le nostre storie e consigli";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Scopri articoli interessanti su viaggi, ospitalità e consigli per il tuo soggiorno perfetto. Leggi le nostre storie e guide per vivere al meglio la tua esperienza.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Scopri articoli interessanti su viaggi, ospitalità e consigli per il tuo soggiorno perfetto. Leggi le nostre storie e guide per vivere al meglio la tua esperienza.';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }

    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image, published_at, meta_title, meta_description')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli articoli del blog",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Il Nostro Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scopri storie, consigli e guide per vivere al meglio la tua esperienza di viaggio
          </p>
        </header>

        {posts.length === 0 ? (
          <Card className="text-center py-12 max-w-md mx-auto">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2">Nessun articolo pubblicato</h3>
              <p className="text-muted-foreground">
                Torna presto per leggere i nostri articoli interessanti!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="group">
                <Card className="h-full glass-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {post.featured_image && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={post.featured_image}
                        alt={`Immagine dell'articolo: ${post.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CalendarIcon className="h-4 w-4" />
                      <time dateTime={post.published_at}>
                        {format(new Date(post.published_at), 'dd MMMM yyyy', { locale: it })}
                      </time>
                    </div>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      <Link to={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Leggi di più
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </CardContent>
                </Card>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}