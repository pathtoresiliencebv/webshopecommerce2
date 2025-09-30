# SHEIN Import & Direct Ordering System

**Datum:** 30 September 2025  
**Feature:** Chrome Extension met SHEIN product import + directe bestelling bij leverancier

## 🎯 Functionaliteit Vereisten

### Huidige Staat ✅
- Chrome extension (Manifest V3)
- Product scraping van SHEIN pagina's
- Bulk product selectie
- Admin authenticatie systeem
- Database tracking (import_jobs, imported_products)

### Nog Te Bouwen ❌
- **Direct ordering bij SHEIN** (koppeling met SHEIN supplier account)
- Automatische order synchronisatie
- Inventory tracking met SHEIN
- Pricing rules engine (markup per webshop)
- Fulfilment workflow

## 🏗️ Architectuur Overzicht

```
┌─────────────────────────────────────────────────────────┐
│            WEBSHOP (myaurelio.com)                      │
│                                                          │
│  Customer Places Order                                  │
│       ↓                                                 │
│  Order saved in tenant database                         │
│       ↓                                                 │
│  Trigger: SHEIN Order Placement                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│      Edge Function: place-shein-order                   │
│                                                          │
│  1. Get product SHEIN ID from imported_products         │
│  2. Calculate supplier pricing                          │
│  3. Place order via SHEIN API/Supplier Portal          │
│  4. Save tracking number                                │
│  5. Update order status                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              SHEIN SUPPLIER API                         │
│                                                          │
│  - Order placement                                      │
│  - Inventory check                                      │
│  - Tracking updates                                     │
│  - Return processing                                    │
└─────────────────────────────────────────────────────────┘
```

## 📊 Database Schema Uitbreiding

### Enhanced Imported Products Table
```sql
-- Update imported_products table
ALTER TABLE imported_products ADD COLUMN IF NOT EXISTS
  shein_product_id TEXT NOT NULL,
  shein_sku TEXT NOT NULL,
  shein_variant_id TEXT,
  
  -- Pricing (from SHEIN)
  supplier_price DECIMAL(10,2) NOT NULL,
  supplier_currency TEXT DEFAULT 'USD',
  
  -- Pricing rules (per store)
  markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
  markup_value DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2), -- Calculated selling price
  
  -- Inventory
  shein_stock_quantity INTEGER DEFAULT 0,
  last_stock_check TIMESTAMPTZ,
  is_available BOOLEAN DEFAULT true,
  
  -- Mapping
  mapped_product_id UUID REFERENCES products(id), -- Created product in store
  
  -- Metadata
  shein_url TEXT NOT NULL,
  shein_images JSONB DEFAULT '[]',
  shein_attributes JSONB DEFAULT '{}', -- sizes, colors, etc.
  
  -- Status
  sync_status TEXT DEFAULT 'pending' 
    CHECK (sync_status IN ('pending', 'synced', 'out_of_stock', 'discontinued'));

-- SHEIN supplier credentials (per organization)
CREATE TABLE shein_supplier_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Credentials (encrypted)
  supplier_id TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT,
  
  -- Settings
  auto_order BOOLEAN DEFAULT false, -- Automatically place order when customer orders
  auto_price_sync BOOLEAN DEFAULT true, -- Sync prices from SHEIN daily
  default_markup_percentage DECIMAL(5,2) DEFAULT 30.00, -- 30% markup
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHEIN orders tracking
CREATE TABLE shein_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Link to customer order
  customer_order_id UUID NOT NULL REFERENCES orders(id),
  
  -- SHEIN order details
  shein_order_id TEXT UNIQUE NOT NULL,
  shein_order_number TEXT NOT NULL,
  
  -- Products
  line_items JSONB NOT NULL DEFAULT '[]', -- [{shein_sku, quantity, price}]
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL, -- What we pay to SHEIN
  
  -- Fulfillment
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'placed', 'confirmed', 'processing', 
      'shipped', 'delivered', 'cancelled', 'failed'
    )),
  
  tracking_number TEXT,
  carrier_code TEXT,
  
  -- Dates
  placed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Metadata
  shein_response JSONB, -- Full API response
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing rules per store
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  rule_name TEXT NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher priority rules apply first
  
  -- Conditions
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all', 'category', 'product', 'supplier')),
  condition_value TEXT, -- Category name, product ID, or supplier ID
  
  -- Pricing
  markup_type TEXT NOT NULL CHECK (markup_type IN ('percentage', 'fixed', 'formula')),
  markup_value DECIMAL(10,2) NOT NULL,
  
  -- Formula support (advanced)
  price_formula TEXT, -- e.g., "supplier_price * 1.3 + 5"
  
  -- Rounding
  round_to DECIMAL(5,2) DEFAULT 0.99, -- Round to X.99
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imported_products_shein_id ON imported_products(shein_product_id);
CREATE INDEX idx_shein_orders_customer_order ON shein_orders(customer_order_id);
CREATE INDEX idx_shein_orders_status ON shein_orders(status);
```

