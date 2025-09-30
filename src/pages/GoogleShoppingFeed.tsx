/**
 * GOOGLE SHOPPING FEED ROUTE
 * 
 * Serves Google Shopping XML feed at /google-shopping.xml per store
 * Uses store from StoreContext (subdomain detection)
 */

import { useEffect, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';

export default function GoogleShoppingFeed() {
  const { store, tenantDb } = useStore();
  const [feedXml, setFeedXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store && tenantDb) {
      generateFeed();
    }
  }, [store, tenantDb]);

  const generateFeed = async () => {
    if (!store || !tenantDb) return;

    try {
      console.log(`📦 Generating Google Shopping feed for: ${store.name}`);

      // Get active products from tenant database
      const { data: products, error } = await tenantDb
        .from('products')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          compare_at_price,
          inventory_quantity,
          sku,
          vendor,
          product_type,
          weight,
          weight_unit,
          product_images (image_url),
          categories (name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      console.log(`✅ Found ${products?.length || 0} products`);

      // Generate XML
      const baseUrl = store.subdomain 
        ? `https://${store.subdomain}.myaurelio.com`
        : window.location.origin;

      const items = (products || []).map(product => {
        const images = product.product_images?.map(img => img.image_url).filter(Boolean) || [];
        const mainImage = images[0] || '';
        const additionalImages = images.slice(1, 11);
        const category = product.categories?.[0]?.name || product.product_type || 'General';

        return `
    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.name.substring(0, 150)}]]></g:title>
      <g:description><![CDATA[${(product.description || product.name).substring(0, 5000)}]]></g:description>
      <g:link>${baseUrl}/products/${product.slug}</g:link>
      <g:image_link>${mainImage}</g:image_link>
      ${additionalImages.map(img => `<g:additional_image_link>${img}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${product.inventory_quantity > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${product.price} EUR</g:price>
      ${product.compare_at_price ? `<g:sale_price>${product.price} EUR</g:sale_price>` : ''}
      <g:brand>${product.vendor || store.name}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${category}</g:product_type>
      <g:google_product_category>${getGoogleCategory(category)}</g:google_product_category>
      ${product.sku ? `<g:mpn>${product.sku}</g:mpn>` : ''}
      ${product.weight ? `<g:shipping_weight>${product.weight} ${product.weight_unit || 'kg'}</g:shipping_weight>` : ''}
    </item>`;
      }).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${store.name} Product Feed</title>
    <link>${baseUrl}</link>
    <description>Google Shopping feed for ${store.name}</description>
${items}
  </channel>
</rss>`;

      setFeedXml(xml);
      console.log('✅ Feed generated successfully');
    } catch (error) {
      console.error('❌ Error generating feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGoogleCategory = (categoryName: string): string => {
    const categoryMap: Record<string, string> = {
      'fashion': '166',
      'clothing': '166',
      'electronics': '222',
      'home': '536',
      'furniture': '436',
      'beauty': '469',
      'sports': '499',
      'food': '428',
    };

    const key = Object.keys(categoryMap).find(k => 
      categoryName?.toLowerCase().includes(k)
    );

    return categoryMap[key || ''] || '1';
  };

  // Return XML with proper content type
  useEffect(() => {
    if (feedXml) {
      // Set proper headers via meta tag
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Type';
      meta.content = 'application/xml; charset=utf-8';
      document.head.appendChild(meta);
    }
  }, [feedXml]);

  if (loading) {
    return (
      <div style={{ fontFamily: 'monospace', padding: '20px' }}>
        <p>Generating feed...</p>
      </div>
    );
  }

  if (!feedXml) {
    return (
      <div style={{ fontFamily: 'monospace', padding: '20px' }}>
        <p>Error: Feed not available</p>
      </div>
    );
  }

  return (
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
      {feedXml}
    </pre>
  );
}
