/**
 * STRIPE CONNECT BUTTON
 * Reusable button component for Stripe Connect onboarding
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeConnectButtonProps {
  storeId: string;
  storeName: string;
  onSuccess?: () => void;
  variant?: 'default' | 'outline';
}

export function StripeConnectButton({ 
  storeId, 
  storeName, 
  onSuccess,
  variant = 'default' 
}: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);

    try {
      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('No user email found');
        return;
      }

      console.log('🔗 Creating Stripe Connect account for:', storeName);

      // Create Stripe Connect account
      const { data, error } = await supabase.functions.invoke('stripe-create-connect-account', {
        body: {
          organizationId: storeId,
          email: user.email,
          country: 'NL',
        },
      });

      if (error) throw error;

      console.log('✅ Stripe account created:', data.accountId);

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

      console.log('🔗 Opening onboarding URL');

      // Open onboarding in new window
      const onboardingWindow = window.open(linkData.url, '_blank', 'width=800,height=800');
      
      // Poll for window close
      const pollInterval = setInterval(() => {
        if (onboardingWindow?.closed) {
          clearInterval(pollInterval);
          toast.success('Stripe onboarding completed! Refreshing...');
          onSuccess?.();
        }
      }, 1000);

      toast.success('Stripe Connect window opened!');
    } catch (error: any) {
      console.error('❌ Stripe Connect error:', error);
      toast.error(error.message || 'Failed to connect Stripe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleConnect}
      disabled={loading}
      variant={variant}
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          Connect Stripe
        </>
      )}
    </Button>
  );
}

interface StripeContinueButtonProps {
  accountId: string;
  onSuccess?: () => void;
}

export function StripeContinueButton({ accountId, onSuccess }: StripeContinueButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);

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

      const onboardingWindow = window.open(data.url, '_blank', 'width=800,height=800');
      
      const pollInterval = setInterval(() => {
        if (onboardingWindow?.closed) {
          clearInterval(pollInterval);
          toast.success('Setup completed! Refreshing...');
          onSuccess?.();
        }
      }, 1000);

      toast.success('Continue setup opened!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to continue setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleContinue}
      disabled={loading}
      variant="outline"
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <ExternalLink className="w-4 h-4" />
          Complete Setup
        </>
      )}
    </Button>
  );
}
