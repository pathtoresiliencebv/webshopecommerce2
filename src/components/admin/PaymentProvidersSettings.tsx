/**
 * PAYMENT PROVIDERS SETTINGS
 * Admin UI for managing Stripe Connect, Mollie, PayPal per webshop
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CreditCard, ExternalLink, CheckCircle2, AlertCircle, 
  Loader2, Settings 
} from 'lucide-react';

interface PaymentProvider {
  id: string;
  provider: 'stripe' | 'mollie' | 'paypal';
  stripe_account_id?: string;
  stripe_account_status?: string;
  is_active: boolean;
  is_primary: boolean;
  onboarding_completed_at?: string;
}

export function PaymentProvidersSettings() {
  const { store, tenantDb } = useStore();
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (tenantDb && store) {
      loadProviders();
    }
  }, [tenantDb, store, refreshKey]);

  const loadProviders = async () => {
    try {
      if (!tenantDb) return;

      const { data, error } = await tenantDb
        .from('payment_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProviders(data || []);
    } catch (error) {
      console.error('Error loading payment providers:', error);
      toast.error('Failed to load payment providers');
    } finally {
      setLoading(false);
    }
  };

  const setupStripeConnect = async () => {
    if (!store) return;

    setSettingUp('stripe');

    try {
      // Call edge function to create Stripe Connect account
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('stripe-create-connect-account', {
        body: {
          organizationId: store.id,
          email: user?.email,
          country: 'NL',
        },
      });

      if (error) throw error;

      toast.success('Stripe account created!');

      // Create onboarding link
      const { data: linkData, error: linkError } = await supabase.functions.invoke(
        'stripe-create-onboarding-link',
        {
          body: {
            accountId: data.accountId,
            refreshUrl: window.location.href,
            returnUrl: window.location.href,
          },
        }
      );

      if (linkError) throw linkError;

      // Open onboarding in new tab
      const onboardingWindow = window.open(linkData.url, '_blank');
      
      // Poll for completion
      const pollInterval = setInterval(() => {
        if (onboardingWindow?.closed) {
          clearInterval(pollInterval);
          setRefreshKey(prev => prev + 1);
          toast.success('Checking Stripe setup status...');
        }
      }, 1000);

      // Reload providers after 2 seconds
      setTimeout(() => loadProviders(), 2000);
    } catch (error: any) {
      console.error('Error setting up Stripe:', error);
      toast.error(error.message || 'Failed to setup Stripe');
    } finally {
      setSettingUp(null);
    }
  };

  const continueStripeOnboarding = async (accountId: string) => {
    setSettingUp('stripe');

    try {
      const { data, error } = await supabase.functions.invoke(
        'stripe-create-onboarding-link',
        {
          body: { 
            accountId,
            refreshUrl: window.location.href,
            returnUrl: window.location.href,
          },
        }
      );

      if (error) throw error;

      const onboardingWindow = window.open(data.url, '_blank');
      
      // Poll for completion
      const pollInterval = setInterval(() => {
        if (onboardingWindow?.closed) {
          clearInterval(pollInterval);
          setRefreshKey(prev => prev + 1);
          toast.success('Checking Stripe setup status...');
        }
      }, 1000);

      // Auto-refresh after window closes
      setTimeout(() => loadProviders(), 2000);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create onboarding link');
    } finally {
      setSettingUp(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return '💳';
      case 'mollie':
        return '🟣';
      case 'paypal':
        return '💙';
      default:
        return '💰';
    }
  };

  const getStatusBadge = (provider: PaymentProvider) => {
    if (provider.is_active && provider.onboarding_completed_at) {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
    }
    if (provider.stripe_account_status === 'pending' || !provider.onboarding_completed_at) {
      return <Badge variant="outline" className="text-yellow-600"><AlertCircle className="w-3 h-3 mr-1" /> Setup Required</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const stripeProvider = providers.find(p => p.provider === 'stripe');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Betaalmethoden</h2>
        <p className="text-muted-foreground">
          Verbind Stripe om betalingen te accepteren voor {store?.name}
        </p>
      </div>

      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getProviderIcon('stripe')}</div>
              <div>
                <CardTitle>Stripe</CardTitle>
                <CardDescription>Accept credit cards, Apple Pay, Google Pay</CardDescription>
              </div>
            </div>
            {stripeProvider && getStatusBadge(stripeProvider)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!stripeProvider ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect Stripe to start accepting payments. You'll receive payouts directly to your bank account.
              </p>
              <Button 
                onClick={setupStripeConnect}
                disabled={settingUp === 'stripe'}
              >
                {settingUp === 'stripe' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connect Stripe
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account ID</span>
                <code className="bg-muted px-2 py-1 rounded">{stripeProvider.stripe_account_id}</code>
              </div>
              
              {!stripeProvider.onboarding_completed_at && (
                <Button 
                  variant="outline" 
                  onClick={() => continueStripeOnboarding(stripeProvider.stripe_account_id!)}
                  disabled={settingUp === 'stripe'}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Complete Setup
                </Button>
              )}

              {stripeProvider.is_active && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Ready to accept payments</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Payouts will be sent to your bank account daily
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mollie (Coming soon) */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getProviderIcon('mollie')}</div>
              <div>
                <CardTitle>Mollie</CardTitle>
                <CardDescription>Popular in Europe, supports iDEAL, Bancontact</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Mollie integration will be available soon
          </p>
        </CardContent>
      </Card>

      {/* PayPal (Coming soon) */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getProviderIcon('paypal')}</div>
              <div>
                <CardTitle>PayPal</CardTitle>
                <CardDescription>Accept PayPal and Venmo payments</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            PayPal integration will be available soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
