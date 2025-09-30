# 🚀 Quick Start Guide - Multi-Tenant Platform

**Voor:** Developers die snel aan de slag willen  
**Tijd:** 15 minuten lezen, dan actie!

## 📋 Snelle Samenvatting

**Wat bouwen we?**  
Een Shopify-clone waarbij elke webshop een eigen database krijgt via Neon API.

**Huidige status?**  
60% klaar - basis werkt, maar kritieke architectuur moet worden omgebouwd.

**Volgende stap?**  
Database-per-tenant implementeren (Week 1-4).

## 🎯 Het Grote Plaatje

```
┌─────────────────────────────────────────────────┐
│         CUSTOMER EXPERIENCE                      │
│                                                  │
│  1. Bezoekt: mystorename.myaurelio.com          │
│  2. Koopt product (geïmporteerd van SHEIN)      │
│  3. Order → Automatisch naar SHEIN leverancier  │
│  4. Track & Trace updates via Track123          │
│  5. AI Support chat indien nodig                │
│  6. Email marketing automation                   │
└─────────────────────────────────────────────────┘
                        ↕️
┌─────────────────────────────────────────────────┐
│         STORE OWNER EXPERIENCE                   │
│                                                  │
│  1. Maakt store via wizard (10 min)             │
│  2. Kiest thema of importeert eigen thema       │
│  3. Import producten via Chrome Extension       │
│  4. Orders komen automatisch binnen              │
│  5. SHEIN order wordt automatisch geplaatst     │
│  6. Verdient margin zonder voorraad              │
└─────────────────────────────────────────────────┘
                        ↕️
┌─────────────────────────────────────────────────┐
│         PLATFORM ARCHITECTURE                    │
│                                                  │
│  Central DB (Supabase)                          │
│  ├── Organizations                              │
│  ├── Users & Auth                               │
│  └── Tenant DB Registry                         │
│                                                  │
│  Tenant DBs (Neon) - One per store!             │
│  ├── Store 1: Products, Orders, Customers       │
│  ├── Store 2: Products, Orders, Customers       │
│  └── Store N: Products, Orders, Customers       │
│                                                  │
│  Shared Services (Edge Functions)               │
│  ├── AI Chatbot (OpenAI)                       │
│  ├── Email Marketing (Resend)                  │
│  ├── Track & Trace (Track123)                  │
│  └── SHEIN Import & Ordering                   │
└─────────────────────────────────────────────────┘
```

## 🔥 Wat MOET je weten

### 1. Database Architectuur (KRITIEK!)

**NU (moet weg):**
```typescript
// Shared database met Row-Level Security
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('organization_id', orgId); // RLS overhead!
```

**STRAKS (database-per-tenant):**
```typescript
// Elke store heeft eigen database
const tenantDb = await getTenantDatabase(orgId);
const { data } = await tenantDb
  .from('products')
  .select('*'); // No organization_id needed!
```

**Waarom?**
- ✅ Volledige data isolatie
- ✅ Betere performance (geen RLS overhead)
- ✅ Makkelijker schalen
- ✅ GDPR compliant (delete DB = delete alles)

### 2. Subdomain Routing

**Hoe het werkt:**
```typescript
// 1. User bezoekt: coolstore.myaurelio.com
const subdomain = window.location.hostname.split('.')[0]; // "coolstore"

// 2. Query organization by subdomain
const { data: store } = await supabase
  .from('organizations')
  .select('*')
  .eq('subdomain', subdomain)
  .single();

// 3. Get tenant database for this store
const tenantDb = await getTenantDatabase(store.id);

// 4. All queries now go to store-specific DB
const products = await tenantDb.from('products').select('*');
```

### 3. SHEIN Integration Flow

