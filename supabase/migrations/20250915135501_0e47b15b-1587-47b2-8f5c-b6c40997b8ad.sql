-- Create a function to safely decrement product stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  _product_id UUID,
  _quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Update the stock quantity, ensuring it doesn't go below 0
  UPDATE public.products 
  SET stock_quantity = GREATEST(0, stock_quantity - _quantity),
      updated_at = now()
  WHERE id = _product_id;
  
  -- Return true if the update was successful
  RETURN FOUND;
END;
$function$;