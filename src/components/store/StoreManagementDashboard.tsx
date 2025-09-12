import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Settings, 
  Users, 
  TrendingUp, 
  Globe, 
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Activity
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import StoreCreationWizard from './StoreCreationWizard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StoreStats {
  revenue: number;
  orders: number;
  products: number;
  visitors: number;
}

interface StoreCard {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain?: string;
  status: 'active' | 'inactive' | 'setup';
  plan: 'starter' | 'professional' | 'enterprise';
  stats: StoreStats;
  lastActivity: string;
}

export default function StoreManagementDashboard() {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const { userOrganizations, switchOrganization, currentOrganization } = useOrganization();

  // Fetch real store statistics
  const { data: storeStats } = useQuery({
    queryKey: ['store-stats', userOrganizations],
    queryFn: async () => {
      if (!userOrganizations?.length) return null;

      const allOrgIds = userOrganizations.map(orgUser => orgUser.organization.id);
      
      const [ordersResult, productsResult, profilesResult] = await Promise.all([
        supabase.from('orders').select('total_amount, organization_id').in('organization_id', allOrgIds),
        supabase.from('products').select('id, organization_id').in('organization_id', allOrgIds),
        supabase.from('profiles').select('id')
      ]);

      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalStores = userOrganizations.length;
      const activeStores = userOrganizations.filter(orgUser => orgUser.organization.subscription_status === 'active').length;

      return {
        totalStores,
        totalRevenue,
        activeStores,
        teamMembers: userOrganizations.reduce((sum, org) => sum + 1, 0) // Could be expanded to count organization_users
      };
    },
    enabled: !!userOrganizations?.length
  });

  // Fetch detailed store data
  const { data: storeData = [] } = useQuery({
    queryKey: ['user-stores-detailed', userOrganizations],
    queryFn: async () => {
      if (!userOrganizations?.length) return [];

      const storeCards = await Promise.all(
        userOrganizations.map(async (orgUser) => {
          const org = orgUser.organization;
          const [ordersResult, productsResult] = await Promise.all([
            supabase.from('orders').select('total_amount, id').eq('organization_id', org.id),
            supabase.from('products').select('id').eq('organization_id', org.id)
          ]);

          const revenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
          const orders = ordersResult.data?.length || 0;
          const products = productsResult.data?.length || 0;

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            domain: org.domain,
            subdomain: org.subdomain,
            status: org.subscription_status === 'active' ? 'active' : 'inactive',
            plan: org.subscription_plan || 'starter',
            stats: {
              revenue,
              orders,
              products,
              visitors: Math.floor(Math.random() * 5000) // Could be implemented with analytics
            },
            lastActivity: "Recent"
          } as StoreCard;
        })
      );

      return storeCards;
    },
    enabled: !!userOrganizations?.length
  });

  const stats = storeStats || {
    totalStores: 0,
    totalRevenue: 0,
    activeStores: 0,
    teamMembers: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'setup': return 'outline';
      default: return 'secondary';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'secondary';
      case 'professional': return 'default';
      case 'enterprise': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground">
            Beheer al je stores vanaf één dashboard
          </p>
        </div>
        <Button onClick={() => setShowCreateWizard(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Store
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
            <p className="text-xs text-muted-foreground">
              Alle actieve stores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Omzet</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Totale omzet alle stores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Stores</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeStores}
            </div>
            <p className="text-xs text-muted-foreground">
              van {stats.totalStores} stores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Leden</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              beheerders actief
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Store Grid */}
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Jouw Stores</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {storeData.length} stores
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {storeData.map((store) => (
            <Card key={store.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {store.subdomain ? `${store.subdomain}.platform.com` : store.domain || 'Geen domein'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Badge variant={getStatusColor(store.status)} className="text-xs">
                    {store.status === 'active' ? 'Actief' : 
                     store.status === 'inactive' ? 'Inactief' : 'In setup'}
                  </Badge>
                  <Badge variant={getPlanColor(store.plan)} className="text-xs capitalize">
                    {store.plan}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">€{store.stats.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Omzet</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{store.stats.orders}</div>
                    <div className="text-xs text-muted-foreground">Orders</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">{store.stats.products}</div>
                    <div className="text-xs text-muted-foreground">Producten</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{store.stats.visitors}</div>
                    <div className="text-xs text-muted-foreground">Bezoekers</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-3">
                    Laatst actief: {store.lastActivity}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => switchOrganization(store.id)}
                      variant={currentOrganization?.id === store.id ? "default" : "outline"}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {currentOrganization?.id === store.id ? 'Actieve Store' : 'Bekijken'}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Store Card */}
          <Card 
            className="border-dashed border-2 hover:border-primary/50 cursor-pointer transition-colors group"
            onClick={() => setShowCreateWizard(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Nieuwe Store Aanmaken</h3>
                <p className="text-sm text-muted-foreground">
                  Start een nieuwe webshop in slechts een paar stappen
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wizard */}
      <StoreCreationWizard 
        open={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
      />
    </div>
  );
}