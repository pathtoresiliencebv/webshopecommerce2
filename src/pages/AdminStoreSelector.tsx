/**
 * ADMIN STORE SELECTOR
 * 
 * Shown when user has multiple stores and needs to select which to manage
 * Or when user has no stores and needs to create their first one
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight, Plus, Package, TrendingUp } from 'lucide-react';

export default function AdminStoreSelector() {
  const navigate = useNavigate();
  const { userOrganizations, switchOrganization, currentOrganization, loading } = useOrganization();

  useEffect(() => {
    // If user already has a current organization, redirect to admin
    if (!loading && currentOrganization) {
      navigate('/admin');
    }
  }, [currentOrganization, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  const handleSelectStore = async (organizationId: string, subdomain?: string) => {
    if (subdomain) {
      // Redirect to store's admin panel on its subdomain
      window.location.href = `${window.location.protocol}//${subdomain}.myaurelio.com/admin`;
    } else {
      await switchOrganization(organizationId);
      navigate('/admin');
    }
  };

  const getStoreIcon = (name: string) => {
    if (name.toLowerCase().includes('aurelio')) return '🏢';
    if (name.toLowerCase().includes('sensational')) return '✨';
    return '🏪';
  };

  const getStoreDescription = (name: string) => {
    if (name.toLowerCase().includes('aurelio')) return 'Premium Furniture & Home Decor';
    if (name.toLowerCase().includes('sensational')) return 'Trending Lifestyle Products';
    return 'E-commerce webshop';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Aurelio Platform</h1>
            <Badge variant="outline">Admin</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {userOrganizations.length === 0 ? (
            // No stores - First time user
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Welkom bij Aurelio! 🎉</h2>
                <p className="text-lg text-muted-foreground">
                  Laten we je eerste webshop opzetten
                </p>
              </div>

              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Je Eerste Store</CardTitle>
                  <CardDescription>
                    Kies een naam en begin met verkopen in enkele minuten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate('/admin/stores/new')}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Maak Je Eerste Store
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Onbeperkt Producten</h3>
                  <p className="text-sm text-muted-foreground">Voeg zoveel producten toe als je wilt</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Meerdere Webshops</h3>
                  <p className="text-sm text-muted-foreground">Beheer al je stores vanaf één plek</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Geavanceerde Analytics</h3>
                  <p className="text-sm text-muted-foreground">Volg je verkopen en groei</p>
                </div>
              </div>
            </div>
          ) : (
            // Has stores - Show selection
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Welke webshop wil je beheren?</h2>
                <p className="text-muted-foreground">
                  Selecteer een store om te beginnen met beheren
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {userOrganizations.map((orgUser) => {
                  const org = orgUser.organization;
                  const storeIcon = getStoreIcon(org.name);
                  const storeDescription = getStoreDescription(org.name);
                  
                  return (
                    <Card 
                      key={org.id}
                      className="hover:border-primary transition-colors cursor-pointer group"
                      onClick={() => handleSelectStore(org.id, org.subdomain)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-4xl">{storeIcon}</div>
                            <div>
                              <CardTitle>{org.name}</CardTitle>
                              <CardDescription>{storeDescription}</CardDescription>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Store URL */}
                        {org.subdomain && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-1 rounded">
                              {org.subdomain}.myaurelio.com
                            </span>
                          </div>
                        )}

                        {/* Store Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {/* TODO: Add product count */}
                              0 producten
                            </span>
                          </div>
                          <Badge variant={
                            org.subscription_status === 'active' ? 'default' :
                            org.subscription_status === 'trial' ? 'secondary' :
                            'destructive'
                          }>
                            {org.subscription_status === 'trial' ? 'Trial' :
                             org.subscription_status === 'active' ? 'Actief' :
                             'Inactief'}
                          </Badge>
                        </div>

                        {/* Role Badge */}
                        <div>
                          <Badge variant="outline">
                            {orgUser.role === 'owner' ? '👑 Owner' :
                             orgUser.role === 'admin' ? '⚡ Admin' :
                             orgUser.role === 'manager' ? '📊 Manager' :
                             '👤 ' + orgUser.role}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Create New Store Button */}
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/admin/stores/new')}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nieuwe Store Maken
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
