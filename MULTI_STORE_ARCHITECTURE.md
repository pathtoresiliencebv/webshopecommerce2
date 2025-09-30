# Multi-Store Architectuur - Complete Overzicht

**Datum:** 30 September 2025  
**Project:** Aurelio Multi-Store Platform (Shopify Clone)

## 🏗️ Architectuur Overzicht

### **Per Store (Tenant Database)**
Elke webshop heeft zijn **eigen tenant database** met:

```
✅ Producten (volledig gescheiden per store)
✅ Collecties
✅ Orders
✅ Klanten
✅ Thema configuratie
✅ Betaalmethoden (Stripe Connect per store)
✅ Shopping Feeds (Google, Facebook, TikTok per store)
✅ Import history (geïmporteerde producten)
```

### **Globaal (Centrale Database met Store Branding)**
Globale features die **alle stores** kunnen gebruiken, maar met **store-specifieke branding**:

```
✅ Track & Trace (toont logo van de store waar de order vandaan komt)
✅ Customer Service / AI Chatbot (toont logo van geselecteerde store)
✅ Email Marketing (toont logo in email templates)
✅ Admin Panel (toont geselecteerde store logo)
✅ User Management (centrale auth, maar per store toegang)
✅ Platform Admin (Super Admin functies)
```

---

## 📊 Database Structuur

### **Centrale Supabase Database (public schema)**
```sql
-- Platform-level tables
organizations (stores)
organization_users (user access per store)
subscriptions (billing per store)
theme_templates (global theme marketplace)
user_theme_library (saved themes)

-- Global features
tracking_orders (global track & trace)
support_tickets (customer service)
email_campaigns (centraal beheerd, per store verstuurd)
```

### **Tenant Databases (Neon - per store)**
```sql
-- E-commerce tables (per store isolated)
products
collections
orders
order_items
customers
addresses
reviews

-- Store-specific settings
store_theme_config
payment_providers
shopping_feed_configs
imported_products (from SHEIN/AliExpress)
```

---

## 🎯 Hoe het Werkt

### **1. Subdomain Routing**
```
aurelioliving.myaurelio.com  → Aurelio Living Store
sensationals.myaurelio.com   → Sensationals Store
```

**StoreContext detecteert subdomain:**
```typescript
// src/contexts/StoreContext.tsx
const subdomain = window.location.hostname.split('.')[0];
// Load store from organizations table
// Connect to tenant database
const tenantDb = await getTenantDatabase(store.id);
```

---

### **2. Product Isolatie**
Elke store heeft **eigen producten** in zijn tenant database:

```typescript
// Aurelio Living products → Aurelio Tenant DB
// Sensationals products → Sensationals Tenant DB

// ProductImportList component
const organizationId = store?.id || currentOrganization?.id;
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('organization_id', organizationId)
  .not('source_platform', 'is', null);
```

**Import Flow:**
1. Chrome Extension → Selecteer store (dropdown)
2. Import product van SHEIN
3. Product wordt opgeslagen in tenant database van geselecteerde store
4. Zichtbaar in `/admin → Products → Import List`

---

### **3. Globale Features met Store Branding**

#### **Track & Trace**
```typescript
// Track & Trace pagina toont logo van de store waar order vandaan komt
const order = await supabase
  .from('orders')
  .select('*, organization:organizations(*)')
  .eq('tracking_number', trackingNumber)
  .single();

// Toon logo van order.organization
<img src={order.organization.logo_url} alt={order.organization.name} />
```

#### **Email Marketing**
```typescript
// Email template gebruikt logo van geselecteerde store
const emailHTML = `
  <img src="${currentOrganization.logo_url}" alt="${currentOrganization.name}" />
  <h1>Welkom bij ${currentOrganization.name}</h1>
`;
```

#### **Customer Service / AI Chat**
```typescript
// Chatbot gebruikt branding van huidige store
const chatWidget = {
  storeName: store.name,
  storeLogo: store.logo_url,
  primaryColor: store.theme_config.colors.primary,
};
```

---

## 📦 Feature Matrix

