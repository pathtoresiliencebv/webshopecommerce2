import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  CreditCard, 
  Plus, 
  Settings, 
  ExternalLink, 
  Key, 
  Webhook, 
  Activity,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function AdminPaymentMethods() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [keysDialogOpen, setKeysDialogOpen] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [webhookEndpoint, setWebhookEndpoint] = useState('');

  const { data: paymentMethods = [], isLoading: methodsLoading } = useQuery({
    queryKey: ['payment-methods', currentOrganization?.id],
    queryFn: async () => {
      // Mock data until database migration is approved
      return [
        {
          id: '1',
          type: 'card',
          card_brand: 'visa',
          card_last4: '4242',
          card_exp_month: 12,
          card_exp_year: 2025,
          is_default: true,
          is_active: true
        }
      ];
    },
    enabled: !!currentOrganization?.id
  });

  const { data: billingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['billing-events', currentOrganization?.id],
    queryFn: async () => {
      // Mock data until database migration is approved
      return [
        {
          id: '1',
          event_type: 'payment_succeeded',
          amount: 49.99,
          status: 'succeeded',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          event_type: 'subscription_created',
          amount: 49.99,
          status: 'succeeded',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    },
    enabled: !!currentOrganization?.id
  });

  const updateKeysMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation until database migration is approved
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Stripe instellingen opgeslagen",
        description: "Je betaal configuratie is succesvol bijgewerkt"
      });
      setKeysDialogOpen(false);
    }
  });

  const openCustomerPortal = async () => {
    try {
      // Mock implementation until Stripe integration is complete
      toast({
        title: "Customer Portal",
        description: "Omgeleid naar Stripe billing portal..."
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon customer portal niet openen",
        variant: "destructive"
      });
    }
  };

  if (!currentOrganization) {
    return <div className="text-center py-8">Geen organisatie geselecteerd</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge variant="default" className="text-green-600 bg-green-50 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Succesvol</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Mislukt</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Activity className="w-3 h-3 mr-1" />In behandeling</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Betaalmethoden</h1>
          <p className="text-muted-foreground mt-1">
            Beheer Stripe configuratie en betaalmethoden
          </p>
        </div>
        <Dialog open={keysDialogOpen} onOpenChange={setKeysDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Stripe Configureren
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Stripe API Configuratie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="publishable-key">Stripe Publishable Key</Label>
                <Input 
                  id="publishable-key"
                  value={stripePublishableKey}
                  onChange={(e) => setStripePublishableKey(e.target.value)}
                  placeholder="pk_live_..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Publieke key voor client-side integratie
                </p>
              </div>
              <div>
                <Label htmlFor="webhook-endpoint">Webhook Endpoint</Label>
                <Input 
                  id="webhook-endpoint"
                  value={webhookEndpoint}
                  onChange={(e) => setWebhookEndpoint(e.target.value)}
                  placeholder="https://yoursite.com/api/webhooks/stripe"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL voor Stripe webhook events
                </p>
              </div>
              <Button 
                onClick={() => updateKeysMutation.mutate()}
                disabled={updateKeysMutation.isPending}
                className="w-full"
              >
                {updateKeysMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opslaan...</>
                ) : (
                  'Configuratie Opslaan'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stripe Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Status</p>
                <p className="text-lg font-semibold text-green-600">Geconfigureerd</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Betaalmethoden</p>
                <p className="text-lg font-semibold">{paymentMethods.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Webhook className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Webhooks</p>
                <p className="text-lg font-semibold text-green-600">Actief</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deze maand</p>
                <p className="text-lg font-semibold">€{billingEvents.filter(e => e.event_type === 'payment_succeeded').reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Betaalmethoden
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Toevoegen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {methodsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-2" />
              <p>Nog geen betaalmethoden geconfigureerd</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{method.card_brand?.toUpperCase()} **** {method.card_last4}</p>
                      <p className="text-sm text-muted-foreground">
                        Verloopt {method.card_exp_month}/{method.card_exp_year}
                      </p>
                    </div>
                    {method.is_default && <Badge variant="default">Standaard</Badge>}
                  </div>
                  <Button variant="outline" size="sm">
                    Bewerken
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Integration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Geef klanten toegang tot hun billing portal om abonnementen en betalingen te beheren.
            </p>
            <Button 
              variant="outline" 
              onClick={openCustomerPortal}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Customer Portal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuratie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Webhook Events</p>
                <p className="text-xs text-muted-foreground">Automatische status updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Test Mode</p>
                <p className="text-xs text-muted-foreground">Gebruik Stripe test omgeving</p>
              </div>
              <Switch />
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Webhook className="h-4 w-4 mr-2" />
              Test Webhook
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recente Transacties
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : billingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p>Nog geen transacties</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{event.event_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{event.amount?.toFixed(2) || '0.00'}</p>
                    {getStatusBadge(event.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}