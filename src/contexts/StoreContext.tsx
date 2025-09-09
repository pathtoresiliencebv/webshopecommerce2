import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useLocation } from 'react-router-dom';

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
  loading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
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
    
    // Check if we have a valid custom subdomain
    // Ignore localhost, Lovable sandbox hostnames (UUID pattern), and direct domain access
    if (parts.length > 2 && hostname !== 'localhost') {
      const potentialSubdomain = parts[0];
      
      // Check if it's a Lovable sandbox hostname (UUID pattern or id-preview pattern)
      const isLovableSandbox = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|id-preview--[0-9a-f-]+)$/i.test(potentialSubdomain);
      
      if (!isLovableSandbox) {
        console.log('🏪 Detected custom subdomain:', potentialSubdomain);
        setSubdomain(potentialSubdomain);
      } else {
        console.log('🔧 Ignoring Lovable sandbox hostname:', hostname);
        setSubdomain(null);
      }
    } else {
      console.log('🏠 No custom subdomain detected, will use default store');
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

        // Filter by subdomain, slug, or fallback to default store
        if (subdomain) {
          console.log('🔍 Looking for store with subdomain:', subdomain);
          query = query.eq('subdomain', subdomain);
        } else if (storeSlug) {
          console.log('🔍 Looking for store with slug:', storeSlug);
          query = query.eq('slug', storeSlug);
        } else {
          // Fallback to default store when no subdomain or slug
          console.log('🔍 Using fallback: looking for default-store');
          query = query.eq('slug', 'default-store');
        }

        const { data, error: fetchError } = await query.maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('Store not found');
          setStore(null);
        } else {
          setStore(data);
        }
      } catch (err) {
        console.error('Error fetching store:', err);
        setError('Failed to load store');
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeSlug, subdomain]);

  const value = {
    store,
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