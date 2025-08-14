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
          console.log(`Found text with selector "${selector}":`, element.textContent.trim());
          return element.textContent.trim();
        }
      }
      return '';
    };

    const extractPrice = (text: string) => {
      console.log('Extracting price from text:', text);
      
      // Clean the text: remove common words and extra spaces
      const cleanText = text
        .replace(/vanaf|from|starting|per stuk|each|incl\.|btw|vat/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // European format: €75,95 or 75,95 or 75.95
      const europeanMatch = cleanText.match(/€?\s*(\d{1,3}(?:\.\d{3})*),(\d{2})/);
      if (europeanMatch) {
        const price = parseFloat(europeanMatch[1].replace(/\./g, '') + '.' + europeanMatch[2]);
        console.log('European format price found:', price);
        return price;
      }
      
      // US format: $75.95 or 75.95
      const usMatch = cleanText.match(/\$?\s*(\d{1,3}(?:,\d{3})*)\.(\d{2})/);
      if (usMatch) {
        const price = parseFloat(usMatch[1].replace(/,/g, '') + '.' + usMatch[2]);
        console.log('US format price found:', price);
        return price;
      }
      
      // Simple number format: 75 or 75.95 or 75,95
      const simpleMatch = cleanText.match(/(\d+)([.,](\d{1,2}))?/);
      if (simpleMatch) {
        const integerPart = simpleMatch[1];
        const decimalPart = simpleMatch[3] || '00';
        const price = parseFloat(integerPart + '.' + decimalPart.padEnd(2, '0'));
        console.log('Simple format price found:', price);
        return price;
      }
      
      console.log('No price pattern matched');
      return 0;
    };

    // Common selectors for product information with website-specific patterns
    const name = extractText([
      // Shopify selectors
      '.product__title',
      '.product-form__title',
      'h1.product-single__title',
      // Generic e-commerce
      'h1[data-testid="product-title"]',
      'h1.product-title',
      'h1#product-title',
      '.product-name h1',
      '.product-title',
      'h1',
      '[data-cy="product-name"]',
      '.pdp-product-name',
      // WooCommerce
      '.product_title',
      '.entry-title'
    ]);

    const priceText = extractText([
      // Shopify price selectors
      '.product__price',
      '.price__current',
      '.product-form__price',
      '.product-single__price',
      // Generic e-commerce
      '[data-testid="price-current"]',
      '.price-current',
      '.current-price',
      '.price',
      '.product-price',
      '[data-cy="price"]',
      '.price-now',
      // WooCommerce
      '.woocommerce-Price-amount',
      '.price .amount',
      '.product-price-value'
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

    // Extract images with quality filtering and prioritization
    const extractImages = () => {
      const imageSelectors = [
        // Shopify main product images
        '.product__media img',
        '.product-single__photo img',
        '.product__photo img',
        // Generic main product images (highest priority)
        '.product-image-main img',
        '.main-product-image img',
        '[data-testid="product-image"] img',
        // Gallery images
        '.product-gallery img',
        '.product-thumbnails img',
        '.product-images img',
        // General product images
        'img[src*="product"]',
        'img[alt*="product"]',
        '.product img',
        // Fallback
        'img'
      ];

      const foundImages: { url: string; width: number; priority: number }[] = [];
      
      imageSelectors.forEach((selector, priority) => {
        const elements = doc.querySelectorAll(selector);
        console.log(`Selector "${selector}" found ${elements.length} images`);
        
        elements.forEach((img: any) => {
          const src = img.getAttribute('src') || 
                     img.getAttribute('data-src') || 
                     img.getAttribute('data-original') ||
                     img.getAttribute('srcset')?.split(' ')[0];
          
          if (src && !src.includes('data:image') && !src.includes('placeholder')) {
            // Convert relative URLs to absolute
            const imageUrl = src.startsWith('http') ? src : new URL(src, url).href;
            
            // Extract width from URL parameters or attributes
            const width = parseInt(img.getAttribute('width') || '0') || 
                         parseInt(imageUrl.match(/width=(\d+)/)?.[1] || '0') ||
                         parseInt(imageUrl.match(/w_(\d+)/)?.[1] || '0') ||
                         300; // default width
            
            // Skip small images (likely thumbnails/icons)
            if (width >= 200) {
              foundImages.push({ url: imageUrl, width, priority });
            }
          }
        });
      });

      // Remove duplicates and sort by priority and quality
      const uniqueImages = foundImages.filter((img, index, arr) => 
        arr.findIndex(i => i.url === img.url) === index
      );

      // Sort by priority (lower is better) and width (higher is better)
      uniqueImages.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.width - a.width;
      });

      const finalImages = uniqueImages.slice(0, 10).map(img => img.url);
      console.log(`Selected ${finalImages.length} images:`, finalImages);
      
      return finalImages;
    };

    const images = extractImages();

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