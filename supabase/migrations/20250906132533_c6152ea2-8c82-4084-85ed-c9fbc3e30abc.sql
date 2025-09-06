-- Remove the foreign key constraint that's causing issues
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- Insert sample bookings for testing the calendar
INSERT INTO public.bookings (
  user_id, 
  apartment_id, 
  guest_name, 
  guest_email, 
  check_in, 
  check_out, 
  adults, 
  children, 
  status, 
  total_price, 
  currency,
  smoobu_booking_id
) VALUES
('00000000-0000-0000-0000-000000000000', '1', 'Marco Rossi', 'marco.rossi@email.com', '2025-01-15', '2025-01-20', 2, 0, 'confirmed', 600, 'EUR', 'demo-1'),
('00000000-0000-0000-0000-000000000000', '2', 'Laura Bianchi', 'laura.bianchi@email.com', '2025-01-18', '2025-01-22', 2, 1, 'confirmed', 600, 'EUR', 'demo-2'),
('00000000-0000-0000-0000-000000000000', '3', 'Giuseppe Verdi', 'giuseppe.verdi@email.com', '2025-01-25', '2025-01-30', 4, 2, 'pending', 1000, 'EUR', 'demo-3'),
('00000000-0000-0000-0000-000000000000', '4', 'Anna Neri', 'anna.neri@email.com', '2025-01-12', '2025-01-16', 2, 0, 'confirmed', 360, 'EUR', 'demo-4'),
('00000000-0000-0000-0000-000000000000', '1', 'Francesco Gialli', 'francesco.gialli@email.com', '2025-02-01', '2025-02-05', 3, 1, 'confirmed', 480, 'EUR', 'demo-5')
ON CONFLICT (smoobu_booking_id) DO NOTHING;