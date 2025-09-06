import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SaveIcon, ArrowLeftIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface BlogPostForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  published: boolean;
}

export default function BlogEditor() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [formData, setFormData] = useState<BlogPostForm>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    published: false,
  });

  const isEdit = !!id;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!roleLoading && !isAdmin) {
      navigate('/');
      return;
    }

    if (isEdit && isAdmin) {
      fetchPost();
    }
  }, [user, isAdmin, roleLoading, navigate, id]);

  const fetchPost = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || '',
        featured_image: data.featured_image || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        published: data.published,
      });
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare l'articolo",
        variant: "destructive",
      });
      navigate('/blog/admin');
    } finally {
      setInitialLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: !isEdit || prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug,
      meta_title: !prev.meta_title || prev.meta_title === prev.title ? title : prev.meta_title,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Titolo e contenuto sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const postData = {
        ...formData,
        author_id: user?.id,
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt,
      };

      if (isEdit) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Articolo aggiornato",
          description: "L'articolo è stato aggiornato con successo",
        });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;

        toast({
          title: "Articolo creato",
          description: "L'articolo è stato creato con successo",
        });
      }

      navigate('/blog/admin');
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      
      if (error.code === '23505' && error.constraint === 'blog_posts_slug_key') {
        toast({
          title: "Slug già esistente",
          description: "Questo slug è già utilizzato da un altro articolo. Modificalo per continuare.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile salvare l'articolo",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/blog/admin" className="inline-flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Torna alla gestione
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">
            {isEdit ? 'Modifica Articolo' : 'Nuovo Articolo'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Informazioni Articolo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titolo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Titolo dell'articolo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug URL *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="slug-url-articolo"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Estratto</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Breve descrizione dell'articolo"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image">Immagine in evidenza (URL)</Label>
                <Input
                  id="featured_image"
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://esempio.com/immagine.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenuto *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Scrivi il contenuto dell'articolo qui... Puoi usare HTML per la formattazione."
                  rows={12}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Puoi utilizzare HTML per formattare il testo (h2, h3, p, strong, em, ul, ol, li, a, ecc.)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle>SEO e Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Titolo per i motori di ricerca (se vuoto, userà il titolo)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_title.length}/60 caratteri (consigliato: 50-60)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Descrizione per i motori di ricerca (se vuota, userà l'estratto)"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description.length}/160 caratteri (consigliato: 150-160)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published" className="text-base font-medium">
                    Pubblica articolo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    L'articolo sarà visibile pubblicamente quando pubblicato
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-8">
            <Button type="submit" disabled={loading} className="btn-primary">
              <SaveIcon className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : (isEdit ? 'Aggiorna Articolo' : 'Crea Articolo')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/blog/admin">Annulla</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}