**Import → Sell → Auto-Order:**
```
1. Chrome Extension scrapes SHEIN product
   ↓
2. Calculate selling price (supplier price + markup %)
   ↓
3. Create product in store (optional auto-approve)
   ↓
4. Customer orders product
   ↓
5. Trigger: place-shein-order edge function
   ↓
6. SHEIN API: Place order at supplier
   ↓
7. Get tracking number from SHEIN
   ↓
8. Update customer order with tracking
   ↓
9. Track123 webhook updates status
   ↓
10. Customer gets email updates
```

### 4. Theme Systeem

**Export & Share:**
```typescript
// 1. Capture current theme
const theme = {
  colors: { primary: '#000', secondary: '#666' },
  typography: { headingFont: 'Inter' },
  components: { button: {...}, card: {...} }
};

// 2. Export as JSON
downloadJSON(theme, 'my-theme.json');

// 3. Share with AI or developer
// "Here's my theme, make it better!"

// 4. Import improved theme
importTheme('improved-theme.json');

// 5. Preview & apply
applyTheme(theme);
```

## 📁 Documentatie Structure

```
progression/
├── README.md                              ← Start hier
├── 00-quick-start.md                     ← Dit bestand
├── 01-current-state-analysis.md          ← Wat werkt al?
├── 02-database-per-tenant-architecture.md ← KRITIEK: Neon setup
├── 03-theme-system-architecture.md       ← Theme export/import
├── 04-shein-import-ordering-system.md    ← SHEIN integratie
└── 05-complete-implementation-roadmap.md ← 20-weken plan
```

## 🚦 Start Checklist

### Stap 1: Begrijp de basis (30 min)
- [ ] Lees: [01-current-state-analysis.md](./01-current-state-analysis.md)
- [ ] Begrijp: Wat werkt al (60%) vs wat moet nog (40%)
- [ ] Noteer: Welke features zijn voor jou prioriteit

### Stap 2: Database Architectuur (1 uur)
- [ ] Lees: [02-database-per-tenant-architecture.md](./02-database-per-tenant-architecture.md)
- [ ] Begrijp: Waarom database-per-tenant
- [ ] Bekijk: Neon API documentation
- [ ] Maak: Neon account aan (gratis tier)

### Stap 3: Features Begrijpen (1 uur)
- [ ] Lees: [03-theme-system-architecture.md](./03-theme-system-architecture.md)
- [ ] Lees: [04-shein-import-ordering-system.md](./04-shein-import-ordering-system.md)
- [ ] Begrijp: Hoe theme export werkt
- [ ] Begrijp: SHEIN auto-ordering flow

### Stap 4: Implementatie Plan (30 min)
- [ ] Lees: [05-complete-implementation-roadmap.md](./05-complete-implementation-roadmap.md)
- [ ] Noteer: Welke weken zijn relevant voor jou
- [ ] Plan: Je eerste week taken

## 🛠️ Development Setup (5 min)

### Requirements
```bash
# Node.js 18+
node -v

# Install dependencies
npm install

# Supabase CLI (optional)
npm install -g supabase

# Environment variables
cp .env.example .env.local
# Add your API keys:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - NEON_API_KEY (coming soon)
```

### Run Locally
```bash
# Development server
npm run dev

# Visit: http://localhost:5173
# or: http://aurelioliving.localhost:5173 (test subdomain)
```

## 📊 Quick Stats

| Metric | Status |
|--------|--------|
| **Completion** | 60% |
| **Database Tables** | 50+ tables |
| **Edge Functions** | 12 functions |
| **Admin Components** | 55 components |
| **Features Working** | T&T, AI, Email, Import ✅ |
| **Critical Missing** | DB-per-tenant, SHEIN ordering |
| **Time to MVP** | 20 weken |
| **Team Needed** | 2 devs + 1 devops |

## 🎯 Eerste Taken (Deze Week)

### Voor Backend Dev
1. **Neon Setup** (2 uur)
   - Maak Neon account
   - Get API key
   - Test database provisioning API
   - Maak `tenant_databases` table in central DB

