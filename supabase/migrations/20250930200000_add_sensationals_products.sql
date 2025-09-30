-- =====================================================
-- ADD PRODUCTS FOR SENSATIONALS STORE
-- Create beauty/parfum products for Sensationals
-- =====================================================

-- Get Sensationals organization ID
DO $$
DECLARE
  v_sensationals_id UUID;
  v_beauty_category_id UUID;
  v_parfum_category_id UUID;
  v_product_id UUID;
BEGIN
  -- Get Sensationals organization
  SELECT id INTO v_sensationals_id
  FROM public.organizations
  WHERE subdomain = 'sensationals'
  LIMIT 1;

  IF v_sensationals_id IS NULL THEN
    RAISE EXCEPTION 'Sensationals organization not found!';
  END IF;

  RAISE NOTICE '✅ Found Sensationals ID: %', v_sensationals_id;

  -- Create Beauty category
  INSERT INTO public.categories (
    organization_id,
    name,
    slug,
    description,
    is_active
  ) VALUES (
    v_sensationals_id,
    'Beauty',
    'beauty',
    'Beauty and skincare products',
    true
  )
  ON CONFLICT (organization_id, slug) DO UPDATE
  SET name = EXCLUDED.name
  RETURNING id INTO v_beauty_category_id;

  -- Create Parfum category
  INSERT INTO public.categories (
    organization_id,
    name,
    slug,
    description,
    is_active
  ) VALUES (
    v_sensationals_id,
    'Parfum',
    'parfum',
    'Luxe parfums en geuren',
    true
  )
  ON CONFLICT (organization_id, slug) DO UPDATE
  SET name = EXCLUDED.name
  RETURNING id INTO v_parfum_category_id;

  RAISE NOTICE '✅ Categories created - Beauty: %, Parfum: %', v_beauty_category_id, v_parfum_category_id;

  -- Product 1: Armani Because It's You
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    is_new,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_parfum_category_id,
    'Armani Because It''s You',
    'armani-because-its-you',
    'Een sensuele en luxe geur van Armani. Perfect voor speciale momenten.',
    35.00,
    40.00,
    'ARM-BCU-100',
    50,
    true,
    true,
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  -- Add product image
  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop',
    'Armani Because It''s You Parfum',
    true,
    1
  );

  -- Product 2: Armani My Way
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_parfum_category_id,
    'Armani My Way',
    'armani-my-way',
    'Een frisse en elegante geur voor de moderne vrouw.',
    35.00,
    40.00,
    'ARM-MW-100',
    45,
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1588405748880-12d1d2a59a21?w=800&auto=format&fit=crop',
    'Armani My Way Parfum',
    true,
    1
  );

  -- Product 3: Armani Si
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_parfum_category_id,
    'Armani Si',
    'armani-si',
    'Iconic parfum met chypre en vanille noten.',
    35.00,
    40.00,
    'ARM-SI-100',
    60,
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop',
    'Armani Si Parfum',
    true,
    1
  );

  -- Product 4: Armani Code
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_parfum_category_id,
    'Armani Code',
    'armani-code',
    'Mysterieus en verleidelijk voor hem.',
    38.00,
    45.00,
    'ARM-CODE-100',
    40,
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&auto=format&fit=crop',
    'Armani Code Parfum',
    true,
    1
  );

  -- Product 5: Klein Euphoria (Beauty product)
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    is_new,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_beauty_category_id,
    'Klein Euphoria',
    'klein-euphoria',
    'Sensuele en exotische geur met orchidee en amber.',
    32.00,
    38.00,
    'KL-EUPH-100',
    35,
    true,
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop',
    'Klein Euphoria',
    true,
    1
  );

  -- Product 6: Versailles Luxury Serum
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    is_new,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_beauty_category_id,
    'Versailles Luxury Serum',
    'versailles-luxury-serum',
    'Anti-aging serum met hyaluronzuur en vitamine C.',
    45.00,
    55.00,
    'VER-SER-30',
    25,
    true,
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop',
    'Versailles Luxury Serum',
    true,
    1
  );

  -- Product 7: Golden Glow Face Cream
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_beauty_category_id,
    'Golden Glow Face Cream',
    'golden-glow-face-cream',
    'Hydraterende dagcrème met gouden deeltjes voor een natuurlijke glow.',
    28.00,
    35.00,
    'GG-CREAM-50',
    40,
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&auto=format&fit=crop',
    'Golden Glow Face Cream',
    true,
    1
  );

  -- Product 8: Midnight Rose Body Oil
  INSERT INTO public.products (
    organization_id,
    category_id,
    name,
    slug,
    description,
    price,
    original_price,
    sku,
    stock_quantity,
    is_active,
    is_sale,
    created_at,
    updated_at
  ) VALUES (
    v_sensationals_id,
    v_beauty_category_id,
    'Midnight Rose Body Oil',
    'midnight-rose-body-oil',
    'Luxe body oil met rozenolie voor zachte en gehydrateerde huid.',
    24.00,
    30.00,
    'MR-OIL-100',
    30,
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_product_id;

  INSERT INTO public.product_images (
    product_id,
    image_url,
    alt_text,
    is_primary,
    sort_order
  ) VALUES (
    v_product_id,
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop',
    'Midnight Rose Body Oil',
    true,
    1
  );

  RAISE NOTICE '✅ Successfully created 8 products for Sensationals!';

  -- Show summary
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'SENSATIONALS PRODUCTS SUMMARY:';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Organization: Sensationals (%)' , v_sensationals_id;
  RAISE NOTICE 'Total Products: 8';
  RAISE NOTICE 'Categories: Beauty (%), Parfum (%)', v_beauty_category_id, v_parfum_category_id;
  RAISE NOTICE '==================================================';
END $$;

-- Verify products were created
SELECT 
  'Sensationals Products Created!' as message,
  COUNT(*) as product_count
FROM public.products p
JOIN public.organizations o ON o.id = p.organization_id
WHERE o.subdomain = 'sensationals';

-- List the products
SELECT 
  p.name,
  p.price,
  p.original_price,
  p.is_sale,
  p.is_new,
  c.name as category
FROM public.products p
JOIN public.organizations o ON o.id = p.organization_id
JOIN public.categories c ON c.id = p.category_id
WHERE o.subdomain = 'sensationals'
ORDER BY p.created_at;
