-- Add description column to discount_codes table
ALTER TABLE public.discount_codes 
ADD COLUMN description TEXT;