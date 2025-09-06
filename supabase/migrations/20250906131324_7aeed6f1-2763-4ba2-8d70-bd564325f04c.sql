-- Fix search path for security
ALTER FUNCTION public.create_admin_user() SET search_path = public;
ALTER FUNCTION public.handle_admin_user() SET search_path = public;