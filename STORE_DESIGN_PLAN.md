# 🎨 Store Design Plan - Aurelio Living & Sensationals

## Overzicht

Dit document beschrijft het complete design en branding voor beide webshops.

---

## 1. Aurelio Living (aurelioliving.myaurelio.com)

### 🎯 Positionering
**"Premium Furniture & Home Decor"**
- Target: 25-45 jaar, woonliefhebbers, design-bewust
- Stijl: Modern, luxe, minimalistisch
- Prijs segment: Mid-high range (€200 - €5000)

### 🎨 Branding

#### Kleuren Palet
```css
--primary: #1a1a1a         /* Deep Black - luxe, tijdloos */
--secondary: #B8860B        /* Dark Goldenrod - accent, warmte */
--accent: #F5F5DC          /* Beige - neutraliteit, elegantie */
--background: #FFFFFF       /* Pure White - clean, spacious */
--text: #2D2D2D            /* Charcoal - leesbaar, sophistication */
```

#### Typography
```css
/* Headers */
font-family: 'Playfair Display', serif;  /* Elegant, luxueus */
font-weight: 600-700;

/* Body Text */
font-family: 'Inter', sans-serif;        /* Modern, leesbaar */
font-weight: 400-500;

/* Accents */
font-family: 'Cormorant Garamond', serif; /* Verfijnd detail */
```

#### Logo Concept
```
╔══════════════════════════════════╗
║                                  ║
║    AURELIO                       ║
║    ━━━━━━━━━━━                   ║
║    L I V I N G                   ║
║                                  ║
║    Premium Home Furniture        ║
║                                  ║
╚══════════════════════════════════╝
```

### 🏠 Homepage Design

#### Hero Section
```
┌────────────────────────────────────────────────┐
│                                                │
│   [Full-width Premium Furniture Image]        │
│                                                │
│   ┌──────────────────────────────────┐        │
│   │  LUXURY LIVING                   │        │
│   │  Crafted for Your Home           │        │
│   │                                  │        │
│   │  [Shop Collection →]  [View All] │        │
│   └──────────────────────────────────┘        │
│                                                │
└────────────────────────────────────────────────┘
```

#### Featured Categories
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   LIVING     │  │   BEDROOM    │  │   DINING     │
│   [Image]    │  │   [Image]    │  │   [Image]    │
│   Shop Now → │  │   Shop Now → │  │   Shop Now → │
└──────────────┘  └──────────────┘  └──────────────┘
```

#### Product Grid
- **Layout:** 4 kolommen desktop, 2 mobiel
- **Hover Effect:** Smooth scale + shadow
- **Quick View:** Modal met 360° product view
- **Wishlist:** Heart icon overlay

### 🛒 Product Page

```
┌─────────────────────┬─────────────────────────┐
│                     │                         │
│  [Main Image]       │  Product Name           │
│                     │  ★★★★★ (24 reviews)     │
│  [Thumbnails]       │                         │
│  [O O O O O]        │  €1,299.00              │
│                     │                         │
│                     │  [Color Selection]      │
│                     │  [Size Selection]       │
│                     │                         │
│                     │  [Add to Cart]          │
│                     │  [❤ Wishlist]           │
│                     │                         │
│                     │  Description            │
│                     │  • Premium materials    │
│                     │  • Handcrafted          │
│                     │  • Free delivery        │
│                     │                         │
└─────────────────────┴─────────────────────────┘
```

### 📱 Mobile Optimalisatie
- Sticky "Add to Cart" button
- Swipeable image gallery
- Collapsible product details
- Bottom navigation voor categories

---

## 2. Sensationals (sensationals.myaurelio.com)

### 🎯 Positionering
**"Trending Products & Lifestyle Essentials"**
- Target: 18-35 jaar, trend-bewust, impulsief
- Stijl: Fris, energiek, modern
- Prijs segment: Accessible (€10 - €200)

### 🎨 Branding

#### Kleuren Palet
```css
--primary: #FF6B6B         /* Coral Red - energie, actie */
--secondary: #4ECDC4        /* Turquoise - fris, modern */
--accent: #FFE66D          /* Sunshine Yellow - vrolijkheid */
--background: #F7F7F7       /* Light Gray - clean canvas */
--text: #2D3436            /* Dark Gray - modern contrast */
```

#### Typography
```css
/* Headers */
font-family: 'Poppins', sans-serif;      /* Moderne, impact */
font-weight: 600-800;

/* Body Text */
font-family: 'DM Sans', sans-serif;      /* Clean, friendly */
font-weight: 400-500;

