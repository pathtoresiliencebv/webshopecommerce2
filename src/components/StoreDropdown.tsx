import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

// Create a safe hook that doesn't throw when StoreProvider is missing
const useSafeStore = () => {
  try {
    const { useStore } = require("@/contexts/StoreContext");
    return useStore();
  } catch {
    return { store: null, loading: false, error: null };
  }
};

const StoreDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { store } = useSafeStore();
  
  // Only use organization context for logged-in users
  const orgContext = user ? useOrganization() : null;
  const { currentOrganization, userOrganizations, switchOrganization, loading } = orgContext || { 
    currentOrganization: null, 
    userOrganizations: [], 
    switchOrganization: () => {}, 
    loading: false 
  };

  // Always ensure "Aurelio Living" is available, prioritize current organization
  const displayStore = currentOrganization || store || { 
    id: 'aurelio-living', 
    name: 'Aurelio Living', 
    slug: 'aurelio-living' 
  };

  const handleStoreSelect = (organization: any) => {
    if (user && orgContext) {
      // For logged-in users, switch organization and navigate
      switchOrganization(organization.id);
    }
    
    // Navigate to the store
    if (organization.slug === 'aurelio-living') {
      navigate('/');
    } else {
      navigate(`/store/${organization.slug}`);
    }
  };

  const handleCreateNew = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/admin/stores');
  };

  const getSubscriptionBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'cancelled':
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/5bed22df-c30a-4560-9108-fdc16061338b.png" 
          alt="Aurelio Living" 
          className="h-8 w-auto"
        />
      </div>
    );
  }

  // For non-logged-in users, show only static logo (no dropdown)
  if (!user) {
    return (
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/aurelio-living-logo-new.png" 
          alt="Aurelio Living" 
          className="h-8 w-auto"
        />
      </div>
    );
  }

  // For logged-in users, show full dropdown functionality
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 hover:bg-transparent">
          <div className="flex items-center">
            {displayStore.logo_url ? (
              <img 
                src={displayStore.logo_url} 
                alt={displayStore.name} 
                className="h-8 w-auto mr-2"
              />
            ) : (
              <img 
                src="/lovable-uploads/aurelio-living-logo-new.png" 
                alt="Aurelio Living" 
                className="h-8 w-auto mr-2"
              />
            )}
            <div className="hidden sm:flex flex-col items-start">
              <span className="font-semibold text-sm leading-none">{displayStore.name}</span>
              {currentOrganization?.subscription_status && (
                <Badge variant={getSubscriptionBadgeVariant(currentOrganization.subscription_status)} className="mt-1 text-xs">
                  {currentOrganization.subscription_status === 'trial' ? 'Trial' : 
                   currentOrganization.subscription_status === 'active' ? 'Pro' : 
                   currentOrganization.subscription_status}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-72 bg-background border shadow-lg">
        <DropdownMenuLabel>Huidige Winkel</DropdownMenuLabel>
        <DropdownMenuItem className="flex-col items-start p-3 cursor-default">
          <div className="font-medium">{displayStore.name}</div>
          {user && currentOrganization && (
            <>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getSubscriptionBadgeVariant(currentOrganization.subscription_status)}>
                  {currentOrganization.subscription_status === 'trial' ? 'Trial' : 
                   currentOrganization.subscription_status === 'active' ? 'Actief' :
                   currentOrganization.subscription_status === 'cancelled' ? 'Geannuleerd' : 'Verlopen'}
                </Badge>
                <Badge variant="outline">
                  {currentOrganization.subscription_plan}
                </Badge>
              </div>
              {currentOrganization.subscription_status === 'trial' && currentOrganization.trial_ends_at && (
                <div className="text-xs text-muted-foreground mt-1">
                  Trial eindigt: {new Date(currentOrganization.trial_ends_at).toLocaleDateString('nl-NL')}
                </div>
              )}
            </>
          )}
        </DropdownMenuItem>
        
        {user && userOrganizations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Beschikbare Winkels</DropdownMenuLabel>
            {userOrganizations
              .filter(orgUser => orgUser.organization_id !== currentOrganization?.id)
              .map((orgUser) => (
                <DropdownMenuItem
                  key={orgUser.organization_id}
                  onClick={() => handleStoreSelect(orgUser.organization)}
                  className="flex-col items-start cursor-pointer hover:bg-muted"
                >
                  <div className="font-medium">{orgUser.organization.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {orgUser.role}
                    </Badge>
                    <Badge variant={getSubscriptionBadgeVariant(orgUser.organization.subscription_status)}>
                      {orgUser.organization.subscription_status}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
          </>
        )}
        
        {/* Always show Aurelio Living if user has access to multiple stores or it's not current */}
        {user && currentOrganization?.slug !== 'aurelio-living' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStoreSelect({ id: 'aurelio-living', name: 'Aurelio Living', slug: 'aurelio-living' })}
              className="cursor-pointer hover:bg-muted"
            >
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/5bed22df-c30a-4560-9108-fdc16061338b.png" 
                  alt="Aurelio Living" 
                  className="h-6 w-auto mr-3"
                />
                <div>
                  <div className="font-medium">Aurelio Living</div>
                  <div className="text-xs text-muted-foreground">Hoofdwinkel</div>
                </div>
              </div>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateNew} className="cursor-pointer hover:bg-muted">
          <Plus className="h-4 w-4 mr-2" />
          {user ? 'Nieuwe Winkel Maken' : 'Inloggen voor Nieuwe Winkel'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StoreDropdown;