import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useLocation } from 'react-router-dom';
import { getTenantDatabase, clearTenantCache } from '@/lib/tenant-database';
import { SupabaseClient } from '@supabase/supabase-js';

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  subdomain?: string;
  domain?: string;
}

interface StoreContextType {
  store: Store | null;
  tenantDb: SupabaseClient | null; // 🆕 Tenant-specific database client
  loading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [tenantDb, setTenantDb] = useState<SupabaseClient | null>(null); // 🆕 Tenant database
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { storeSlug } = useParams();
  const location = useLocation();
  
  // Detect subdomain client-side
  const [subdomain, setSubdomain] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract subdomain from current hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    console.log('🔍 DNS Debug Info:');
    console.log('  - Hostname:', hostname);
    console.log('  - Parts:', parts);
    console.log('  - Parts length:', parts.length);
    
    // Check if we have a valid custom subdomain
    // Support both .myaurelio.com and custom domains
    // Ignore localhost, Lovable sandbox hostnames (UUID pattern), and direct domain access
    if (parts.length > 2 && hostname !== 'localhost') {
      const potentialSubdomain = parts[0];
      
      // Check if it's a Lovable sandbox hostname (UUID pattern or id-preview pattern)
      const isLovableSandbox = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|id-preview--[0-9a-f-]+)$/i.test(potentialSubdomain);
      
      // Check if it's a myaurelio.com subdomain
      const isMyAurelioSubdomain = hostname.endsWith('.myaurelio.com');
      
      console.log('  - Potential subdomain:', potentialSubdomain);
      console.log('  - Is Lovable sandbox:', isLovableSandbox);
      console.log('  - Is myaurelio subdomain:', isMyAurelioSubdomain);
      
