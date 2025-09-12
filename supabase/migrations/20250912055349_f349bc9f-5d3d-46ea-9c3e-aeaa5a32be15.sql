-- Create analytics events table for custom tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  page_path TEXT,
  apartment_id TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy to allow everyone to insert events (for tracking)
CREATE POLICY "Anyone can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow admins to view analytics
CREATE POLICY "Admins can view analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for performance
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_apartment ON public.analytics_events(apartment_id, created_at) WHERE apartment_id IS NOT NULL;