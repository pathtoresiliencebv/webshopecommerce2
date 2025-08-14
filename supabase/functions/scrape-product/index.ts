import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Scraping product from:', url);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Extract product information using various selectors
    const extractText = (selectors: string[]) => {
      for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
      return '';
    };

    const extractPrice = (text: string) => {
      const priceMatch = text.match(/[\d,]+\.?\d*/);
      return priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;
    };

    // Common selectors for product information
    const name = extractText([
      'h1[data-testid="product-title"]',
      'h1.product-title',
      'h1#product-title',
      '.product-name h1',
      '.product-title',
      'h1',
      '[data-cy="product-name"]',
      '.pdp-product-name'
    ]);

    const priceText = extractText([
      '[data-testid="price-current"]',
      '.price-current',
      '.current-price',
      '.price',
      '.product-price',
      '[data-cy="price"]',
      '.price-now'
    ]);

    const description = extractText([
      '[data-testid="product-description"]',
      '.product-description',
      '.product-details',
      '.description',
      '[data-cy="product-description"]'
    ]);

    const shortDescription = extractText([
      '.product-short-description',
      '.product-summary',
      '.short-description'
    ]);

    // Extract images
    const imageElements = doc.querySelectorAll('img[src*="product"], img[alt*="product"], .product-image img, .product-gallery img');
    const images: string[] = [];
    
    imageElements.forEach((img: any) => {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src && !src.includes('data:image') && !images.includes(src)) {
        // Convert relative URLs to absolute
        const imageUrl = src.startsWith('http') ? src : new URL(src, url).href;
        images.push(imageUrl);
      }
    });

    const price = extractPrice(priceText);

    // Create SKU from name
    const sku = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20) : '';

    const product = {
      name: name || 'Scraped Product',
      sku,
      description: description || shortDescription,
      shortDescription: shortDescription || description?.substring(0, 200),
      price,
      originalPrice: price > 0 ? price * 1.2 : 0, // Assume 20% markup
      stockQuantity: 10, // Default stock
      category: 'general',
      tags: [],
      collections: [],
      isActive: true,
      isFeatured: false,
      isNew: true,
      isSale: false,
      metaTitle: name?.substring(0, 60) || '',
      metaDescription: (shortDescription || description)?.substring(0, 160) || '',
      weight: 1,
      dimensions: {
        length: '',
        width: '',
        height: ''
      },
      images
    };

    console.log('Scraped product:', product);

    return new Response(
      JSON.stringify({ success: true, product }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to scrape product' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});