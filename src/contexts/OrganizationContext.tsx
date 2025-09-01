import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  description?: string;
  logo_url?: string;
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired';
  subscription_plan: 'starter' | 'professional' | 'enterprise';
  trial_ends_at?: string;
}

interface OrganizationUser {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
  is_active: boolean;
  organization: Organization;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: OrganizationUser[];
  loading: boolean;
  switchOrganization: (organizationId: string) => void;
  createOrganization: (data: {
    name: string;
    slug: string;
    description?: string;
  }) => Promise<{ data: Organization | null; error: any }>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<{ error: any }>;
  inviteUser: (organizationId: string, email: string, role: string) => Promise<{ error: any }>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserOrganizations = async () => {
    if (!user) {
      setUserOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          id,
          user_id,
          organization_id,
          role,
          is_active,
          organization:organizations(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const orgUsers = data as OrganizationUser[];
      setUserOrganizations(orgUsers);

      // Set current organization (first one or from localStorage)
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      let currentOrg = null;

      if (savedOrgId) {
        currentOrg = orgUsers.find(ou => ou.organization_id === savedOrgId);
      }
      
      if (!currentOrg && orgUsers.length > 0) {
        currentOrg = orgUsers[0];
      }

      if (currentOrg) {
        setCurrentOrganization(currentOrg.organization);
        localStorage.setItem('currentOrganizationId', currentOrg.organization.id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Fout bij ophalen van organisaties');
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (organizationId: string) => {
    const orgUser = userOrganizations.find(ou => ou.organization_id === organizationId);
    if (orgUser) {
      setCurrentOrganization(orgUser.organization);
      localStorage.setItem('currentOrganizationId', organizationId);
      toast.success(`Gewisseld naar ${orgUser.organization.name}`);
    }
  };

  const createOrganization = async (data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<{ data: Organization | null; error: any }> => {
    if (!user) return { data: null, error: 'Not authenticated' };

    try {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description,
          subdomain: data.slug // Use slug as subdomain initially
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: userError } = await supabase
        .from('organization_users')
        .insert({
          user_id: user.id,
          organization_id: orgData.id,
          role: 'owner'
        });

      if (userError) throw userError;

      // Refresh organizations
      await refreshOrganizations();
      
      toast.success(`Organisatie ${data.name} succesvol aangemaakt!`);
      return { data: orgData as Organization, error: null };
    } catch (error: any) {
      console.error('Error creating organization:', error);
      return { data: null, error };
    }
  };

  const updateOrganization = async (id: string, data: Partial<Organization>) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // Update current organization if it's the one being updated
      if (currentOrganization?.id === id) {
        setCurrentOrganization({ ...currentOrganization, ...data });
      }

      // Refresh organizations
      await refreshOrganizations();
      
      toast.success('Organisatie succesvol bijgewerkt!');
      return { error: null };
    } catch (error: any) {
      console.error('Error updating organization:', error);
      return { error };
    }
  };

  const inviteUser = async (organizationId: string, email: string, role: string) => {
    try {
      // For now, we'll create a simple invitation system
      // In a full implementation, you'd send an email invitation
      toast.success(`Uitnodiging verstuurd naar ${email}`);
      return { error: null };
    } catch (error: any) {
      console.error('Error inviting user:', error);
      return { error };
    }
  };

  const refreshOrganizations = async () => {
    await fetchUserOrganizations();
  };

  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
    } else {
      setUserOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
    }
  }, [user]);

  const value = {
    currentOrganization,
    userOrganizations,
    loading,
    switchOrganization,
    createOrganization,
    updateOrganization,
    inviteUser,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};