2. **Edge Function** (4 uur)
   - Build `provision-tenant-database` functie
   - Test met fake organization
   - Implement connection string encryption
   - Save to central registry

3. **Dynamic Connection** (4 uur)
   - Implement `getTenantDatabase()` helper
   - Test database switching
   - Add connection caching
   - Error handling

### Voor Frontend Dev
1. **StoreContext Update** (2 uur)
   - Add `tenantDb` to StoreContext
   - Implement dynamic DB loading
   - Update all components to use `tenantDb`

2. **Theme Export UI** (4 uur)
   - Build `ThemeExportImport` component
   - Capture current theme button
   - Export JSON functionality
   - Import & preview theme

3. **Admin Polish** (2 uur)
   - Test all admin components
   - Fix any broken links
   - Improve UX where needed

### Voor DevOps
1. **Infrastructure** (4 uur)
   - Review Neon pricing
   - Plan connection pooling
   - Set up monitoring (basic)
   - Backup strategy (tenant DBs)

## 🔗 Belangrijke Links

### External Services
- [Neon](https://neon.tech) - Database per tenant
- [Supabase](https://supabase.com) - Central registry + Edge Functions
- [Track123](https://www.track123.com) - Shipping tracking
- [Resend](https://resend.com) - Email sending
- [OpenAI](https://openai.com) - AI chatbot

### Documentation
- [React Query](https://tanstack.com/query) - Data fetching
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind](https://tailwindcss.com) - Styling

## 💡 Tips & Tricks

### Debug Subdomain Locally
```typescript
// Override subdomain for testing
localStorage.setItem('debug_subdomain', 'teststore');
window.location.reload();
```

### Test Multi-Tenant Locally
```javascript
// Add to /etc/hosts (Mac/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 store1.localhost
127.0.0.1 store2.localhost

// Then visit: http://store1.localhost:5173
```

### Database Queries Performance
```typescript
// BAD: N+1 query problem
for (const product of products) {
  const category = await db.from('categories').select('*').eq('id', product.category_id).single();
}

// GOOD: Join in one query
const products = await db
  .from('products')
  .select('*, category:categories(*)')
  .limit(20);
```

## 🚨 Common Pitfalls

1. **Forgetting organization_id** (during migration)
   - Oude systeem: Altijd organization_id meegeven
   - Nieuw systeem: Niet meer nodig (eigen DB!)

2. **RLS Policies** (during migration)
   - Oude systeem: RLS policies checken
   - Nieuw systeem: Geen RLS meer (eigen DB!)

3. **Subdomain Detection**
   - Test altijd met echte subdomain
   - Lovable sandbox heeft fake subdomain

4. **Connection Pooling**
   - Cache tenant DB clients
   - Don't create new client per query
   - Clear cache on logout

## 📞 Hulp Nodig?

### Quick Questions
1. Lees eerst de relevante .md in progression/
2. Check de code voorbeelden
3. Zoek in codebase naar vergelijkbare implementatie

### Blockers
1. Document het probleem
2. Check edge function logs (Supabase dashboard)
3. Test met kleinere scope eerst

### Architecture Vragen
1. Lees: [02-database-per-tenant-architecture.md](./02-database-per-tenant-architecture.md)
2. Begrijp de waarom achter beslissingen
3. Stel specifieke vragen met context

## ✅ Volgende Acties

**JIJ (Developer):**
- [ ] Lees alle progression docs (2 uur)
- [ ] Kies je focus: Backend, Frontend, of DevOps
- [ ] Start met Week 1 taken uit roadmap
- [ ] Daily updates in team chat

**TEAM:**
- [ ] Daily standup (15 min)
- [ ] Code review cycle (elke PR)
- [ ] Weekly demo (vrijdag 16:00)
- [ ] Sprint planning (maandag 10:00)

---

**Ready? Let's ship this! 🚀**

Start → [01-current-state-analysis.md](./01-current-state-analysis.md)
