-- Create Aurelio Living organization
INSERT INTO organizations (
  id,
  name,
  slug,
  subdomain,
  description,
  website_url,
  email,
  phone,
  address_line1,
  city,
  postal_code,
  country,
  timezone,
  currency,
  subscription_status,
  subscription_plan
) VALUES (
  'aurelio-living-org-id'::uuid,
  'Aurelio Living',
  'aurelio-living',
  'aurelio',
  'Premium meubelzaak gespecialiseerd in moderne woonkamer- en slaapkamermeubilair',
  'https://aurelio-living.nl',
  'info@aurelio-living.nl',
  '+31 20 123 4567',
  'Hoofdstraat 123',
  'Amsterdam',
  '1012 AB',
  'Netherlands',
  'Europe/Amsterdam',
  'EUR',
  'active',
  'professional'
);

-- Update a selection of existing products to belong to Aurelio Living
-- Get some bed products using subquery
UPDATE products 
SET organization_id = 'aurelio-living-org-id'::uuid
WHERE id IN (
  SELECT id FROM products 
  WHERE name LIKE '%Bed%' 
    AND organization_id = (SELECT id FROM organizations WHERE name = 'Default Store' LIMIT 1)
  ORDER BY name
  LIMIT 8
);

-- Get some coffee table products using subquery
UPDATE products 
SET organization_id = 'aurelio-living-org-id'::uuid
WHERE id IN (
  SELECT id FROM products 
  WHERE name LIKE '%Coffee Table%' 
    AND organization_id = (SELECT id FROM organizations WHERE name = 'Default Store' LIMIT 1)
  ORDER BY name
  LIMIT 6
);

-- Get some cabinet products using subquery
UPDATE products 
SET organization_id = 'aurelio-living-org-id'::uuid
WHERE id IN (
  SELECT id FROM products 
  WHERE name LIKE '%Cabinet%' 
    AND organization_id = (SELECT id FROM organizations WHERE name = 'Default Store' LIMIT 1)
  ORDER BY name
  LIMIT 4
);

-- Create Bedroom Collection
INSERT INTO collections (
  id,
  organization_id,
  name,
  slug,
  description,
  image_url,
  is_active,
  sort_order
) VALUES (
  gen_random_uuid(),
  'aurelio-living-org-id'::uuid,
  'Bedroom Collection',
  'bedroom-collection',
  'Luxueuze slaapkamermeubilair voor de moderne slaapkamer',
  '/src/assets/bed-modern-blue.jpg',
  true,
  1
);

-- Create Living Room Collection
INSERT INTO collections (
  id,
  organization_id,
  name,
  slug,
  description,
  image_url,
  is_active,
  sort_order
) VALUES (
  gen_random_uuid(),
  'aurelio-living-org-id'::uuid,
  'Living Room Collection',
  'living-room-collection',
  'Stijlvolle woonkamermeubilair voor elke moderne leefruimte',
  '/src/assets/coffee-table-black-gold.jpg',
  true,
  2
);

-- Link bed products to Bedroom Collection
INSERT INTO product_collections (product_id, collection_id)
SELECT p.id, c.id
FROM products p, collections c
WHERE p.organization_id = 'aurelio-living-org-id'::uuid
  AND p.name LIKE '%Bed%'
  AND c.organization_id = 'aurelio-living-org-id'::uuid
  AND c.slug = 'bedroom-collection';

-- Link coffee tables and cabinets to Living Room Collection  
INSERT INTO product_collections (product_id, collection_id)
SELECT p.id, c.id
FROM products p, collections c
WHERE p.organization_id = 'aurelio-living-org-id'::uuid
  AND (p.name LIKE '%Coffee Table%' OR p.name LIKE '%Cabinet%')
  AND c.organization_id = 'aurelio-living-org-id'::uuid
  AND c.slug = 'living-room-collection';

-- Grant current admin user owner access to Aurelio Living
INSERT INTO organization_users (
  organization_id,
  user_id,
  role,
  is_active,
  joined_at
) VALUES (
  'aurelio-living-org-id'::uuid,
  auth.uid(),
  'owner',
  true,
  now()
) ON CONFLICT (user_id, organization_id) DO UPDATE SET
  role = 'owner',
  is_active = true;