## 🔌 SHEIN API Integration

### Edge Function: Import Product from SHEIN
```typescript
// supabase/functions/import-shein-product/index.ts

interface SheinProduct {
  productId: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  variants: Array<{
    variantId: string;
    sku: string;
    size?: string;
    color?: string;
    price: number;
    stock: number;
  }>;
  attributes: {
    category: string;
    material?: string;
    brand?: string;
  };
}

async function importSheinProduct(
  organizationId: string,
  sheinUrl: string,
  autoApprove: boolean = false
) {
  // 1. Scrape or fetch product data from SHEIN
  const productData = await scrapeSheinProduct(sheinUrl);
  
  // 2. Get pricing rules for this organization
  const pricingRules = await getPricingRules(organizationId);
  
  // 3. Calculate final selling price
  const finalPrice = calculatePrice(productData.price, pricingRules);
  
  // 4. Save to imported_products
  const { data: importedProduct } = await supabase
    .from('imported_products')
    .insert({
      organization_id: organizationId,
      shein_product_id: productData.productId,
      shein_sku: productData.sku,
      shein_url: sheinUrl,
      supplier_price: productData.price,
      supplier_currency: productData.currency,
      final_price: finalPrice,
      shein_images: productData.images,
      shein_attributes: productData.attributes,
      shein_stock_quantity: productData.variants.reduce((sum, v) => sum + v.stock, 0),
      approval_status: autoApprove ? 'approved' : 'pending',
    })
    .select()
    .single();
  
  // 5. If auto-approve, create product in store
  if (autoApprove) {
    await createStoreProduct(organizationId, importedProduct);
  }
  
  return importedProduct;
}

async function createStoreProduct(
  organizationId: string,
  importedProduct: any
) {
  const tenantDb = await getTenantDatabase(organizationId);
  
  // Create product in tenant database
  const { data: product } = await tenantDb
    .from('products')
    .insert({
      name: importedProduct.raw_data.title,
      description: importedProduct.raw_data.description,
      price: importedProduct.final_price,
      sku: `SHEIN-${importedProduct.shein_sku}`,
      images: importedProduct.shein_images,
      is_active: true,
      metadata: {
        source: 'shein',
        shein_product_id: importedProduct.shein_product_id,
      },
    })
    .select()
    .single();
  
  // Link imported product to created product
  await supabase
    .from('imported_products')
    .update({ mapped_product_id: product.id, sync_status: 'synced' })
    .eq('id', importedProduct.id);
  
  return product;
}
```

