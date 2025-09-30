/**
 * USE STORE BRANDING
 * Hook to get dynamic store branding (logo, colors, contact info)
 * Used across the platform for consistent store branding
 */

import { useStore } from '@/contexts/StoreContext';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface StoreBranding {
  logo: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export function useStoreBranding(): StoreBranding {
  const { store } = useStore();
  const { currentOrganization } = useOrganization();

  // Use store context (for storefront) or currentOrganization (for admin)
  const activeStore = store || currentOrganization;

  // Default branding (fallback)
  const defaultBranding: StoreBranding = {
    logo: '/lovable-uploads/aurelio-living-logo-new.png',
    name: 'Aurelio',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    accentColor: '#FF6B6B',
    email: 'info@myaurelio.com',
    phone: '+31 20 123 4567',
    website: 'https://myaurelio.com',
    address: '',
    city: '',
    postalCode: '',
    country: 'Netherlands',
  };

  if (!activeStore) {
    return defaultBranding;
  }

  // Return store-specific branding
  return {
    logo: activeStore.logo_url || defaultBranding.logo,
    name: activeStore.name || defaultBranding.name,
    primaryColor: '#000000', // TODO: Get from theme_config when available
    secondaryColor: '#666666',
    accentColor: '#FF6B6B',
    email: activeStore.email || defaultBranding.email,
    phone: activeStore.phone || defaultBranding.phone,
    website: activeStore.website_url || defaultBranding.website,
    address: activeStore.address_line1 || defaultBranding.address,
    city: activeStore.city || defaultBranding.city,
    postalCode: activeStore.postal_code || defaultBranding.postalCode,
    country: activeStore.country || defaultBranding.country,
  };
}