/* Accents */
font-family: 'Fredoka', sans-serif;      /* Playful touches */
```

#### Logo Concept
```
╔══════════════════════════════════╗
║                                  ║
║    SENSATIONALS ✨                ║
║    ━━━━━━━━━━━━━━━                ║
║    Trending Lifestyle            ║
║                                  ║
╚══════════════════════════════════╝
```

### 🏠 Homepage Design

#### Hero Section
```
┌────────────────────────────────────────────────┐
│                                                │
│   NEW ARRIVALS 🔥                             │
│                                                │
│   [Dynamic Carousel - Trending Products]       │
│                                                │
│   ┌──────────────────────────────────┐        │
│   │  SENSATIONAL DEALS                │        │
│   │  Up to 50% OFF                    │        │
│   │                                   │        │
│   │  [Shop Now 🛍️]  [Trending →]      │        │
│   └──────────────────────────────────┘        │
│                                                │
└────────────────────────────────────────────────┘
```

#### Trending Categories
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   🎧 TECH    │  │   👕 FASHION │  │   🏠 HOME     │
│   Hot Items  │  │   Trending   │  │   Essentials │
│   Shop →     │  │   Shop →     │  │   Shop →     │
└──────────────┘  └──────────────┘  └──────────────┘
```

#### Product Grid
- **Layout:** Grid met featured items (verschillende sizes)
- **Badges:** "NEW", "HOT", "50% OFF"
- **Quick Add:** Direct add to cart button
- **Social Proof:** "🔥 23 mensen bekijken dit nu"

### 🛒 Product Page

```
┌─────────────────────┬─────────────────────────┐
│                     │                         │
│  [Main Image]       │  Product Name 🔥        │
│  📸 360° View       │  ⭐⭐⭐⭐⭐ (156 reviews) │
│                     │                         │
│  [Image Gallery]    │  €29.99 ~~€59.99~~      │
│  ○ ● ○ ○            │  50% OFF Today!         │
│                     │                         │
│                     │  [Variant Selection]    │
│                     │                         │
│                     │  🚀 Free Shipping       │
│                     │  ✓ 30 Day Returns       │
│                     │                         │
│                     │  [🛒 Add to Cart]       │
│                     │  [⚡ Buy Now]            │
│                     │                         │
│                     │  💬 153 people love this│
│                     │                         │
└─────────────────────┴─────────────────────────┘
```

### 📱 Mobile Optimalisatie
- Prominent discount badges
- Thumb-friendly add to cart
- Instagram-style image swiping
- Quick checkout option

---

## 3. Admin Panel Improvements

### 🎛️ Store Selector (Top Bar)

#### Current State
```typescript
// Al aanwezig in src/pages/Admin.tsx regel 198-200
{currentOrganization && (
  <OrganizationSwitcher onCreateNew={() => setShowCreateStore(true)} />
)}
```

#### Enhanced Design
```
┌─────────────────────────────────────────────────┐
│  [🏠 Admin Panel]                               │
│                                                 │
│  ┌────────────────────┐                        │
│  │ 🏢 Aurelio Living  │ ▼                      │
│  └────────────────────┘                        │
│                                                 │
│  [+ Nieuwe Store]  [user@email.com]  [Logout]  │
└─────────────────────────────────────────────────┘

Dropdown Menu:
┌─────────────────────────────────────┐
│  Huidige Store                      │
│  ┌───────────────────────────────┐  │
│  │ 🏢 Aurelio Living             │  │
│  │ 🟢 Actief • Premium Plan       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ─────────────────────────────────  │
│  Wissel van Store                   │
│                                     │
│  • ✨ Sensationals                  │
│    🟡 Trial • Starter Plan          │
│                                     │
│  ─────────────────────────────────  │
│  + Nieuwe Store Maken               │
└─────────────────────────────────────┘
```

### 🚀 Store Selection on Login

#### Flow Diagram
```
Login (/admin/auth)
       ↓
   [Auth Success]
       ↓
   Check Organizations
       ↓
┌──────┴────────┐
│               │
0 Stores    1+ Stores
│               │
↓               ↓
Show           Check Last
Onboarding     Active Store
│               │
↓               ↓
Create         Load Dashboard
First Store    with Store
│               │
↓               ↓
└───→ Admin Panel ←─┘
```

#### Welcome Screen (No Stores)
```
┌─────────────────────────────────────────┐
│                                         │
│        🎉 Welkom bij Aurelio!          │
│                                         │
│   Laten we je eerste webshop opzetten  │
│                                         │
│   ┌─────────────────────────────┐      │
│   │  Wat voor soort shop?       │      │
│   │                             │      │
│   │  ○ Fashion & Lifestyle      │      │
│   │  ○ Furniture & Home Decor   │      │
│   │  ○ Electronics & Tech       │      │
│   │  ○ Andere                   │      │
│   └─────────────────────────────┘      │
│                                         │
│   [Volgende Stap →]                    │
│                                         │
└─────────────────────────────────────────┘
```

