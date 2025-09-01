-- Create Aurelio Living organization with proper UUID
WITH new_org AS (
  INSERT INTO organizations (
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
  ) RETURNING id
),
-- Update bed products to belong to Aurelio Living
bed_updates AS (
  UPDATE products 
  SET organization_id = (SELECT id FROM new_org)
  WHERE id IN (
    SELECT id FROM products 
    WHERE name LIKE '%Bed%' 
      AND organization_id = (SELECT id FROM organizations WHERE name = 'Default Store' LIMIT 1)
    ORDER BY name
    LIMIT 8
  )
  RETURNING id
),
-- Update coffee table products
coffee_updates AS (
  UPDATE products 
  SET organization_id = (SELECT id FROM new_org)
  WHERE id IN (
    SELECT id FROM products 
    WHERE name LIKE '%Coffee Table%' 
      AND organization_id = (SELECT id FROM organizations WHERE name = 'Default Store' LIMIT 1)
    ORDER BY name
    LIMIT 6
  )
  RETURNING id
),
-- Update cabinet products
cabinet_updates AS (
  UPDATE products 
  SET organization_id = (SELECT id FROM new_org)
  WHERE id IN (
    SELECT id FROM products 
    WHERE name LIKE '%Cabinet%' 
      AND organization_id = (SELECT id FROM organizations WHERE name = 'Default Store' LIMIT 1)
    ORDER BY name
    LIMIT 4
  )
  RETURNING id
),
-- Create Bedroom Collection
bedroom_collection AS (
  INSERT INTO collections (
    organization_id,
    name,
    slug,
    description,
    image_url,
    is_active,
    sort_order
  ) VALUES (
    (SELECT id FROM new_org),
    'Bedroom Collection',
    'bedroom-collection',
    'Luxueuze slaapkamermeubilair voor de moderne slaapkamer',
    '/src/assets/bed-modern-blue.jpg',
    true,
    1
  ) RETURNING id
),
-- Create Living Room Collection
living_collection AS (
  INSERT INTO collections (
    organization_id,
    name,
    slug,
    description,
    image_url,
    is_active,
    sort_order
  ) VALUES (
    (SELECT id FROM new_org),
    'Living Room Collection',
    'living-room-collection',
    'Stijlvolle woonkamermeubilair voor elke moderne leefruimte',
    '/src/assets/coffee-table-black-gold.jpg',
    true,
    2
  ) RETURNING id
),
-- Link bed products to Bedroom Collection
bedroom_links AS (
  INSERT INTO product_collections (product_id, collection_id)
  SELECT p.id, (SELECT id FROM bedroom_collection)
  FROM products p
  WHERE p.organization_id = (SELECT id FROM new_org)
    AND p.name LIKE '%Bed%'
  RETURNING product_id
),
-- Link coffee tables and cabinets to Living Room Collection
living_links AS (
  INSERT INTO product_collections (product_id, collection_id)
  SELECT p.id, (SELECT id FROM living_collection)
  FROM products p
  WHERE p.organization_id = (SELECT id FROM new_org)
    AND (p.name LIKE '%Coffee Table%' OR p.name LIKE '%Cabinet%')
  RETURNING product_id
)
-- Grant current admin user owner access to Aurelio Living
INSERT INTO organization_users (
  organization_id,
  user_id,
  role,
  is_active,
  joined_at
)
SELECT 
  (SELECT id FROM new_org),
  auth.uid(),
  'owner',
  true,
  now()
WHERE auth.uid() IS NOT NULL;