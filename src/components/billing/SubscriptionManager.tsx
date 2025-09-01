import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  ArrowUp,
  Download,
  Settings
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const planFeatures = {
  starter: {
    name: 'Starter',
    price: 29,
    features: [
      'Tot 100 producten',
      'Basis templates',
      'SSL certificaat',
      'Email ondersteuning'
    ]
  },
  professional: {
    name: 'Professional', 
    price: 79,
    features: [
      'Onbeperkte producten',
      'Premium templates',
      'Aangepast domein',
      'Priority ondersteuning',
      'Geavanceerde analytics'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: [
      'Alles van Professional',
      'White-label oplossing',
      'API toegang',
      'Dedicated account manager',
      '24/7 telefoonondersteuning'
    ]
  }
};

export default function SubscriptionManager() {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentOrganization?.id],
    queryFn: async (): Promise<SubscriptionData | null> => {
      if (!currentOrganization) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!currentOrganization
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trialing': return 'secondary'; 
      case 'past_due': return 'destructive';
      case 'canceled': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actief';
      case 'trialing': return 'Proefperiode';
      case 'past_due': return 'Betaling achterstallig';
      case 'canceled': return 'Geannuleerd';
      default: return status;
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    setLoading(true);
    try {
      // Here you would integrate with Stripe or your payment processor
      console.log(`Upgrading to ${newPlan}`);
      // Placeholder for upgrade logic
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Selecteer een store om abonnement te beheren</p>
      </div>
    );
  }

  const currentPlan = currentOrganization.subscription_plan;
  const currentPlanData = planFeatures[currentPlan as keyof typeof planFeatures];

  // Calculate trial progress
  const trialEndsAt = new Date(currentOrganization.trial_ends_at || '');
  const trialStarted = new Date(); // Fallback to current date
  const now = new Date();
  const totalTrialDays = 14;
  const daysUsed = Math.floor((now.getTime() - trialStarted.getTime()) / (1000 * 60 * 60 * 24));
  const trialProgress = Math.min((daysUsed / totalTrialDays) * 100, 100);
  const daysLeft = Math.max(totalTrialDays - daysUsed, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnement Beheer</h1>
        <p className="text-muted-foreground">
          Beheer je abonnement en facturatie voor {currentOrganization.name}
        </p>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Huidig Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentPlanData.name}</h3>
              <p className="text-muted-foreground">
                €{currentPlanData.price}/maand
              </p>
            </div>
            <Badge variant={getStatusColor(currentOrganization.subscription_status)}>
              {getStatusText(currentOrganization.subscription_status)}
            </Badge>
          </div>

          {currentOrganization.subscription_status === 'trial' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Proefperiode voortgang</span>
                <span>{daysLeft} dagen resterend</span>
              </div>
              <Progress value={trialProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Je proefperiode eindigt op {trialEndsAt.toLocaleDateString('nl-NL')}
              </p>
            </div>
          )}

          {subscription && (
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Volgende factuur: {new Date(subscription.current_period_end).toLocaleDateString('nl-NL')}</span>
              </div>
              {subscription.cancel_at_period_end && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Wordt geannuleerd eind periode</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Betalingsmethode
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Facturen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upgrade je plan</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(planFeatures).map(([planKey, plan]) => {
            const isCurrentPlan = planKey === currentPlan;
            const isUpgrade = plan.price > currentPlanData.price;
            
            return (
              <Card key={planKey} className={isCurrentPlan ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrentPlan && (
                      <Badge variant="default">Huidige</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    €{plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/maand</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || loading}
                    onClick={() => !isCurrentPlan && handleUpgrade(planKey)}
                  >
                    {isCurrentPlan ? 'Huidige Plan' : 
                     isUpgrade ? (
                       <>
                         <ArrowUp className="w-4 h-4 mr-2" />
                         Upgraden
                       </>
                     ) : 'Downgraden'
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Gebruik & Limieten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Producten</span>
                <span>25 / {currentPlan === 'starter' ? '100' : '∞'}</span>
              </div>
              <Progress value={25} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bandbreedte (GB)</span>
                <span>1.2 / 10</span>
              </div>
              <Progress value={12} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}