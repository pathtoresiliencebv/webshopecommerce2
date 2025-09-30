# Tenant E-commerce Schema

> **Status:** ✅ Complete  
> **Date:** 2025-09-30  
> **Migration:** `20250930120000_tenant_ecommerce_schema.sql`

## Overview

Elke webshop krijgt zijn eigen **volledig geïsoleerde database** via Neon met complete e-commerce functionaliteit.

## 🗄️ Database Structuur

### 📦 Products & Catalog (9 tabellen)

```sql
├── categories              # Product categorieën (hiërarchisch)
├── collections            # Curated collecties (manual/automatic)
├── products              # Hoofd producten tabel
├── product_variants      # Varianten (size, color, etc)
├── product_images        # Product afbeeldingen
├── collection_products   # Many-to-many mapping
```

**Features:**
- ✅ Hiërarchische categorieën (parent-child)
- ✅ Manual & automatic collections
- ✅ Product variants (onbeperkt opties)
- ✅ Multiple images per product/variant
- ✅ SEO fields (meta title, description, keywords)
- ✅ SHEIN import tracking (`source_platform`, `source_product_id`)

### 👥 Customers (2 tabellen)

```sql
├── customers             # Klant accounts
├── customer_addresses    # Shipping/billing adressen
```

**Features:**
- ✅ Guest checkout support
- ✅ Optional user account linking
- ✅ Newsletter & marketing preferences
- ✅ Customer lifetime value tracking
- ✅ Multiple addresses per customer

### 🛒 Orders & Sales (3 tabellen)

```sql
├── orders               # Bestellingen
├── order_items         # Line items
├── order_status_history # Status tracking
```

**Features:**
- ✅ Human-readable order numbers
- ✅ Complete pricing breakdown (subtotal, tax, shipping, discounts)
- ✅ Multiple payment statuses
- ✅ Fulfillment tracking
- ✅ Address snapshots (JSONB)
- ✅ Track & Trace integratie

### 💰 Discounts & Promotions (2 tabellen)

```sql
├── discounts           # Kortingscodes
├── discount_usages     # Usage tracking
```

**Features:**
- ✅ Percentage, fixed amount, free shipping
- ✅ Minimum purchase requirements
- ✅ Usage limits (global + per customer)
- ✅ Product/collection targeting
- ✅ Scheduled discounts

### 📊 Inventory Management (3 tabellen)

```sql
├── inventory_locations    # Warehouse locations
├── inventory_levels      # Stock per location
├── inventory_adjustments # Stock bewegingen
```

**Features:**
- ✅ Multi-location support
- ✅ Available vs reserved quantities
- ✅ Stock adjustment logging
- ✅ Automatic triggers

## 🔗 Integratie met Andere Systemen

### Payment Providers (zie `20250930140000`)
```sql
orders → payment_transactions → payment_providers
```

### Shopping Feeds (zie `20250930140000`)
```sql
products → product_feed_items → shopping_feeds
```

### Track & Trace (centraal systeem)
```sql
orders.tracking_number → central tracking API
```

## 📈 Indexes & Performance

**Optimalisatie voor:**
- ✅ Product zoeken (slug, tags, status)
- ✅ Order lookup (number, email, customer)
- ✅ Category browsing (parent-child)
- ✅ Inventory checks (variant + location)
- ✅ Customer history (email, user_id)

## 🔄 Auto-triggers

```sql
-- Automatic timestamp updates
- categories.updated_at
- collections.updated_at
- products.updated_at
- product_variants.updated_at
- customers.updated_at
- orders.updated_at
```

## 🚀 Deployment

**Automatisch toegepast bij:**
1. Nieuwe webshop creatie via wizard
2. `provision-tenant-database` edge function
3. `run-tenant-migrations` edge function

**Migration Runner:**
```typescript
// Draait deze SQL op elke nieuwe Neon database
const migrations = [
  '20250930120000_tenant_ecommerce_schema',      // ← Deze
  '20250930140000_payment_providers_shopping_feeds',
];
```

## 📊 Totale Tabellen per Tenant

| Categorie | Tabellen | Omschrijving |
|-----------|----------|--------------|
| **Products** | 6 | Categories, Collections, Products, Variants, Images |
| **Customers** | 2 | Customers, Addresses |
| **Orders** | 3 | Orders, Items, Status History |
| **Discounts** | 2 | Discounts, Usages |
| **Inventory** | 3 | Locations, Levels, Adjustments |
| **Payments** | 3 | Providers, Transactions, Refunds |
| **Shopping Feeds** | 3 | Feeds, Logs, Product Items |
| **TOTAAL** | **22** | Volledige e-commerce platform per tenant |

## 🎯 Next Steps

- [x] Core e-commerce schema
- [x] Payment providers schema
- [x] Shopping feeds schema
- [ ] SHEIN import integration
- [ ] Admin UI voor product management
- [ ] Storefront componenten

---

**Related:**
- [02-database-per-tenant-architecture.md](./02-database-per-tenant-architecture.md)
- [06-payment-providers-per-tenant.md](./06-payment-providers-per-tenant.md)
- [07-shopping-feeds-per-tenant.md](./07-shopping-feeds-per-tenant.md)