      if (!isLovableSandbox && (isMyAurelioSubdomain || parts.length > 2)) {
        console.log('🏪 ✅ Detected valid subdomain:', potentialSubdomain);
        setSubdomain(potentialSubdomain);
      } else {
        console.log('🔧 ❌ Ignoring sandbox/invalid hostname:', hostname);
        setSubdomain(null);
      }
    } else {
      console.log('🏠 ❌ No custom subdomain detected (parts.length <= 2), will use default store');
      setSubdomain(null);
    }
  }, []);

  // Fetch store data when storeSlug or subdomain changes
  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('organizations')
          .select('id, name, slug, description, logo_url, subdomain, domain');

        let searchType = '';
        let searchValue = '';

        // Filter by subdomain, slug, or fallback to default store
        if (subdomain) {
          console.log('🔍 Looking for store with subdomain:', subdomain);
          // Try exact match first, then flexible matching
          const { data: exactMatch, error: exactError } = await supabase
            .from('organizations')
            .select('id, name, slug, description, logo_url, subdomain, domain')
            .eq('subdomain', subdomain)
            .maybeSingle();
          
          if (exactMatch) {
            console.log('✅ Found exact subdomain match:', exactMatch);
            setStore(exactMatch);
            setError(null);
            setLoading(false);
            return;
          }
          
          // Try flexible matching (aurelioliving -> aurelio-living)
          const normalizedSubdomain = subdomain.replace(/[-_]/g, '');
          const { data: flexibleData, error: flexibleError } = await supabase
            .from('organizations')
            .select('id, name, slug, description, logo_url, subdomain, domain');
          
          if (flexibleData) {
            const flexibleMatch = flexibleData.find(org => 
              org.subdomain?.replace(/[-_]/g, '') === normalizedSubdomain ||
              org.slug?.replace(/[-_]/g, '') === normalizedSubdomain
            );
            
            if (flexibleMatch) {
              console.log('✅ Found flexible subdomain match:', flexibleMatch);
              setStore(flexibleMatch);
              setError(null);
              setLoading(false);
              return;
            }
          }
          
          searchType = 'subdomain';
          searchValue = subdomain;
        } else if (storeSlug) {
          console.log('🔍 Looking for store with slug:', storeSlug);
          query = query.eq('slug', storeSlug);
          searchType = 'slug';
          searchValue = storeSlug;
        } else {
          // Fallback to aurelioliving store when no subdomain or slug
          console.log('🔍 Using fallback: looking for aurelioliving subdomain');
          query = query.eq('subdomain', 'aurelioliving');
          searchType = 'fallback';
          searchValue = 'aurelioliving';
        }

        // Only continue with original query if subdomain didn't find a match
        if (subdomain) {

          // Fallback to aurelioliving if subdomain search didn't find anything
          console.log('🔄 Subdomain not found, trying aurelioliving fallback');
          query = supabase
            .from('organizations')
            .select('id, name, slug, description, logo_url, subdomain, domain')
            .eq('subdomain', 'aurelioliving');
          searchType = 'fallback';
          searchValue = 'aurelioliving';
        }

        const { data, error: fetchError } = await query.maybeSingle();

        if (fetchError) {
          console.error(`❌ Database error when searching by ${searchType}:`, fetchError);
          throw fetchError;
        }

        if (!data) {
          console.warn(`⚠️ No store found for ${searchType}: ${searchValue}`);
          
          // If we're not already trying the fallback, try aurelioliving
          if (searchType !== 'fallback') {
            console.log('🔄 Attempting fallback to aurelioliving subdomain');
            const fallbackQuery = supabase
              .from('organizations')
              .select('id, name, slug, description, logo_url, subdomain, domain')
              .eq('subdomain', 'aurelioliving');

            const { data: fallbackData, error: fallbackError } = await fallbackQuery.maybeSingle();
            
            if (fallbackError) {
              console.error('❌ Fallback query failed:', fallbackError);
              throw fallbackError;
            }
            
            if (fallbackData) {
              console.log('✅ Successfully loaded fallback store:', fallbackData);
              setStore(fallbackData);
              setError(null);
            } else {
              console.error('❌ Even fallback store not found');
              setError('Store not found');
              setStore(null);
            }
          } else {
            console.error('❌ Fallback store itself not found');
            setError('Store not found');
            setStore(null);
          }
        } else {
          console.log(`✅ Successfully loaded store via ${searchType}:`, data);
          setStore(data);
          setError(null);
        }
      } catch (err) {
        console.error('💥 Critical error in store fetching:', err);
        
        // Last resort: try to load aurelioliving
        try {
          console.log('🚨 Attempting emergency fallback to aurelioliving subdomain');
          const emergencyQuery = supabase
            .from('organizations')
            .select('id, name, slug, description, logo_url, subdomain, domain')
            .eq('subdomain', 'aurelioliving');
            
          const { data: emergencyData } = await emergencyQuery.maybeSingle();
          
          if (emergencyData) {
            console.log('🆘 Emergency fallback successful:', emergencyData);
            setStore(emergencyData);
            setError(null);
          } else {
            console.error('🆘 Emergency fallback failed - no default store');
            setError('Failed to load store');
            setStore(null);
          }
        } catch (emergencyErr) {
          console.error('🆘 Emergency fallback error:', emergencyErr);
          setError('Failed to load store');
          setStore(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeSlug, subdomain]);

  // 🆕 Initialize tenant database when store changes
  useEffect(() => {
    const initializeTenantDatabase = async () => {
      if (!store?.id) {
        setTenantDb(null);
        return;
      }
      
      try {
        console.log(`🔄 Initializing tenant database for store: ${store.name}`);
        const db = await getTenantDatabase(store.id);
        setTenantDb(db);
        console.log(`✅ Tenant database ready for: ${store.name}`);
      } catch (error) {
        console.error('Failed to initialize tenant database:', error);
        setError('Failed to connect to store database');
        setTenantDb(null);
      }
    };

    initializeTenantDatabase();

    // Cleanup: Clear cache when store changes
    return () => {
      if (store?.id) {
        clearTenantCache(store.id);
      }
    };
  }, [store?.id]);

  const value = {
    store,
    tenantDb, // 🆕 Expose tenant database to all components
    loading,
    error
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};