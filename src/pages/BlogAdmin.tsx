import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon, 
  CalendarIcon,
  FileTextIcon
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export default function BlogAdmin() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!roleLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) {
      fetchPosts();
    }
  }, [user, isAdmin, roleLoading, navigate]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, published, published_at, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli articoli",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Articolo eliminato",
        description: "L'articolo è stato eliminato con successo",
      });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'articolo",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ published: !currentStatus })
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, published: !currentStatus }
          : post
      ));

      toast({
        title: !currentStatus ? "Articolo pubblicato" : "Articolo ritirato",
        description: !currentStatus 
          ? "L'articolo è ora visibile pubblicamente" 
          : "L'articolo non è più visibile pubblicamente",
      });
    } catch (error) {
      console.error('Error updating post status:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato dell'articolo",
        variant: "destructive",
      });
    }
  };

  const testFacebookToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('test-facebook-token');
      
      if (error) throw error;
      
      toast({
        title: "Test Facebook completato",
        description: "Controlla i log nella console di Supabase per i dettagli",
      });
      
      console.log('Facebook test results:', data);
    } catch (error) {
      console.error('Error testing Facebook token:', error);
      toast({
        title: "Errore test Facebook",
        description: "Impossibile testare il token Facebook",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Gestione Blog</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={testFacebookToken}>
              Test Facebook
            </Button>
            <Button asChild className="btn-primary">
              <Link to="/blog/admin/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuovo Articolo
              </Link>
            </Button>
          </div>
        </div>

        {posts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nessun articolo</h3>
              <p className="text-muted-foreground mb-4">
                Non hai ancora creato nessun articolo. Inizia scrivendo il tuo primo post!
              </p>
              <Button asChild className="btn-primary">
                <Link to="/blog/admin/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crea il primo articolo
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="glass-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{post.title}</CardTitle>
                        <Badge variant={post.published ? "default" : "secondary"}>
                          {post.published ? "Pubblicato" : "Bozza"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Creato: {format(new Date(post.created_at), 'dd/MM/yyyy', { locale: it })}
                        </div>
                        {post.published_at && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            Pubblicato: {format(new Date(post.published_at), 'dd/MM/yyyy', { locale: it })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {post.published && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/blog/${post.slug}`} target="_blank">
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/blog/admin/edit/${post.id}`}>
                          <EditIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant={post.published ? "secondary" : "default"}
                        size="sm"
                        onClick={() => togglePublished(post.id, post.published)}
                      >
                        {post.published ? "Ritira" : "Pubblica"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Elimina articolo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sei sicuro di voler eliminare questo articolo? Questa azione non può essere annullata.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deletePost(post.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}