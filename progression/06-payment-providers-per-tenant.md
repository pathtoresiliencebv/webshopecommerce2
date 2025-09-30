# Payment Providers per Tenant - Multi-Account Support

**Datum:** 30 September 2025  
**Feature:** Elke webshop eigen Stripe/Mollie/PayPal account

## 🎯 Vereisten

### Business Model
Elke store owner moet:
- ✅ Eigen Stripe account gebruiken
- ✅ Eigen betalingen ontvangen (direct naar hun bank)
- ✅ Eigen refunds afhandelen
- ✅ Platform neemt alleen commissie (optioneel)

### Waarom Dit Nodig Is
```
❌ VERKEERD: Alle betalingen naar 1 Stripe account
   → Complex uitbetalen naar store owners
   → Compliance issues
   → Platform risico bij fraude

✅ CORRECT: Elke store eigen Stripe Connect account
   → Direct betaling naar store owner
   → Store owner heeft volledige controle
   → Platform kan commissie nemen via application fee
```

## 🏗️ Architectuur: Stripe Connect

### Platform Model: "Stripe Connect Platform"
```
┌─────────────────────────────────────────┐
│      PLATFORM (MyAurelio)               │
│                                          │
│  Stripe Platform Account                │
│  ├── Manages all connected accounts     │
│  ├── Takes application fee (optional)   │
│  └── Provides unified dashboard         │
└─────────────────────────────────────────┘
                   │
        ┼──────────┴──────────┼
        │                     │
        ▼                     ▼
┌──────────────────┐   ┌──────────────────┐
│  STORE 1         │   │  STORE 2         │
│                  │   │                  │
│  Stripe Connect  │   │  Stripe Connect  │
│  Account         │   │  Account         │
│                  │   │                  │
│  ✅ Own payouts  │   │  ✅ Own payouts  │
│  ✅ Own refunds  │   │  ✅ Own refunds  │
│  ✅ Own bank     │   │  ✅ Own bank     │
└──────────────────┘   └──────────────────┘
```

## 📊 Database Schema

### Payment Provider Accounts (Tenant Database)
```sql
-- Store in TENANT database (per store)
CREATE TABLE payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider type
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mollie', 'paypal', 'adyen')),
  
  -- Stripe Connect specific
  stripe_account_id TEXT UNIQUE, -- acct_xxxxx (connected account)
  stripe_publishable_key TEXT,
  stripe_account_status TEXT CHECK (status IN ('pending', 'active', 'restricted', 'inactive')),
  
  -- Mollie specific
  mollie_profile_id TEXT UNIQUE,
  mollie_api_key_encrypted TEXT,
  
  -- PayPal specific
  paypal_merchant_id TEXT,
  paypal_client_id TEXT,
  paypal_client_secret_encrypted TEXT,
  
  -- Configuration
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false, -- Primary payment method
  
  -- Capabilities & Requirements
  capabilities JSONB DEFAULT '{}', -- {card_payments: true, sepa_debit: false}
  requirements JSONB DEFAULT '{}', -- KYC requirements from Stripe
  
  -- Fees & Commissions
  platform_fee_percentage DECIMAL(5,2) DEFAULT 0, -- Platform commission %
  platform_fee_fixed DECIMAL(10,2) DEFAULT 0, -- Platform fixed fee per transaction
  
  -- Metadata
  onboarding_completed_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions (tenant database)
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  payment_provider_id UUID NOT NULL REFERENCES payment_providers(id),
  
  -- Transaction details
  provider_transaction_id TEXT NOT NULL, -- pi_xxxxx (Stripe), tr_xxxxx (Mollie)
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'
  )),
  
  -- Fees
  platform_fee DECIMAL(10,2) DEFAULT 0, -- What platform takes
  provider_fee DECIMAL(10,2) DEFAULT 0, -- What Stripe/Mollie takes
  net_amount DECIMAL(10,2), -- What store owner receives
  
  -- Metadata
  provider_metadata JSONB DEFAULT '{}', -- Full response from provider
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds (tenant database)
CREATE TABLE payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
  
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_reason TEXT,
  
  provider_refund_id TEXT NOT NULL, -- re_xxxxx (Stripe)
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  
  created_by UUID, -- Admin who initiated refund
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_providers_stripe_account ON payment_providers(stripe_account_id);
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
```

