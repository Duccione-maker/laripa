import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  review_text: string;
  platform: string;
  review_date: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

const platformOptions = [
  { value: 'airbnb', label: 'Airbnb', color: 'bg-red-500' },
  { value: 'booking', label: 'Booking.com', color: 'bg-blue-500' },
  { value: 'google', label: 'Google', color: 'bg-green-500' },
  { value: 'other', label: 'Altro', color: 'bg-gray-500' }
];

const initialReviewForm = {
  author_name: '',
  rating: 5,
  review_text: '',
  platform: 'airbnb',
  review_date: new Date().toISOString().split('T')[0],
  is_featured: false,
  is_published: true
};

export default function ReviewsManagement() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle recensioni",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingReview) {
        const { error } = await supabase
          .from('reviews')
          .update(reviewForm)
          .eq('id', editingReview.id);

        if (error) throw error;

        toast({
          title: "Successo",
          description: "Recensione aggiornata con successo",
        });
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert([reviewForm]);

        if (error) throw error;

        toast({
          title: "Successo", 
          description: "Recensione aggiunta con successo",
        });
      }

      setIsDialogOpen(false);
      setEditingReview(null);
      setReviewForm(initialReviewForm);
      fetchReviews();
    } catch (error) {
      console.error('Error saving review:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvare la recensione",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setReviewForm({
      author_name: review.author_name,
      rating: review.rating,
      review_text: review.review_text,
      platform: review.platform,
      review_date: review.review_date,
      is_featured: review.is_featured,
      is_published: review.is_published
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa recensione?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Recensione eliminata con successo",
      });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della recensione",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Recensione ${!currentStatus ? 'pubblicata' : 'nascosta'}`,
      });
      fetchReviews();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dello stato",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_featured: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Recensione ${!currentStatus ? 'messa in evidenza' : 'rimossa dall\'evidenza'}`,
      });
      fetchReviews();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dello stato",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getPlatformInfo = (platform: string) => {
    return platformOptions.find(p => p.value === platform) || platformOptions[3];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 bg-muted rounded w-1/3"></div>
        <div className="animate-pulse h-96 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestione Recensioni</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingReview(null);
              setReviewForm(initialReviewForm);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Recensione
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingReview ? 'Modifica Recensione' : 'Nuova Recensione'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="author_name">Nome Autore</Label>
                <Input
                  id="author_name"
                  value={reviewForm.author_name}
                  onChange={(e) => setReviewForm({...reviewForm, author_name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="rating">Valutazione</Label>
                <Select 
                  value={reviewForm.rating.toString()} 
                  onValueChange={(value) => setReviewForm({...reviewForm, rating: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5,4,3,2,1].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        <div className="flex items-center gap-2">
                          {renderStars(rating)}
                          <span>{rating} stelle</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="platform">Piattaforma</Label>
                <Select 
                  value={reviewForm.platform} 
                  onValueChange={(value) => setReviewForm({...reviewForm, platform: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="review_date">Data</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={reviewForm.review_date}
                  onChange={(e) => setReviewForm({...reviewForm, review_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="review_text">Testo Recensione</Label>
                <Textarea
                  id="review_text"
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({...reviewForm, review_text: e.target.value})}
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={reviewForm.is_featured}
                  onCheckedChange={(checked) => setReviewForm({...reviewForm, is_featured: checked})}
                />
                <Label htmlFor="is_featured">In evidenza</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={reviewForm.is_published}
                  onCheckedChange={(checked) => setReviewForm({...reviewForm, is_published: checked})}
                />
                <Label htmlFor="is_published">Pubblicata</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingReview ? 'Aggiorna' : 'Aggiungi'} Recensione
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tutte le Recensioni ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autore</TableHead>
                  <TableHead>Valutazione</TableHead>
                  <TableHead>Piattaforma</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => {
                  const platformInfo = getPlatformInfo(review.platform);
                  return (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{review.author_name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {review.review_text}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${platformInfo.color}`}>
                          {platformInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(review.review_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePublished(review.id, review.is_published)}
                            >
                              {review.is_published ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            {review.is_featured && (
                              <Badge variant="outline" className="text-xs">
                                ⭐ Evidenza
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(review)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFeatured(review.id, review.is_featured)}
                            className={review.is_featured ? 'text-yellow-600' : ''}
                          >
                            <Star className={`h-4 w-4 ${review.is_featured ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}