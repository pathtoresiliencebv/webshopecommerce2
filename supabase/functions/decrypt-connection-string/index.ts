// =====================================================
// DECRYPT CONNECTION STRING
// Decrypts tenant database connection strings
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DecryptRequest {
  encryptedString: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { encryptedString }: DecryptRequest = await req.json();

    if (!encryptedString) {
      throw new Error('Encrypted string is required');
    }

    // Decrypt the connection string
    const decrypted = await decryptConnectionString(encryptedString);

    return new Response(
      JSON.stringify({
        success: true,
        connectionString: decrypted,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Decryption error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to decrypt connection string',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Decrypt connection string
 * 🔒 IMPORTANT: This matches the encryption in provision-tenant-database
 */
async function decryptConnectionString(encrypted: string): Promise<string> {
  // TODO: Implement proper decryption matching your encryption method
  // This is a PLACEHOLDER matching the base64 encoding
  
  try {
    const decoded = atob(encrypted);
    const bytes = new Uint8Array(decoded.split('').map(char => char.charCodeAt(0)));
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (error) {
    throw new Error('Failed to decrypt connection string');
  }
}

console.log('🔓 Decrypt Connection String function loaded');