## 🔌 Stripe Connect Onboarding Flow

### 1. Store Owner Starts Onboarding
```typescript
// src/components/admin/PaymentSetup.tsx

export function PaymentSetup() {
  const { tenantDb, store } = useStore();
  
  const startStripeOnboarding = async () => {
    // 1. Create Stripe Connect account via edge function
    const { data: account } = await supabase.functions.invoke(
      'create-stripe-connect-account',
      {
        body: {
          organizationId: store.id,
          email: user.email,
          country: store.country || 'NL',
          businessType: 'individual', // or 'company'
        }
      }
    );
    
    // 2. Save to tenant database
    const { data: provider } = await tenantDb
      .from('payment_providers')
      .insert({
        provider: 'stripe',
        stripe_account_id: account.id,
        stripe_account_status: account.status,
        is_active: false, // Not active until onboarding complete
      })
      .select()
      .single();
    
    // 3. Create onboarding link
    const { data: onboardingUrl } = await supabase.functions.invoke(
      'create-stripe-onboarding-link',
      {
        body: {
          accountId: account.id,
          returnUrl: `https://${store.subdomain}.myaurelio.com/admin/payments/complete`,
          refreshUrl: `https://${store.subdomain}.myaurelio.com/admin/payments/setup`,
        }
      }
    );
    
    // 4. Redirect to Stripe onboarding
    window.location.href = onboardingUrl.url;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Connect Setup</CardTitle>
        <CardDescription>
          Ontvang betalingen direct op je eigen bankrekening
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={startStripeOnboarding} size="lg">
          Start Stripe Onboarding
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 2. Edge Function: Create Stripe Connect Account
```typescript
// supabase/functions/create-stripe-connect-account/index.ts

import Stripe from 'https://esm.sh/stripe@13.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const { organizationId, email, country, businessType } = await req.json();
  
  try {
    // Create Stripe Connect Account
    const account = await stripe.accounts.create({
      type: 'standard', // or 'express' for faster onboarding
      country: country,
      email: email,
      business_type: businessType,
      metadata: {
        organization_id: organizationId,
        platform: 'myaurelio',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    return new Response(
      JSON.stringify({ success: true, account }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
});
```

### 3. Edge Function: Create Onboarding Link
```typescript
// supabase/functions/create-stripe-onboarding-link/index.ts

serve(async (req) => {
  const { accountId, returnUrl, refreshUrl } = await req.json();
  
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    
    return new Response(
      JSON.stringify({ success: true, url: accountLink.url }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
});
```

### 4. Onboarding Complete Handler
```typescript
// src/pages/admin/PaymentComplete.tsx

export default function PaymentComplete() {
  const { tenantDb, store } = useStore();
  
  useEffect(() => {
    const verifyOnboarding = async () => {
      // Get Stripe account from tenant DB
      const { data: provider } = await tenantDb
        .from('payment_providers')
        .select('*')
        .eq('provider', 'stripe')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!provider) return;
      
      // Verify account with Stripe
      const { data: accountStatus } = await supabase.functions.invoke(
        'verify-stripe-account',
        { body: { accountId: provider.stripe_account_id } }
      );
      
      // Update provider status
      if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
        await tenantDb
          .from('payment_providers')
          .update({
            stripe_account_status: 'active',
            is_active: true,
            is_primary: true, // Set as primary payment method
            capabilities: accountStatus.capabilities,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('id', provider.id);
        
        toast.success('Stripe account succesvol gekoppeld! 🎉');
        navigate('/admin/payments');
      } else {
        toast.error('Onboarding niet compleet. Probeer opnieuw.');
      }
    };
    
    verifyOnboarding();
  }, []);
  
  return <LoadingSpinner />;
}
```

