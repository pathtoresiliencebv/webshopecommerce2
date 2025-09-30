/**
 * GENERATE SHOPPING FEED
 * 
 * Generates shopping feeds for Google Shopping, Facebook, TikTok, etc.
 * Auto-uploads to storage and updates feed URLs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { organizationId, feedId, platform } = await req.json();

    if (!organizationId || !feedId || !platform) {
      throw new Error('Organization ID, feed ID, and platform are required');
    }

    console.log(`📦 Generating ${platform} feed for org: ${organizationId}`);

    const startTime = Date.now();

    // Get tenant database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: tenantDb } = await supabaseClient
      .from('tenant_databases')
      .select('id, connection_string_encrypted')
      .eq('organization_id', organizationId)
      .single();

    if (!tenantDb) {
      throw new Error('Tenant database not found');
    }

    // Decrypt connection string
    const decryptResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/decrypt-connection-string`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ tenantDatabaseId: tenantDb.id }),
      }
    );

    const { connectionString } = await decryptResponse.json();

    // Connect to tenant database
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.3/mod.js');
    const sql = postgres(connectionString);

    // Get feed config
    const [feedConfig] = await sql`
      SELECT * FROM shopping_feeds WHERE id = ${feedId}
    `;

    if (!feedConfig) {
      throw new Error('Feed configuration not found');
    }

    // Get products for feed
    const products = await sql`
      SELECT 
        p.*,
        c.name as category_name,
        array_agg(DISTINCT pi.image_url) as images,
        pv.price as variant_price,
        pv.inventory_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.status = 'active'
        ${feedConfig.include_out_of_stock ? sql`` : sql`AND p.inventory_quantity > 0`}
        ${feedConfig.minimum_price ? sql`AND p.price >= ${feedConfig.minimum_price}` : sql``}
        ${feedConfig.maximum_price ? sql`AND p.price <= ${feedConfig.maximum_price}` : sql``}
      GROUP BY p.id, c.name, pv.price, pv.inventory_quantity
      ORDER BY p.created_at DESC
    `;

    console.log(`📊 Found ${products.length} products for feed`);

    // Generate feed based on platform
    let feedContent: string;
    let contentType: string;
    let fileExtension: string;

    switch (platform) {
      case 'google_shopping':
        feedContent = generateGoogleShoppingXML(products, feedConfig, organizationId);
        contentType = 'application/xml';
        fileExtension = 'xml';
        break;
      
      case 'facebook':
      case 'instagram':
        feedContent = generateFacebookCSV(products, feedConfig, organizationId);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      
      case 'tiktok':
        feedContent = generateTikTokJSON(products, feedConfig, organizationId);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Upload to Supabase Storage
    const fileName = `feeds/${organizationId}/${platform}_${Date.now()}.${fileExtension}`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('shopping-feeds')
      .upload(fileName, feedContent, {
        contentType: contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload feed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('shopping-feeds')
      .getPublicUrl(fileName);

    // Update feed config with URL
    await sql`
      UPDATE shopping_feeds
      SET 
        feed_url = ${publicUrl},
        last_generated_at = NOW(),
        total_products = ${products.length},
        updated_at = NOW()
      WHERE id = ${feedId}
    `;

    // Log generation
    const duration = Date.now() - startTime;
    const feedSize = new Blob([feedContent]).size;

    await sql`
      INSERT INTO feed_generation_logs (
        shopping_feed_id,
        status,
        products_count,
        file_size_bytes,
        generation_duration_ms,
        created_at
      ) VALUES (
        ${feedId},
        'success',
        ${products.length},
        ${feedSize},
        ${duration},
        NOW()
      )
    `;

    await sql.end();

    console.log(`✅ Feed generated successfully in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        feedUrl: publicUrl,
        productsCount: products.length,
        fileSize: feedSize,
        generationTime: duration,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error generating feed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Generate Google Shopping XML Feed
 */
function generateGoogleShoppingXML(products: any[], config: any, orgId: string): string {
  const items = products.map(product => {
    const images = product.images?.filter(Boolean) || [];
    const mainImage = images[0] || '';
    
    return `
    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.title}]]></g:title>
      <g:description><![CDATA[${product.description || product.short_description || product.title}]]></g:description>
      <g:link>https://${config.subdomain || orgId}.myaurelio.com/products/${product.slug}</g:link>
      <g:image_link>${mainImage}</g:image_link>
      ${images.slice(1, 11).map(img => `<g:additional_image_link>${img}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${product.inventory_quantity > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${product.price} EUR</g:price>
      ${product.compare_at_price ? `<g:sale_price>${product.price} EUR</g:sale_price>` : ''}
      <g:brand>${product.vendor || 'Generic'}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${product.category_name || product.product_type || 'General'}</g:product_type>
      <g:google_product_category>${getGoogleCategory(product.category_name)}</g:google_product_category>
      ${product.weight ? `<g:shipping_weight>${product.weight} ${product.weight_unit}</g:shipping_weight>` : ''}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${config.feed_name}</title>
    <link>https://${config.subdomain || orgId}.myaurelio.com</link>
    <description>Product feed for ${config.feed_name}</description>
${items}
  </channel>
</rss>`;
}

/**
 * Generate Facebook/Instagram CSV Feed
 */
function generateFacebookCSV(products: any[], config: any, orgId: string): string {
  const headers = [
    'id', 'title', 'description', 'availability', 'condition', 'price',
    'link', 'image_link', 'brand', 'google_product_category'
  ].join(',');
  
  const rows = products.map(product => {
    const images = product.images?.filter(Boolean) || [];
    const mainImage = images[0] || '';
    
    return [
      product.id,
      `"${product.title.replace(/"/g, '""')}"`,
      `"${(product.description || product.short_description || '').replace(/"/g, '""')}"`,
      product.inventory_quantity > 0 ? 'in stock' : 'out of stock',
      'new',
      `${product.price} EUR`,
      `https://${config.subdomain || orgId}.myaurelio.com/products/${product.slug}`,
      mainImage,
      product.vendor || 'Generic',
      getGoogleCategory(product.category_name)
    ].join(',');
  }).join('\n');

  return `${headers}\n${rows}`;
}

/**
 * Generate TikTok JSON Feed
 */
function generateTikTokJSON(products: any[], config: any, orgId: string): string {
  const items = products.map(product => {
    const images = product.images?.filter(Boolean) || [];
    
    return {
      sku_id: product.id,
      title: product.title,
      description: product.description || product.short_description || product.title,
      product_url: `https://${config.subdomain || orgId}.myaurelio.com/products/${product.slug}`,
      image_url: images[0] || '',
      additional_image_urls: images.slice(1, 9),
      price: {
        amount: product.price.toString(),
        currency: 'EUR'
      },
      availability: product.inventory_quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      brand: product.vendor || 'Generic',
      category: product.category_name || product.product_type || 'General',
    };
  });

  return JSON.stringify({ products: items }, null, 2);
}

/**
 * Map category to Google Product Category
 */
function getGoogleCategory(categoryName: string | null): string {
  const categoryMap: Record<string, string> = {
    'fashion': '166', // Apparel & Accessories
    'electronics': '222', // Electronics
    'home': '536', // Home & Garden
    'beauty': '469', // Health & Beauty
    'sports': '499', // Sporting Goods
    'food': '428', // Food, Beverages & Tobacco
  };

  const key = Object.keys(categoryMap).find(k => 
    categoryName?.toLowerCase().includes(k)
  );

  return categoryMap[key || ''] || '1'; // General category
}

console.log('✅ Shopping feed generator initialized');