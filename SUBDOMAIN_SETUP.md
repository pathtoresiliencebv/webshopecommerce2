# Subdomain Setup Guide

## Overzicht

Het Aurelio platform ondersteunt meerdere webshops via subdomeinen. Elke webshop heeft zijn eigen subdomain onder `.myaurelio.com`.

## Geconfigureerde Subdomeinen

### 1. Aurelio Living (Meubel Webshop)
- **URL:** `aurelioliving.myaurelio.com`
- **Subdomain:** `aurelioliving`
- **Slug:** `aurelioliving`
- **Database:** `organizations.subdomain = 'aurelioliving'`

### 2. Sensationals (Nieuwe Webshop)
- **URL:** `sensationals.myaurelio.com`
- **Subdomain:** `sensationals`
- **Slug:** `sensationals`
- **Database:** `organizations.subdomain = 'sensationals'`

## Hoe Het Werkt

### 1. DNS Configuratie (Lovable)
In Lovable heb je de volgende subdomeinen toegevoegd:
```
✅ aurelioliving.myaurelio.com → Wijst naar jouw Lovable project
✅ sensationals.myaurelio.com → Wijst naar jouw Lovable project
```

### 2. Database Configuratie
De migration `20250930170000_setup_store_subdomains.sql` zorgt voor:
- ✅ Subdomain kolom in `organizations` tabel
- ✅ Index voor snelle subdomain lookups
- ✅ Aurelio Living store met `subdomain = 'aurelioliving'`
- ✅ Sensationals store met `subdomain = 'sensationals'`

### 3. Frontend Detectie (StoreContext)
`src/contexts/StoreContext.tsx` detecteert automatisch:

```typescript
// Browser op: aurelioliving.myaurelio.com
1. Hostname: 'aurelioliving.myaurelio.com'
2. Split: ['aurelioliving', 'myaurelio', 'com']
3. Subdomain: 'aurelioliving'
4. Database query: organizations WHERE subdomain = 'aurelioliving'
5. ✅ Laadt Aurelio Living store

// Browser op: sensationals.myaurelio.com
1. Hostname: 'sensationals.myaurelio.com'
2. Split: ['sensationals', 'myaurelio', 'com']
3. Subdomain: 'sensationals'
4. Database query: organizations WHERE subdomain = 'sensationals'
5. ✅ Laadt Sensationals store
```

## Deployment Stappen

### 1. Migratie Uitvoeren
```bash
# In Supabase dashboard of via CLI
supabase migration up

# Of direct in SQL Editor:
# Run: supabase/migrations/20250930170000_setup_store_subdomains.sql
```

### 2. Verifiëren
```sql
-- Check of stores bestaan met subdomeinen
SELECT id, name, slug, subdomain 
FROM public.organizations 
WHERE subdomain IN ('aurelioliving', 'sensationals');

-- Verwacht resultaat:
-- | id | name | slug | subdomain |
-- |----|------|------|-----------|
-- | ... | Aurelio Living | aurelioliving | aurelioliving |
-- | ... | Sensationals | sensationals | sensationals |
```

### 3. Testen in Browser

#### Test Aurelio Living:
1. Ga naar: `aurelioliving.myaurelio.com`
2. Open console (F12)
3. Zoek naar: `"✅ Successfully loaded store"` en `"Aurelio Living"`
4. Check dat producten van Aurelio Living worden getoond

#### Test Sensationals:
1. Ga naar: `sensationals.myaurelio.com`
2. Open console (F12)
3. Zoek naar: `"✅ Successfully loaded store"` en `"Sensationals"`
4. Store is leeg (nieuwe webshop, nog geen producten)

## Nieuwe Webshop Toevoegen

Wil je een nieuwe webshop toevoegen? Volg deze stappen:

### 1. Voeg Subdomain toe in Lovable
```
Settings → Domains → Add Subdomain
Bijvoorbeeld: nieuweshop.myaurelio.com
```

### 2. Voeg Store toe in Database
```sql
INSERT INTO public.organizations (
  name,
  slug,
  subdomain,
  description,
  created_at,
  updated_at
)
VALUES (
  'Nieuwe Shop',
  'nieuweshop',
  'nieuweshop',
  'Beschrijving van de nieuwe shop',
  NOW(),
  NOW()
);
```

### 3. Test
Ga naar `nieuweshop.myaurelio.com` - de store wordt automatisch geladen!

## Troubleshooting

### Store wordt niet geladen?

**Check 1: DNS Configuratie**
```
✅ Is subdomain toegevoegd in Lovable?
✅ Wijst het naar het juiste project?
✅ Wacht 5-10 minuten voor DNS propagatie
```

**Check 2: Database**
```sql
-- Check of store bestaat
SELECT * FROM public.organizations WHERE subdomain = 'jouwsubdomain';

-- Als niet gevonden, voeg toe:
INSERT INTO public.organizations (name, slug, subdomain)
VALUES ('Store Naam', 'store-slug', 'jouwsubdomain');
```

**Check 3: Browser Console**
```
Open console (F12)
Zoek naar logs:
- "🔍 DNS Debug Info"
- "Detected valid subdomain"
- "✅ Successfully loaded store"
```

### Verkeerde Store wordt geladen?

**Scenario:** `sensationals.myaurelio.com` laadt Aurelio Living

**Fix:**
```sql
-- Check subdomain velden
SELECT id, name, subdomain FROM public.organizations;

-- Update indien nodig
UPDATE public.organizations
SET subdomain = 'sensationals'
WHERE slug = 'sensationals';
```

### Fallback Gedrag

Als geen store wordt gevonden, laadt het systeem automatisch:
```typescript
Fallback: organizations WHERE subdomain = 'aurelioliving'
```

Dit voorkomt dat de site crasht als een subdomain niet bestaat.

## Technische Details

### StoreContext Flow
```typescript
1. useEffect detecteert subdomain van URL
2. Query: organizations WHERE subdomain = '{detected}'
3. Als gevonden → setStore(data)
4. Als niet gevonden → fallback naar 'aurelioliving'
5. tenantDb wordt geïnitialiseerd per store
```

### Database Schema
```sql
public.organizations:
- id: UUID (PK)
- name: TEXT
- slug: TEXT (UNIQUE)
- subdomain: TEXT (UNIQUE, INDEXED)
- description: TEXT
- domain: TEXT (custom domains)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Volgende Stappen

Na deployment:
- [ ] Run migratie `20250930170000_setup_store_subdomains.sql`
- [ ] Verifieer stores in database
- [ ] Test `aurelioliving.myaurelio.com`
- [ ] Test `sensationals.myaurelio.com`
- [ ] Voeg producten toe aan Sensationals via admin panel
- [ ] Configureer aparte Stripe accounts per store
- [ ] Genereer shopping feeds per store

---

**Status:** ✅ Ready for deployment
**Last Updated:** 2025-09-30