### Edge Function: Place SHEIN Order
```typescript
// supabase/functions/place-shein-order/index.ts

interface PlaceOrderRequest {
  organizationId: string;
  customerOrderId: string;
  lineItems: Array<{
    productId: string; // Store product ID
    quantity: number;
  }>;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

async function placeSheinOrder(request: PlaceOrderRequest) {
  const { organizationId, customerOrderId, lineItems, shippingAddress } = request;
  
  // 1. Get SHEIN supplier credentials
  const { data: supplierAccount } = await supabase
    .from('shein_supplier_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();
  
  if (!supplierAccount) {
    throw new Error('SHEIN supplier account not configured');
  }
  
  // 2. Get imported product details
  const sheinLineItems = await Promise.all(
    lineItems.map(async (item) => {
      const { data: imported } = await supabase
        .from('imported_products')
        .select('*')
        .eq('mapped_product_id', item.productId)
        .single();
      
      return {
        sku: imported.shein_sku,
        variantId: imported.shein_variant_id,
        quantity: item.quantity,
        price: imported.supplier_price,
      };
    })
  );
  
  // 3. Calculate total cost
  const totalCost = sheinLineItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  
  // 4. Place order via SHEIN API
  const sheinOrderResponse = await fetch(
    'https://api.shein.com/supplier/v1/orders',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decrypt(supplierAccount.api_key_encrypted)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supplier_id: supplierAccount.supplier_id,
        line_items: sheinLineItems,
        shipping_address: shippingAddress,
        reference_number: customerOrderId, // Our order ID
      }),
    }
  );
  
  const sheinOrder = await sheinOrderResponse.json();
  
  if (!sheinOrderResponse.ok) {
    throw new Error(`SHEIN order failed: ${sheinOrder.message}`);
  }
  
  // 5. Save SHEIN order to database
  const { data: savedOrder } = await supabase
    .from('shein_orders')
    .insert({
      organization_id: organizationId,
      customer_order_id: customerOrderId,
      shein_order_id: sheinOrder.order_id,
      shein_order_number: sheinOrder.order_number,
      line_items: sheinLineItems,
      total_cost: totalCost,
      status: 'placed',
      placed_at: new Date().toISOString(),
      shein_response: sheinOrder,
    })
    .select()
    .single();
  
  // 6. Update customer order with SHEIN info
  const tenantDb = await getTenantDatabase(organizationId);
  await tenantDb
    .from('orders')
    .update({
      fulfillment_status: 'processing',
      metadata: {
        shein_order_id: sheinOrder.order_id,
        shein_order_number: sheinOrder.order_number,
      },
    })
    .eq('id', customerOrderId);
  
  return savedOrder;
}
```

### Pricing Rules Engine
```typescript
// src/lib/pricing-engine.ts

interface PricingRule {
  markup_type: 'percentage' | 'fixed' | 'formula';
  markup_value: number;
  price_formula?: string;
  round_to?: number;
}

export function calculatePrice(
  supplierPrice: number,
  rules: PricingRule[]
): number {
  let finalPrice = supplierPrice;
  
  // Apply rules in priority order
  for (const rule of rules) {
    if (rule.markup_type === 'percentage') {
      finalPrice = supplierPrice * (1 + rule.markup_value / 100);
    } else if (rule.markup_type === 'fixed') {
      finalPrice = supplierPrice + rule.markup_value;
    } else if (rule.markup_type === 'formula' && rule.price_formula) {
      // Evaluate formula safely
      finalPrice = evaluateFormula(rule.price_formula, { supplier_price: supplierPrice });
    }
  }
  
  // Round to nearest X.99
  if (rules[0]?.round_to !== undefined) {
    finalPrice = Math.floor(finalPrice) + rules[0].round_to;
  }
  
  return Math.round(finalPrice * 100) / 100;
}

// Example: supplier_price = $10
// Rule 1: 30% markup = $13
// Round to X.99 = $12.99
```

## 📦 Chrome Extension Enhancement

