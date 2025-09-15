import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface ChatwootWidgetProps {
  organizationId?: string;
  customConfig?: {
    primaryColor?: string;
    locale?: string;
    position?: 'left' | 'right';
    hideMessageBubble?: boolean;
  };
}

interface ChatwootAccount {
  website_token: string;
  locale: string;
  account_status: string;
}

// Extend window interface for Chatwoot
declare global {
  interface Window {
    chatwootSettings?: any;
    $chatwoot?: {
      toggle: (state?: 'open' | 'close') => void;
      setUser: (identifier: string, userInfo: any) => void;
      setCustomAttributes: (attributes: any) => void;
      deleteCustomAttribute: (key: string) => void;
      setLocale: (locale: string) => void;
    };
    chatwootSDK?: any;
  }
}

export function ChatwootWidget({ organizationId, customConfig }: ChatwootWidgetProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [chatwootAccount, setChatwootAccount] = useState<ChatwootAccount | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = organizationId || currentOrganization?.id;

  useEffect(() => {
    if (!orgId) return;

    fetchChatwootAccount();
  }, [orgId]);

  useEffect(() => {
    if (chatwootAccount && chatwootAccount.account_status === 'active') {
      loadChatwootWidget();
    }

    return () => {
      // Cleanup on unmount
      if (window.$chatwoot) {
        const widget = document.getElementById('chatwoot-widget-holder');
        if (widget) {
          widget.remove();
        }
      }
    };
  }, [chatwootAccount]);

  useEffect(() => {
    // Update user information when user changes
    if (isLoaded && user && window.$chatwoot) {
      identifyUser();
    }
  }, [user, isLoaded]);

  const fetchChatwootAccount = async () => {
    if (!orgId) return;

    try {
      const { data, error } = await supabase
        .from('chatwoot_accounts')
        .select('website_token, locale, account_status')
        .eq('organization_id', orgId)
        .eq('account_status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No account found - this is expected for stores without chat
          console.log('No Chatwoot account found for organization:', orgId);
          return;
        }
        throw error;
      }

      setChatwootAccount(data);
    } catch (error: any) {
      console.error('Error fetching Chatwoot account:', error);
      setError('Failed to load chat widget');
    }
  };

  const loadChatwootWidget = async () => {
    if (!chatwootAccount || isLoaded) return;

    try {
      // Set Chatwoot configuration
      window.chatwootSettings = {
        websiteToken: chatwootAccount.website_token,
        baseUrl: 'https://chatwoot.aurelioliving.nl',
        locale: customConfig?.locale || chatwootAccount.locale || 'nl',
        type: 'standard',
        launcherTitle: `Chat met ${currentOrganization?.name || 'ons'}`,
        position: customConfig?.position || 'right',
        hideMessageBubble: customConfig?.hideMessageBubble || false,
        showPopoutButton: false,
        
        // Custom styling
        darkMode: 'auto',
        widgetStyle: {
          primaryColor: customConfig?.primaryColor || '#1f2937',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '8px'
        }
      };

      // Load Chatwoot SDK
      const script = document.createElement('script');
      script.src = 'https://chatwoot.aurelioliving.nl/packs/js/sdk.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
        
        // Identify user if logged in
        if (user) {
          setTimeout(() => identifyUser(), 1000);
        }
        
        // Track widget load event
        trackWidgetEvent('widget_loaded');
      };
      script.onerror = () => {
        setError('Failed to load chat widget');
      };

      document.head.appendChild(script);

      // Track widget load time
      const startTime = performance.now();
      script.onload = () => {
        const loadTime = performance.now() - startTime;
        trackWidgetEvent('widget_loaded', { load_time_ms: loadTime });
        setIsLoaded(true);
        
        if (user) {
          setTimeout(() => identifyUser(), 1000);
        }
      };

    } catch (error: any) {
      console.error('Error loading Chatwoot widget:', error);
      setError('Failed to initialize chat widget');
    }
  };

  const identifyUser = async () => {
    if (!user || !window.$chatwoot || !orgId) return;

    try {
      // Get user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, avatar_url')
        .eq('user_id', user.id)
        .single();

      // Get customer stats
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      const { data: cart } = await supabase
        .from('shopping_cart')
        .select(`
          quantity,
          products:product_id (name, price)
        `)
        .eq('user_id', user.id)
        .eq('organization_id', orgId);

      // Calculate customer stats
      const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;
      const cartValue = cart?.reduce((sum, item) => {
        return sum + (parseFloat(item.products?.price || 0) * item.quantity);
      }, 0) || 0;

      const customerTier = totalSpent >= 5000 ? 'Platinum' : 
                          totalSpent >= 2500 ? 'Gold' : 
                          totalSpent >= 1000 ? 'Silver' : 'Bronze';

      // Set user in Chatwoot
      window.$chatwoot.setUser(user.id, {
        name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : user.email?.split('@')[0] || 'Customer',
        email: user.email,
        phone: profile?.phone,
        avatar_url: profile?.avatar_url,
        custom_attributes: {
          customer_tier: customerTier,
          total_orders: orders?.length || 0,
          total_spent: `€${totalSpent.toFixed(2)}`,
          current_cart_value: `€${cartValue.toFixed(2)}`,
          current_cart_items: cart?.length || 0,
          store_name: currentOrganization?.name,
          registration_date: user.created_at?.split('T')[0],
          preferred_language: chatwootAccount?.locale || 'nl'
        }
      });

      console.log('User identified in Chatwoot:', user.id);
    } catch (error: any) {
      console.error('Error identifying user in Chatwoot:', error);
    }
  };

  const trackWidgetEvent = async (eventType: string, eventData: any = {}) => {
    if (!orgId) return;

    try {
      await supabase
        .from('chatwoot_widget_events')
        .insert({
          organization_id: orgId,
          event_type: eventType,
          session_id: generateSessionId(),
          user_id: user?.id || null,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          event_data: eventData
        });
    } catch (error: any) {
      console.error('Error tracking widget event:', error);
    }
  };

  const generateSessionId = (): string => {
    return sessionStorage.getItem('chatwoot_session_id') || 
           (() => {
             const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
             sessionStorage.setItem('chatwoot_session_id', sessionId);
             return sessionId;
           })();
  };

  // Custom chat methods that can be called from parent components
  const openChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('open');
      trackWidgetEvent('widget_opened');
    }
  };

  const closeChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('close');
    }
  };

  const updateCustomAttributes = (attributes: any) => {
    if (window.$chatwoot) {
      window.$chatwoot.setCustomAttributes(attributes);
    }
  };

  // Expose methods to parent components
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    openChat,
    closeChat,
    updateCustomAttributes,
    identifyUser
  }));

  // Don't render anything if there's no account or if it's not active
  if (!chatwootAccount || chatwootAccount.account_status !== 'active') {
    return null;
  }

  // Show error state
  if (error) {
    console.error('Chatwoot Widget Error:', error);
    return null; // Fail silently for better UX
  }

  // The widget is loaded via script injection, no visual component needed
  return null;
}

// Export utility functions for use in other components
export const useChatwootWidget = () => {
  const openChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('open');
    }
  };

  const closeChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.toggle('close');
    }
  };

  const updateUserAttributes = (attributes: any) => {
    if (window.$chatwoot) {
      window.$chatwoot.setCustomAttributes(attributes);
    }
  };

  return {
    openChat,
    closeChat,
    updateUserAttributes,
    isAvailable: !!window.$chatwoot
  };
};

// Component for triggering chat from other parts of the app
export function ChatTrigger({ 
  children, 
  className,
  trackingData = {} 
}: { 
  children: React.ReactNode;
  className?: string;
  trackingData?: any;
}) {
  const { openChat } = useChatwootWidget();

  const handleClick = () => {
    openChat();
    
    // Track chat trigger usage
    if (trackingData.source || trackingData.context) {
      console.log('Chat opened from:', trackingData);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
}