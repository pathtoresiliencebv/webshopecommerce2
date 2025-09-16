import React from 'react';
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

interface OrganizationSwitcherProps {
  onCreateNew?: () => void;
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({ onCreateNew }) => {
  const { currentOrganization, userOrganizations, switchOrganization, loading } = useOrganization();

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        Laden...
      </Button>
    );
  }

  if (!currentOrganization) {
    return (
      <Button variant="outline" onClick={onCreateNew}>
        <Plus className="h-4 w-4 mr-2" />
        Maak Store
      </Button>
    );
  }

  const getSubscriptionBadgeVariant = (status: string) => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto justify-between">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            <span className="truncate max-w-[150px]">{currentOrganization.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Huidige Store</DropdownMenuLabel>
        <DropdownMenuItem className="flex-col items-start p-3">
          <div className="font-medium">{currentOrganization.name}</div>
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
          {currentOrganization.subscription_status === 'trial' && (
            <div className="text-xs text-muted-foreground mt-1">
              Trial eindigt: {new Date(currentOrganization.trial_ends_at || '').toLocaleDateString('nl-NL')}
            </div>
          )}
        </DropdownMenuItem>
        
        {userOrganizations.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Wissel van Store</DropdownMenuLabel>
            {userOrganizations
              .filter(orgUser => orgUser.organization_id !== currentOrganization.id)
              .map((orgUser) => (
                 <DropdownMenuItem
                   key={orgUser.organization_id}
                   onClick={() => {
                     // If the organization has a subdomain, redirect to it
                     if (orgUser.organization.subdomain) {
                       window.location.href = `${window.location.protocol}//${orgUser.organization.subdomain}.myaurelio.com/admin`;
                     } else {
                       switchOrganization(orgUser.organization_id);
                     }
                   }}
                   className="flex-col items-start"
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
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Store Maken
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSwitcher;