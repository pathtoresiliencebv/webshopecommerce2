import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  subdomain?: string;
  domain?: string;
}

export default function CustomerStorefront() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [subdomain, setSubdomain] = useState<string | null>(null);

  // Detect subdomain on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Check if it's a subdomain (more than 2 parts and not localhost)
      if (parts.length > 2 && hostname !== 'localhost') {
        setSubdomain(parts[0]);
      }
    }
  }, []);

  // Fetch store data based on slug or subdomain
  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store-data', storeSlug, subdomain],
    queryFn: async (): Promise<StoreData | null> => {
      let query = supabase.from('organizations').select('*');
      
      if (subdomain) {
        query = query.eq('subdomain', subdomain);
      } else if (storeSlug) {
        query = query.eq('slug', storeSlug);
      } else {
        return null;
      }

      const { data, error } = await query.single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!(storeSlug || subdomain)
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Store laden...</p>
        </div>
      </div>
    );
  }

  // Error or store not found
  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Store niet gevonden</h1>
          <p className="text-muted-foreground">
            De opgevraagde store bestaat niet of is niet beschikbaar.
          </p>
        </div>
      </div>
    );
  }

  // Redirect if accessing via slug but store has subdomain
  if (storeSlug && store.subdomain && !subdomain) {
    window.location.href = `${window.location.protocol}//${store.subdomain}.${window.location.host}`;
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Store-specific navigation */}
      <Navigation />
      
      {/* Store content */}
      <main className="container mx-auto py-6 px-4">
        {/* Hero Section */}
        <section className="text-center py-12 space-y-4">
          <h1 className="text-4xl font-bold">{store.name}</h1>
          {store.description && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {store.description}
            </p>
          )}
        </section>

        {/* Store-specific product grid would go here */}
        <section className="py-12">
          <div className="text-center py-20 border border-dashed border-muted-foreground/30 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Welkom bij {store.name}</h2>
            <p className="text-muted-foreground">
              Deze store wordt momenteel ingericht. Kom binnenkort terug!
            </p>
          </div>
        </section>
      </main>

      {/* Store-specific footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center text-muted-foreground">
            <p>© 2024 {store.name}. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}