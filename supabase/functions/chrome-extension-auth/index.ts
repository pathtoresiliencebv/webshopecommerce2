import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  email: string;
  password: string;
  organization_id?: string;
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

    if (req.method === 'POST') {
      const { email, password, organization_id }: AuthRequest = await req.json();

      console.log('Chrome extension auth request:', { email, organization_id });

      // Authenticate the user
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error('Authentication failed:', authError);
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if user has access to the organization and required permissions
      const { data: orgAccess, error: orgError } = await supabaseClient
        .from('organization_users')
        .select('role, organization_id')
        .eq('user_id', authData.user.id)
        .eq('organization_id', organization_id || '')
        .eq('is_active', true)
        .single();

      if (orgError || !orgAccess) {
        console.error('Organization access check failed:', orgError);
        return new Response(
          JSON.stringify({ error: 'Access denied to organization' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if user has admin/manager/owner role
      const allowedRoles = ['owner', 'admin', 'manager'];
      if (!allowedRoles.includes(orgAccess.role)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Generate Chrome extension token
      const { data: tokenGenerated, error: tokenError } = await supabaseClient
        .rpc('generate_chrome_extension_token');

      if (tokenError || !tokenGenerated) {
        console.error('Token generation failed:', tokenError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate token' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Store the token hash in database
      const tokenHash = await crypto.subtle.digest(
        'SHA-256', 
        new TextEncoder().encode(tokenGenerated)
      );
      const tokenHashHex = Array.from(new Uint8Array(tokenHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error: insertError } = await supabaseClient
        .from('chrome_extension_tokens')
        .insert({
          organization_id: orgAccess.organization_id,
          user_id: authData.user.id,
          token_hash: tokenHashHex,
          name: `Chrome Extension - ${new Date().toISOString()}`,
          permissions: ['import:products', 'import:shein'],
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (insertError) {
        console.error('Token storage failed:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store token' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Chrome extension token generated successfully');

      return new Response(
        JSON.stringify({
          token: tokenGenerated,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            role: orgAccess.role,
          },
          organization_id: orgAccess.organization_id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate existing token
    if (req.method === 'GET') {
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

      // Validate token
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('chrome_extension_tokens')
        .select(`
          *,
          organizations (
            id,
            name,
            slug
          )
        `)
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

      // Update last used timestamp
      await supabaseClient
        .from('chrome_extension_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      return new Response(
        JSON.stringify({
          valid: true,
          token_id: tokenData.id,
          user_id: tokenData.user_id,
          organization: tokenData.organizations,
          permissions: tokenData.permissions,
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
    console.error('Chrome extension auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});