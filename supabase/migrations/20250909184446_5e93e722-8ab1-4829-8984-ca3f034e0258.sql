-- Update Default Store to Aurello Living
UPDATE public.organizations 
SET 
  name = 'Aurello Living',
  slug = 'aurello-living', 
  description = 'Premium meubels voor modern wonen',
  logo_url = '/src/assets/aurora-logo.png'
WHERE id = '13421e79-c798-48f5-8db5-e9d588720a9a' AND name = 'Default Store';