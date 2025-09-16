import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Users, Package, BarChart3, Calendar, Loader2 } from 'lucide-react';

export function AdminSubscription() {
  const { currentOrganization } = useOrganization();

  if (!currentOrganization) {
    return <div>Geen organisatie geselecteerd</div>;
  }

  const planFeatures = {
    starter: {
      name: 'Starter',
      price: '€19/maand',
      products: 100,
      users: 2,
      storage: '1GB',
      features: ['Basis e-commerce', 'Email support', 'SSL certificaat']
    },
    professional: {
      name: 'Professional', 
      price: '€49/maand',
      products: 1000,
      users: 10,
      storage: '10GB',
      features: ['Geavanceerde analytics', 'Custom domains', 'Priority support', 'Marketing tools']
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Custom',
      products: 'Unlimited',
      users: 'Unlimited', 
      storage: 'Unlimited',
      features: ['White-label', 'Dedicated support', 'Custom integrations', 'SLA garantie']
    }
  };

  const currentPlan = planFeatures[currentOrganization.subscription_plan as keyof typeof planFeatures] || planFeatures.starter;
  const { data: usageData = { products: 0, users: 0, storage: 0 }, isLoading: usageLoading } = useQuery({
    queryKey: ['usage-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return { products: 0, users: 0, storage: 0 };
      
      // Get product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id);
      
      // Get active user count
      const { count: userCount } = await supabase
        .from('organization_users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);
      
      // Calculate storage usage (mock for now)
      const storageUsage = Math.random() * 2; // 0-2 GB
      
      return {
        products: productCount || 0,
        users: userCount || 0,
        storage: Number(storageUsage.toFixed(1))
      };
    },
    enabled: !!currentOrganization?.id
  });

  const getUsagePercentage = (used: number, limit: number | string) => {
    if (typeof limit === 'string') return 0;
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abonnement</h1>
        <p className="text-muted-foreground mt-1">
          Beheer je abonnement en bekijk je gebruik
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Huidig Abonnement
            </div>
            <Badge variant="default">{currentPlan.name}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Package className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{currentPlan.products}</p>
              <p className="text-sm text-muted-foreground">Producten</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{currentPlan.users}</p>
              <p className="text-sm text-muted-foreground">Gebruikers</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{currentPlan.storage}</p>
              <p className="text-sm text-muted-foreground">Opslag</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Inbegrepen features:</h4>
            <ul className="space-y-1">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-primary rounded-full"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="font-medium">{currentPlan.price}</p>
              <p className="text-sm text-muted-foreground">
                Volgende factuur: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL')}
              </p>
            </div>
            <Button variant="outline">Plan Wijzigen</Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Gebruik Overzicht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {usageLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Producten</span>
                <span className="text-sm text-muted-foreground">
                  {usageData.products} van {currentPlan.products}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(usageData.products, currentPlan.products)} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Actieve Gebruikers</span>
                <span className="text-sm text-muted-foreground">
                  {usageData.users} van {currentPlan.users}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(usageData.users, currentPlan.users)} 
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Opslag</span>
                <span className="text-sm text-muted-foreground">
                  {usageData.storage}GB van {currentPlan.storage}
                </span>
              </div>
              <Progress 
                value={typeof currentPlan.storage === 'string' ? 0 : (usageData.storage / parseFloat(currentPlan.storage)) * 100} 
                className="h-2"
              />
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Factuur Geschiedenis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p>Nog geen factuur geschiedenis beschikbaar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}