| Feature | Per Store | Globaal | Store Branding |
|---------|-----------|---------|----------------|
| **Producten** | ✅ Tenant DB | ❌ | - |
| **Orders** | ✅ Tenant DB | ❌ | - |
| **Klanten** | ✅ Tenant DB | ❌ | - |
| **Thema** | ✅ Tenant DB | ❌ | - |
| **Stripe** | ✅ Per store | ❌ | - |
| **Shopping Feeds** | ✅ Per store | ❌ | - |
| **Import List** | ✅ Per store | ❌ | - |
| **Track & Trace** | ❌ | ✅ Central | ✅ Logo + Order |
| **Customer Service** | ❌ | ✅ Central | ✅ Logo + Theme |
| **Email Marketing** | ❌ | ✅ Central | ✅ Logo in Templates |
| **User Management** | ❌ | ✅ Central | ✅ Per store access |

---

## 🚀 Implementatie Status

### **✅ Compleet**
- [x] Tenant Database Infrastructure (Neon)
- [x] Store Subdomain Routing
- [x] Product Isolatie per Store
- [x] Stripe Connect per Store
- [x] Shopping Feeds per Store
- [x] Thema Export/Import Systeem
- [x] Admin Product Import List
- [x] Multi-Store Dropdown in Admin
- [x] Sensationals Store toegevoegd

### **🔄 Moet nog worden geïmplementeerd**
- [ ] Track & Trace met Store Branding
- [ ] Email Templates met Dynamic Store Logo
- [ ] AI Chatbot met Store Branding
- [ ] Customer Service met Store Context
- [ ] Store Logo Upload Functionaliteit

---

## 🎨 Store Branding Components

### **Logo Management**
Elke store moet zijn eigen logo kunnen uploaden:

```typescript
// In AdminStoreSettings
const uploadLogo = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('store-logos')
    .upload(`${store.id}/logo.png`, file);

  await supabase
    .from('organizations')
    .update({ logo_url: data.path })
    .eq('id', store.id);
};
```

### **Dynamic Branding Hook**
```typescript
// src/hooks/useStoreBranding.ts
export function useStoreBranding() {
  const { store } = useStore();
  
  return {
    logo: store?.logo_url || '/lovable-uploads/aurelio-living-logo-new.png',
    name: store?.name || 'Aurelio',
    primaryColor: store?.theme_config?.colors?.primary || '#000000',
    email: store?.email || 'info@myaurelio.com',
    phone: store?.phone || '+31 20 123 4567',
  };
}
```

---

## 📝 Belangrijke Bestanden

### **Store Context**
- `src/contexts/StoreContext.tsx` - Subdomain detectie + tenant DB connection
- `src/lib/tenant-database.ts` - Dynamic tenant DB helper

### **Import Functionaliteit**
- `src/pages/ProductImportList.tsx` - Import list per store
- `chrome-extension/popup.js` - Store selector dropdown
- `supabase/functions/shein-create-order` - SHEIN ordering automation

### **Branding**
- `src/components/StoreDropdown.tsx` - Logo + store switcher
- `src/components/Navigation.tsx` - Store logo in header
- Email templates in `src/components/admin/email/`

---

## 🔧 Volgende Stappen

### **Week 1: Store Branding Completeren**
1. Track & Trace pagina met dynamisch store logo
2. Email templates met dynamic logo placeholder
3. AI Chatbot met store branding
4. Logo upload functionaliteit in admin

### **Week 2: Testing & Polish**
1. Test subdomain routing voor beide stores
2. Test product import per store
3. Test Stripe payments per store
4. Test theme export/import

### **Week 3: Productie**
1. DNS configuratie voor subdomains
2. SSL certificaten per subdomain
3. Google Merchant Center koppeling per store
4. Live testing

---

## 💡 Best Practices

### **Always Check Store Context**
```typescript
// GOED ✅
const { store } = useStore();
const organizationId = store?.id || currentOrganization?.id;

// FOUT ❌
const organizationId = currentOrganization?.id; // Alleen admin context
```

### **Use Tenant Database for Store Data**
```typescript
// GOED ✅
const { tenantDb } = useStore();
const { data } = await tenantDb.from('products').select('*');

// FOUT ❌
const { data } = await supabase.from('products').select('*'); // Central DB
```

### **Include Store Branding Everywhere**
```typescript
// GOED ✅
<img src={store?.logo_url || defaultLogo} alt={store?.name} />

// FOUT ❌
<img src={defaultLogo} alt="Aurelio" /> // Hardcoded
```

---

## 📞 Support & Contact

Voor vragen over de multi-store architectuur:
- **Technical Lead:** [Your Name]
- **Documentation:** `/progression/` folder
- **Architecture:** Dit bestand

**Last Updated:** 30 September 2025