#### Store Selection (Multiple Stores)
```
┌─────────────────────────────────────────┐
│                                         │
│    Welke webshop wil je beheren?       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🏢 Aurelio Living              │   │
│  │  Premium Furniture              │   │
│  │  aurelioliving.myaurelio.com    │   │
│  │  📊 156 producten • €45k sales  │   │
│  │  [Beheren →]                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ✨ Sensationals                │   │
│  │  Trending Lifestyle             │   │
│  │  sensationals.myaurelio.com     │   │
│  │  📊 0 producten • Nieuw         │   │
│  │  [Setup →]                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Nieuwe Store Maken]                │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. Implementatie Plan

### Week 1: Admin Improvements
- [x] OrganizationSwitcher in top bar (✅ al aanwezig)
- [ ] Store selection screen bij login
- [ ] Last active store remembering (localStorage)
- [ ] Quick store stats in switcher

### Week 2: Aurelio Living Design
- [ ] Theme configuration in admin
- [ ] Color scheme setup
- [ ] Typography implementation
- [ ] Homepage hero section
- [ ] Product grid layout
- [ ] Product detail page

### Week 3: Sensationals Design
- [ ] Separate theme configuration
- [ ] Modern color scheme
- [ ] Dynamic product badges
- [ ] Trending section
- [ ] Quick buy functionality
- [ ] Social proof features

### Week 4: Mobile & Polish
- [ ] Mobile navigation voor beide stores
- [ ] Touch gestures
- [ ] Performance optimization
- [ ] A/B testing setup
- [ ] Analytics integration

---

## 5. Feature Comparison

| Feature | Aurelio Living | Sensationals |
|---------|---------------|--------------|
| **Stijl** | Luxe, Minimalistisch | Fris, Energiek |
| **Target** | 25-45 jaar | 18-35 jaar |
| **Prijs** | €200-€5000 | €10-€200 |
| **Navigation** | Classic dropdown | Sticky filters |
| **Product Images** | 360° view | Instagram style |
| **Checkout** | Trust badges | Quick buy |
| **Social Proof** | Professional reviews | Real-time viewers |
| **Shipping** | Premium packaging | Free & fast |

---

## 6. Technical Implementation

### Theme System Architecture
```typescript
// src/lib/theme-config.ts
export const storeThemes = {
  aurelioliving: {
    colors: {
      primary: '#1a1a1a',
      secondary: '#B8860B',
      accent: '#F5F5DC',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter',
    },
    layout: {
      productGrid: 4,
      spacing: 'comfortable',
      borderRadius: 'minimal',
    }
  },
  sensationals: {
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
    },
    fonts: {
      heading: 'Poppins',
      body: 'DM Sans',
    },
    layout: {
      productGrid: 'masonry',
      spacing: 'compact',
      borderRadius: 'rounded',
    }
  }
};
```

### Store-Specific Components
```typescript
// src/components/storefront/AurelioLivingHero.tsx
// src/components/storefront/SensationalsHero.tsx
// src/components/storefront/StoreProductCard.tsx (with theme variants)
```

---

## 7. Admin UX Improvements Needed

### Huidige Situatie
```typescript
// src/pages/Admin.tsx (regel 198-200)
{currentOrganization && (
  <OrganizationSwitcher onCreateNew={() => setShowCreateStore(true)} />
)}
```

### Verbeteringen

#### 1. Store Info in Top Bar
```tsx
<div className="flex items-center gap-4">
  <h1 className="font-semibold">Admin Panel</h1>
  <Separator orientation="vertical" className="h-6" />
  <OrganizationSwitcher onCreateNew={() => setShowCreateStore(true)} />
  <Badge variant="outline">
    {currentOrganization?.subdomain}.myaurelio.com
  </Badge>
</div>
```

#### 2. Login Flow met Store Selectie
```tsx
// src/pages/AdminAuth.tsx - na successful login
useEffect(() => {
  if (user && userOrganizations.length === 0) {
    navigate('/admin/welcome'); // Onboarding
  } else if (user && userOrganizations.length === 1) {
    navigate('/admin'); // Direct to dashboard
  } else if (user && userOrganizations.length > 1) {
    navigate('/admin/select-store'); // Store selection
  }
}, [user, userOrganizations]);
```

---

## 📋 Next Actions

### Jij moet:
1. ✅ Run migration (20250930170000_setup_store_subdomains.sql)
2. ✅ Verifieer beide stores in database
3. ✅ Test OrganizationSwitcher in /admin top bar
4. 🔜 Kies design direction voor elke store
5. 🔜 Upload logo's en branding assets

### Ik ga bouwen:
1. Store selection screen bij login
2. Enhanced top bar met store info
3. Theme configuration per store
4. Store-specific homepage templates

---

**Status:** Design plan compleet ✅  
**Ready for:** Implementation & Testing