## 💳 Payment Processing per Store

### 1. Create Payment Intent (with Connected Account)
```typescript
// supabase/functions/create-payment-intent/index.ts

serve(async (req) => {
  const { organizationId, orderId, amount, currency } = await req.json();
  
  try {
    // 1. Get tenant database
    const tenantDb = await getTenantDatabase(organizationId);
    
    // 2. Get active payment provider
    const { data: provider } = await tenantDb
      .from('payment_providers')
      .select('*')
      .eq('is_active', true)
      .eq('is_primary', true)
      .single();
    
    if (!provider || provider.provider !== 'stripe') {
      throw new Error('No active Stripe account');
    }
    
    // 3. Calculate platform fee
    const platformFee = (amount * provider.platform_fee_percentage / 100) + 
                        provider.platform_fee_fixed;
    
    // 4. Create Payment Intent on Connected Account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: currency.toLowerCase(),
      application_fee_amount: Math.round(platformFee * 100), // Platform commission
      metadata: {
        organization_id: organizationId,
        order_id: orderId,
      },
    }, {
      stripeAccount: provider.stripe_account_id, // CRITICAL: Connected account
    });
    
    // 5. Save transaction
    await tenantDb
      .from('payment_transactions')
      .insert({
        order_id: orderId,
        payment_provider_id: provider.id,
        provider_transaction_id: paymentIntent.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        platform_fee: platformFee,
        net_amount: amount - platformFee,
      });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        clientSecret: paymentIntent.client_secret,
        publishableKey: provider.stripe_publishable_key,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
});
```

### 2. Frontend: Payment Form (Per Store)
```typescript
// src/components/checkout/PaymentForm.tsx

import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

export function PaymentForm({ orderId, amount }) {
  const { tenantDb, store } = useStore();
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  
  useEffect(() => {
    const initPayment = async () => {
      // Get payment intent
      const { data } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            organizationId: store.id,
            orderId: orderId,
            amount: amount,
            currency: 'EUR',
          }
        }
      );
      
      setClientSecret(data.clientSecret);
      
      // Load Stripe with store's publishable key
      const stripe = await loadStripe(data.publishableKey, {
        stripeAccount: data.connectedAccountId, // Connected account
      });
      setStripePromise(stripe);
    };
    
    initPayment();
  }, [orderId]);
  
  if (!clientSecret || !stripePromise) return <LoadingSpinner />;
  
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm orderId={orderId} />
    </Elements>
  );
}
```

## 🔄 Webhook Handling (per Store)

### Stripe Webhook Endpoint
```typescript
// supabase/functions/stripe-webhook/index.ts

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  // Get organization_id from event metadata
  const organizationId = event.data.object.metadata?.organization_id;
  const tenantDb = await getTenantDatabase(organizationId);
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update transaction status
      await tenantDb
        .from('payment_transactions')
        .update({ 
          status: 'succeeded',
          provider_metadata: event.data.object,
        })
        .eq('provider_transaction_id', event.data.object.id);
      
      // Update order status
      const { data: transaction } = await tenantDb
        .from('payment_transactions')
        .select('order_id')
        .eq('provider_transaction_id', event.data.object.id)
        .single();
      
      await tenantDb
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'processing',
        })
        .eq('id', transaction.order_id);
      
      // Trigger SHEIN order if applicable
      await supabase.functions.invoke('place-shein-order', {
        body: { 
          organizationId, 
          customerOrderId: transaction.order_id 
        }
      });
      
      break;
      
    case 'payment_intent.payment_failed':
      await tenantDb
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          failure_reason: event.data.object.last_payment_error?.message,
        })
        .eq('provider_transaction_id', event.data.object.id);
      break;
      
    case 'account.updated':
      // Update provider account status
      await tenantDb
        .from('payment_providers')
        .update({
          stripe_account_status: event.data.object.charges_enabled ? 'active' : 'restricted',
          capabilities: event.data.object.capabilities,
        })
        .eq('stripe_account_id', event.account);
      break;
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

## 📊 Admin Dashboard - Payment Overview

```typescript
// src/components/admin/PaymentDashboard.tsx

