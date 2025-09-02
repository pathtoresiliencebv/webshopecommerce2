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
    
    // Check if we have a subdomain (more than 2 parts and not localhost)
    if (parts.length > 2 && hostname !== 'localhost') {
      setSubdomain(parts[0]);
    } else {
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
          query = query.eq('subdomain', subdomain);
        } else if (storeSlug) {
          query = query.eq('slug', storeSlug);
        } else {
          // Fallback to default store when no subdomain or slug
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