import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheinProduct {
  id: string;
  url: string;
  name: string;
  price: number;
  original_price?: number;
  currency: string;
  description: string;
  images: string[];
  variants?: Array<{
    size?: string;
    color?: string;
    price?: number;
    stock?: number;
  }>;
  category?: string;
  tags?: string[];
  rating?: number;
  reviews_count?: number;
}

interface ImportRequest {
  products: SheinProduct[];
  import_settings?: {
    template_id?: string;
    auto_approve?: boolean;
    category_mapping?: Record<string, string>;
    price_adjustment?: {
      type: 'percentage' | 'fixed';
      value: number;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Validate Chrome extension token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Hash the provided token to compare with stored hash
    const tokenHash = await crypto.subtle.digest(
      'SHA-256', 
      new TextEncoder().encode(token)
    );
    const tokenHashHex = Array.from(new Uint8Array(tokenHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Validate token and get user/org info
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('chrome_extension_tokens')
      .select('*')
      .eq('token_hash', tokenHashHex)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error('Token validation failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'POST') {
      const { products, import_settings }: ImportRequest = await req.json();

      console.log(`Starting SHEIN import for ${products.length} products`);

      // Create import job
      const { data: importJob, error: jobError } = await supabaseClient
        .from('import_jobs')
        .insert({
          organization_id: tokenData.organization_id,
          user_id: tokenData.user_id,
          source_platform: 'shein',
          total_products: products.length,
          import_data: {
            settings: import_settings,
            source: 'chrome_extension',
            version: '1.0'
          },
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError || !importJob) {
        console.error('Failed to create import job:', jobError);
        return new Response(
          JSON.stringify({ error: 'Failed to create import job' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      let processedCount = 0;
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Process each product
      for (const product of products) {
        try {
          // Check if product already exists by URL or source ID
          const { data: existingProduct } = await supabaseClient
            .from('imported_products')
            .select('id')
            .eq('organization_id', tokenData.organization_id)
            .eq('source_url', product.url)
            .single();

          if (existingProduct) {
            console.log(`Product already exists: ${product.url}`);
            processedCount++;
            continue;
          }

          // Process price adjustments
          let adjustedPrice = product.price;
          if (import_settings?.price_adjustment) {
            const { type, value } = import_settings.price_adjustment;
            if (type === 'percentage') {
              adjustedPrice = product.price * (1 + value / 100);
            } else if (type === 'fixed') {
              adjustedPrice = product.price + value;
            }
          }

          // Prepare processed product data
          const processedData = {
            name: product.name,
            price: adjustedPrice,
            original_price: product.original_price || product.price,
            currency: product.currency || 'USD',
            description: product.description,
            images: product.images,
            category: product.category,
            tags: product.tags || [],
            rating: product.rating,
            reviews_count: product.reviews_count,
            variants: product.variants || [],
            source_platform: 'shein',
            import_date: new Date().toISOString(),
          };

          // Insert imported product record
          const { data: importedProduct, error: importError } = await supabaseClient
            .from('imported_products')
            .insert({
              import_job_id: importJob.id,
              organization_id: tokenData.organization_id,
              source_url: product.url,
              source_product_id: product.id,
              raw_data: product,
              processed_data: processedData,
              approval_status: import_settings?.auto_approve ? 'approved' : 'pending',
            })
            .select()
            .single();

          if (importError) {
            console.error(`Failed to import product ${product.id}:`, importError);
            errors.push(`Product ${product.id}: ${importError.message}`);
            failedCount++;
          } else {
            // If auto-approve is enabled, create the actual product
            if (import_settings?.auto_approve) {
              const { error: productError } = await supabaseClient
                .from('products')
                .insert({
                  organization_id: tokenData.organization_id,
                  name: processedData.name,
                  description: processedData.description,
                  price: processedData.price,
                  currency: processedData.currency,
                  images: processedData.images,
                  tags: processedData.tags,
                  is_active: true,
                  source_platform: 'shein',
                  source_url: product.url,
                });

              if (productError) {
                console.error(`Failed to create product ${product.id}:`, productError);
                errors.push(`Product creation ${product.id}: ${productError.message}`);
              } else {
                // Update imported product with product ID
                await supabaseClient
                  .from('imported_products')
                  .update({ 
                    product_id: importedProduct.id,
                    approved_at: new Date().toISOString(),
                    approved_by: tokenData.user_id,
                  })
                  .eq('id', importedProduct.id);
              }
            }
            successCount++;
          }

          processedCount++;

          // Update progress
          await supabaseClient.rpc('update_import_job_progress', {
            _job_id: importJob.id,
            _processed: processedCount,
            _successful: successCount,
            _failed: failedCount,
          });

        } catch (error) {
          console.error(`Error processing product ${product.id}:`, error);
          errors.push(`Product ${product.id}: ${error.message}`);
          failedCount++;
          processedCount++;
        }
      }

      // Update final job status
      const finalStatus = failedCount === 0 ? 'completed' : 
                         successCount > 0 ? 'completed' : 'failed';

      await supabaseClient
        .from('import_jobs')
        .update({
          status: finalStatus,
          error_log: errors,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importJob.id);

      console.log(`SHEIN import completed: ${successCount} successful, ${failedCount} failed`);

      return new Response(
        JSON.stringify({
          import_job_id: importJob.id,
          status: finalStatus,
          total_products: products.length,
          processed: processedCount,
          successful: successCount,
          failed: failedCount,
          errors: errors.slice(0, 10), // Limit error list
          auto_approved: import_settings?.auto_approve ? successCount : 0,
          pending_approval: import_settings?.auto_approve ? 0 : successCount,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('SHEIN import error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});