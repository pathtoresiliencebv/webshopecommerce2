import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  sku?: string;
  stock_quantity: number;
  is_active: boolean;
  vendor?: string;
  product_type?: string;
  images?: { image_url: string; alt_text?: string }[];
  organization?: {
    name: string;
    domain?: string;
    subdomain?: string;
  };
}

function generateGoogleShoppingXML(products: Product[], baseUrl: string): string {
  const items = products.map(product => {
    const imageUrl = product.images?.[0]?.image_url || '';
    const price = `${product.price.toFixed(2)} EUR`;
    const availability = product.stock_quantity > 0 ? 'in stock' : 'out of stock';
    
    return `    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${product.description || product.name}]]></g:description>
      <g:link>${baseUrl}/products/${product.id}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      ${product.original_price && product.original_price > product.price ? `<g:sale_price>${price}</g:sale_price>` : ''}
      <g:brand><![CDATA[${product.vendor || product.organization?.name || 'Unknown'}]]></g:brand>
      <g:product_type><![CDATA[${product.product_type || 'General'}]]></g:product_type>
      ${product.sku ? `<g:mpn>${product.sku}</g:mpn>` : ''}
      <g:identifier_exists>false</g:identifier_exists>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed</title>
    <link>${baseUrl}</link>
    <description>Product feed for shopping platforms</description>
${items}
  </channel>
</rss>`;
}

function generateFacebookCSV(products: Product[], baseUrl: string): string {
  const headers = 'id,title,description,availability,condition,price,link,image_link,brand,product_type,sale_price';
  
  const rows = products.map(product => {
    const imageUrl = product.images?.[0]?.image_url || '';
    const price = product.price.toFixed(2);
    const availability = product.stock_quantity > 0 ? 'in stock' : 'out of stock';
    const salePrice = product.original_price && product.original_price > product.price ? price : '';
    
    return [
      product.id,
      `"${product.name.replace(/"/g, '""')}"`,
      `"${(product.description || product.name).replace(/"/g, '""')}"`,
      availability,
      'new',
      `${price} EUR`,
      `${baseUrl}/products/${product.id}`,
      imageUrl,
      `"${(product.vendor || product.organization?.name || 'Unknown').replace(/"/g, '""')}"`,
      `"${(product.product_type || 'General').replace(/"/g, '""')}"`,
      salePrice ? `${salePrice} EUR` : ''
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}

function generateTikTokCSV(products: Product[], baseUrl: string): string {
  const headers = 'sku_id,product_name,description,category,price,sale_price,stock,product_link,main_image,brand,condition';
  
  const rows = products.map(product => {
    const imageUrl = product.images?.[0]?.image_url || '';
    const price = product.price.toFixed(2);
    const salePrice = product.original_price && product.original_price > product.price ? price : '';
    
    return [
      product.sku || product.id,
      `"${product.name.replace(/"/g, '""')}"`,
      `"${(product.description || product.name).replace(/"/g, '""')}"`,
      `"${product.product_type || 'General'}"`,
      price,
      salePrice,
      product.stock_quantity,
      `${baseUrl}/products/${product.id}`,
      imageUrl,
      `"${(product.vendor || product.organization?.name || 'Unknown').replace(/"/g, '""')}"`,
      'new'
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected format: /generate-shopping-feed/{organizationSlug}/{platform}-shopping.{format}
    if (pathParts.length < 3) {
      throw new Error('Invalid URL format. Expected: /{organizationSlug}/{platform}-shopping.{format}');
    }

    const organizationSlug = pathParts[1];
    const feedFile = pathParts[2];
    
    // Parse platform and format from filename
    const feedMatch = feedFile.match(/^(google|facebook|tiktok)-shopping\.(xml|csv)$/);
    if (!feedMatch) {
      throw new Error('Invalid feed format. Expected: {platform}-shopping.{xml|csv}');
    }

    const [, platform, format] = feedMatch;

    console.log(`Generating ${platform} feed in ${format} format for organization: ${organizationSlug}`);

    // Get organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, domain, subdomain')
      .eq('slug', organizationSlug)
      .eq('is_active', true)
      .single();

    if (orgError || !organization) {
      throw new Error(`Organization not found: ${organizationSlug}`);
    }

    // Determine base URL (prioritize custom domain)
    const baseUrl = organization.domain 
      ? `https://${organization.domain}`
      : `https://${organization.subdomain || organizationSlug}.aurelioliving.nl`;

    // Get active products for this organization with images
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, description, price, original_price, sku, stock_quantity,
        is_active, vendor, product_type,
        product_images:product_images(image_url, alt_text)
      `)
      .eq('organization_id', organization.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Transform products data
    const transformedProducts: Product[] = (products || []).map(product => ({
      ...product,
      images: product.product_images || [],
      organization: {
        name: organization.name,
        domain: organization.domain,
        subdomain: organization.subdomain
      }
    }));

    console.log(`Found ${transformedProducts.length} products for feed generation`);

    // Update feed sync log
    const { data: feed } = await supabase
      .from('shopping_feeds')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('platform', platform)
      .single();

    if (feed) {
      // Update last sync time and product count
      await supabase
        .from('shopping_feeds')
        .update({
          last_sync_at: new Date().toISOString(),
          product_count: transformedProducts.length,
          error_count: 0
        })
        .eq('id', feed.id);

      // Log sync activity
      await supabase
        .from('feed_sync_logs')
        .insert({
          feed_id: feed.id,
          sync_started_at: new Date().toISOString(),
          sync_completed_at: new Date().toISOString(),
          products_synced: transformedProducts.length,
          errors_count: 0,
          status: 'completed',
          log_data: { platform, format, baseUrl }
        });
    }

    // Generate feed content based on platform and format
    let content: string;
    let contentType: string;

    if (platform === 'google' && format === 'xml') {
      content = generateGoogleShoppingXML(transformedProducts, baseUrl);
      contentType = 'application/xml';
    } else if (platform === 'facebook' && format === 'csv') {
      content = generateFacebookCSV(transformedProducts, baseUrl);
      contentType = 'text/csv';
    } else if (platform === 'tiktok' && format === 'csv') {
      content = generateTikTokCSV(transformedProducts, baseUrl);
      contentType = 'text/csv';
    } else {
      throw new Error(`Unsupported platform/format combination: ${platform}/${format}`);
    }

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating shopping feed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});