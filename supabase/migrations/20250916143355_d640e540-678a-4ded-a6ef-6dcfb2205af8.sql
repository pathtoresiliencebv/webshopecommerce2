-- Update existing Aurelio Living store to use new subdomain format
UPDATE organizations 
SET subdomain = 'aurelioliving' 
WHERE slug = 'aurelio-living';

-- Update existing Aurello Living store to use correct subdomain format  
UPDATE organizations 
SET subdomain = 'aurelioliving' 
WHERE slug = 'aurello-living';