export function PaymentDashboard() {
  const { tenantDb } = useStore();
  
  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const { data } = await tenantDb
        .from('payment_transactions')
        .select('amount, platform_fee, net_amount, status')
        .gte('created_at', thirtyDaysAgo());
      
      return {
        totalRevenue: data.reduce((sum, t) => sum + t.amount, 0),
        platformFees: data.reduce((sum, t) => sum + t.platform_fee, 0),
        netRevenue: data.reduce((sum, t) => sum + t.net_amount, 0),
        successRate: (data.filter(t => t.status === 'succeeded').length / data.length) * 100,
      };
    }
  });
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard 
        title="Total Revenue" 
        value={formatCurrency(stats?.totalRevenue)} 
      />
      <StatCard 
        title="Platform Fees" 
        value={formatCurrency(stats?.platformFees)} 
      />
      <StatCard 
        title="Net Revenue" 
        value={formatCurrency(stats?.netRevenue)} 
        highlight 
      />
      <StatCard 
        title="Success Rate" 
        value={`${stats?.successRate?.toFixed(1)}%`} 
      />
    </div>
  );
}
```

## 🚀 Implementation Roadmap

### Week 1: Stripe Connect Setup
- [ ] Create Stripe Platform account
- [ ] Database schema for payment providers
- [ ] `create-stripe-connect-account` edge function
- [ ] Onboarding flow UI

### Week 2: Payment Processing
- [ ] `create-payment-intent` with connected accounts
- [ ] Frontend payment form per store
- [ ] Webhook handler per tenant
- [ ] Transaction tracking

### Week 3: Alternative Providers
- [ ] Mollie integration (NL/EU stores)
- [ ] PayPal integration
- [ ] Provider selection UI
- [ ] Multi-provider support

### Week 4: Admin & Reporting
- [ ] Payment dashboard per store
- [ ] Refund management
- [ ] Payout scheduling
- [ ] Financial reports

## 💰 Commission Model

### Platform Fee Options

**Option 1: Percentage Fee**
```
Customer pays: €100
Platform fee: 2% = €2
Store owner gets: €98
Stripe fee: ~€0.29 (paid by store owner)
```

**Option 2: Fixed Fee per Transaction**
```
Customer pays: €100
Platform fee: €0.50
Store owner gets: €99.50
```

**Option 3: Subscription + Reduced Fee**
```
Monthly subscription: €79
Transaction fee: 0.5% (instead of 2%)
```

### Implementation
```typescript
// Platform fee calculation
const platformFee = Math.max(
  (amount * provider.platform_fee_percentage / 100),
  provider.platform_fee_fixed
);

// Create payment with application fee
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount,
  application_fee_amount: platformFee, // Goes to platform
}, {
  stripeAccount: storeStripeAccountId, // Store receives (amount - fee)
});
```

## 🔐 Security & Compliance

### PCI Compliance
- ✅ Stripe handles all card data (PCI Level 1)
- ✅ No card data stored in our database
- ✅ Stripe Elements for secure card input

### KYC/AML
- ✅ Stripe Connect handles identity verification
- ✅ Store owners must complete onboarding
- ✅ Platform can restrict accounts if needed

### Data Protection
```typescript
// NEVER store sensitive data
const payment_providers = {
  stripe_account_id: 'acct_xxx', // ✅ Safe to store
  stripe_publishable_key: 'pk_xxx', // ✅ Safe to store
  // ❌ NEVER store: stripe_secret_key, card numbers, CVV
};
```

---

**Volgende:** [Shopping Feeds per Tenant](./07-shopping-feeds-per-tenant.md) →
