-- Insert sample apartments for testing
INSERT INTO public.apartments (id, name, description, max_guests, price_per_night, currency, amenities, images) VALUES
('1', 'Appartamento del Borgo', 'Elegante appartamento nel cuore del borgo medievale con vista panoramica', 4, 120, 'EUR', ARRAY['WiFi', 'Aria condizionata', 'Cucina attrezzata', 'Terrazza'], ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']),
('2', 'Suite della Torre', 'Suggestiva suite nella torre storica con affreschi originali del XVI secolo', 2, 150, 'EUR', ARRAY['WiFi', 'Minibar', 'Vista panoramica', 'Bagno in marmo'], ARRAY['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800']),
('3', 'Casa delle Rose', 'Accogliente dimora con giardino privato e vista sulle colline del Chianti', 6, 200, 'EUR', ARRAY['WiFi', 'Giardino privato', 'Piscina', 'Cucina gourmet', 'Parcheggio'], ARRAY['https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=800']),
('4', 'Loft Contemporaneo', 'Moderno loft con design contemporaneo e comfort di lusso', 3, 90, 'EUR', ARRAY['WiFi', 'Smart TV', 'Aria condizionata', 'Angolo cottura', 'Terrazza'], ARRAY['https://images.unsplash.com/photo-1560448204-e1a3ecb4d883?w=800'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  max_guests = EXCLUDED.max_guests,
  price_per_night = EXCLUDED.price_per_night,
  currency = EXCLUDED.currency,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images;