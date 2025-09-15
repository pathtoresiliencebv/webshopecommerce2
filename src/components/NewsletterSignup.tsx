import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Gift, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { store } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !store?.id) return;

    setIsLoading(true);
    try {
      // Check if subscriber already exists
      const { data: existing } = await supabase
        .from('email_subscribers')
        .select('id')
        .eq('email', email)
        .eq('organization_id', store.id)
        .single();

      if (existing) {
        toast.error('Je bent al ingeschreven voor onze nieuwsbrief!');
        return;
      }

      // Add new subscriber
      const { error } = await supabase
        .from('email_subscribers')
        .insert({
          organization_id: store.id,
          email: email,
          subscription_source: 'website_footer',
          is_active: true,
          tags: ['website_signup']
        });

      if (error) throw error;

      // Track the event to trigger welcome workflow
      await supabase.functions.invoke('track-events', {
        body: {
          organizationId: store.id,
          userId: null,
          sessionId: `session_${Date.now()}`,
          eventType: 'newsletter_signup',
          eventData: {
            email: email,
            source: 'website_footer'
          }
        }
      });

      setIsSubscribed(true);
      toast.success('Bedankt voor je inschrijving! Check je inbox voor een welkomstmail.');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);

    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Welkom bij {store?.name || 'onze'} familie!</h3>
          <p className="text-primary-foreground/90">
            Je ontvangt binnenkort een welkomstmail met exclusieve aanbiedingen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Mail className="h-6 w-6" />
            </div>
            <div className="bg-white/20 p-2 rounded-full ml-2">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Blijf op de hoogte!</h3>
          <p className="text-primary-foreground/90 text-sm">
            Ontvang exclusieve aanbiedingen, nieuwe collecties en design tips direct in je inbox
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Je e-mailadres..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
            />
            <Button 
              type="submit" 
              variant="secondary"
              disabled={isLoading}
              className="whitespace-nowrap font-semibold"
            >
              {isLoading ? 'Bezig...' : 'Inschrijven'}
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-xs text-primary-foreground/80">
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Gratis uitschrijven
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Geen spam
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              10% korting
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-white/20 text-center">
          <p className="text-xs text-primary-foreground/70">
            Door je in te schrijven ga je akkoord met onze{' '}
            <span className="underline cursor-pointer hover:text-white">
              privacyvoorwaarden
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}