### Add Direct Order Button
```javascript
// chrome-extension/content.js

// Add "Import & Auto-Order" button
function addAutoOrderButton() {
  const importBtn = document.querySelector('.import-to-aurelio');
  
  const autoOrderBtn = document.createElement('button');
  autoOrderBtn.textContent = '⚡ Import + Auto Order Setup';
  autoOrderBtn.className = 'auto-order-btn';
  autoOrderBtn.onclick = async () => {
    const productData = extractProductData();
    
    // Import with auto-order flag
    const response = await chrome.runtime.sendMessage({
      action: 'import-product',
      data: {
        ...productData,
        autoOrder: true, // Enable automatic ordering
        autoApprove: true,
      },
    });
    
    if (response.success) {
      showNotification('Product imported! Orders will auto-forward to SHEIN.');
    }
  };
  
  importBtn.after(autoOrderBtn);
}
```

## 🔄 Automatic Order Workflow

### Order Placed Trigger
```typescript
// Database trigger or Edge Function webhook

// When order is created in tenant database:
CREATE OR REPLACE FUNCTION trigger_shein_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if product is from SHEIN import
  IF EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = NEW.id
    AND p.metadata->>'source' = 'shein'
  ) THEN
    -- Queue SHEIN order placement
    PERFORM pg_notify(
      'shein_order_queue',
      json_build_object(
        'order_id', NEW.id,
        'organization_id', NEW.organization_id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_created_shein_check
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_shein_order();
```

### Background Order Processor
```typescript
// supabase/functions/process-shein-orders/index.ts

// Runs every 5 minutes (cron job)
serve(async (req) => {
  // Get pending SHEIN orders
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('fulfillment_status', 'pending')
    .contains('metadata', { source: 'shein' });
  
  for (const order of pendingOrders) {
    try {
      await placeSheinOrder({
        organizationId: order.organization_id,
        customerOrderId: order.id,
        lineItems: order.order_items,
        shippingAddress: order.shipping_address,
      });
    } catch (error) {
      console.error(`Failed to place SHEIN order for ${order.id}:`, error);
      // Log error, notify admin
    }
  }
});
```

## 📊 Admin Interface

### SHEIN Integration Settings
```typescript
// src/components/admin/AdminSheinSettings.tsx

export function AdminSheinSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">SHEIN Integration</h2>
      
      {/* Supplier Account */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Supplier ID" />
          <Input label="API Key" type="password" />
          <Input label="API Secret" type="password" />
          <Button>Save & Test Connection</Button>
        </CardContent>
      </Card>
      
      {/* Auto-Order Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Ordering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Switch label="Enable automatic order forwarding to SHEIN" />
          <Input 
            label="Default Markup (%)" 
            type="number" 
            defaultValue="30"
            helperText="Applied to all SHEIN products"
          />
          <Switch label="Auto-sync prices daily" />
        </CardContent>
      </Card>
      
      {/* Pricing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingRulesManager />
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🚀 Implementation Roadmap

### Phase 1: Enhanced Import (Week 1)
- [ ] Update database schema
- [ ] Enhanced product scraping (stock, variants)
- [ ] Pricing rules engine
- [ ] Auto-create products option

### Phase 2: SHEIN API Integration (Week 2)
- [ ] SHEIN supplier account setup
- [ ] Order placement API
- [ ] Order status webhooks
- [ ] Tracking integration

### Phase 3: Automation (Week 3)
- [ ] Auto-order on customer purchase
- [ ] Background order processor
- [ ] Inventory sync (daily)
- [ ] Price sync (daily)

### Phase 4: Admin Interface (Week 4)
- [ ] SHEIN settings page
- [ ] Order monitoring dashboard
- [ ] Pricing rules manager
- [ ] Import approval workflow

## 💰 Business Model Impact

### Margin Calculation
```
Customer pays: €29.99 (your store)
SHEIN cost: €10.00 (supplier price)
Shipping: €3.00 (SHEIN to customer)
---
Gross Margin: €16.99 (57% margin)
```

### Automated Workflow Value
- ✅ No manual ordering needed
- ✅ Instant fulfillment trigger
- ✅ Automatic tracking updates
- ✅ Consistent pricing rules
- ✅ Scalable to 1000s of products

**Dit systeem maakt volledig dropshipping mogelijk met minimale handmatige arbeid! 🚀**
