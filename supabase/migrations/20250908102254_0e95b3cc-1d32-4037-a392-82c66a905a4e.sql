-- Create reviews table for managing reviews from all platforms
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('airbnb', 'booking', 'google', 'other')),
  review_date date NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Published reviews are viewable by everyone" 
ON public.reviews 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Only admins can manage reviews" 
ON public.reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample reviews
INSERT INTO public.reviews (author_name, rating, review_text, platform, review_date, is_featured) VALUES
('Marco Rossi', 5, 'Posto fantastico immerso nel verde della Toscana. Appartamenti curati nei minimi dettagli e una vista mozzafiato. Torneremo sicuramente!', 'airbnb', '2024-08-15', true),
('Sarah Johnson', 5, 'Amazing stay at La Ripa! The location is perfect for exploring Tuscany and the apartments are beautifully furnished. Highly recommended!', 'airbnb', '2024-07-22', true),
('Anna Bianchi', 4, 'Esperienza molto positiva. Posto tranquillo e rilassante, ideale per una vacanza in famiglia. Staff disponibile e cortese.', 'booking', '2024-06-10', true),
('François Dubois', 5, 'Séjour parfait en Toscane! La propriété est magnifique et très bien entretenue. Vue exceptionnelle sur les vignobles.', 'booking', '2024-05-18', true),
('Elena Conti', 4, 'Struttura immersa nella natura con tutti i comfort necessari. Ottima base per visitare San Gimignano e dintorni.', 'other', '2024-04-03', false);