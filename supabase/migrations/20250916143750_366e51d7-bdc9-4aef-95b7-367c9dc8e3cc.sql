-- Update the existing aurelio organization to have the new subdomain
UPDATE organizations 
SET subdomain = 'aurelioliving' 
WHERE slug = 'aurelio-living';

-- Remove duplicate aurello organization since it's not needed
DELETE FROM organizations 
WHERE slug = 'aurello-living';