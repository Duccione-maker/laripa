-- Allow system (edge functions) to insert bookings for sync operations
CREATE POLICY "System can create synced bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

-- Allow admins to view all bookings including synced ones
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));