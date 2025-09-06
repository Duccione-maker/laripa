-- Create admin user function
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@laripadisangimignano.com';
  
  -- If user doesn't exist, we can't create it directly in auth.users
  -- The user needs to register first, then we assign admin role
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user not found. User must register first with email: admin@laripadisangimignano.com';
    RETURN;
  END IF;
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Admin role assigned to user: admin@laripadisangimignano.com';
END;
$$;

-- Create a trigger function that automatically makes the specific email an admin
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'admin@laripadisangimignano.com' THEN
    -- Insert admin role instead of default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Insert default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new trigger for handling admin user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_user();