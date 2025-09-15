-- Fix the search path security warning for existing functions
ALTER FUNCTION public.generate_order_number() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';