# 🚀 Deployment Checklist - Subdomain Setup

## ✅ Pre-Deployment (JIJ HEBT AL GEDAAN)

- [x] Lovable subdomeinen toegevoegd:
  - [x] `aurelioliving.myaurelio.com`
  - [x] `sensationals.myaurelio.com`

## 📋 Nu Uitvoeren

### Stap 1: Database Migration
```bash
# Optie A: Via Supabase Dashboard
1. Ga naar: https://supabase.com/dashboard/project/[jouw-project]/sql
2. Open: supabase/migrations/20250930170000_setup_store_subdomains.sql
3. Kopieer de hele SQL
4. Plak in SQL Editor
5. Klik "Run"

# Optie B: Via Supabase CLI (als je die hebt)
supabase db push
```

**Verwacht resultaat:**
```sql
✅ Store subdomains configured successfully

| id | name | slug | subdomain |
|----|------|------|-----------|
| ... | Aurelio Living | aurelioliving | aurelioliving |
| ... | Sensationals | sensationals | sensationals |
```

### Stap 2: Verifiëren in Database
```sql
-- Run deze query in Supabase SQL Editor
SELECT 
  id,
  name,
  slug,
  subdomain,
  created_at
FROM public.organizations
WHERE subdomain IN ('aurelioliving', 'sensationals')
ORDER BY name;
```

**✅ Success Check:**
- Je ziet 2 rijen
- Aurelio Living heeft `subdomain = 'aurelioliving'`
- Sensationals heeft `subdomain = 'sensationals'`

### Stap 3: Test in Browser

#### Test 1: Aurelio Living
```
1. Open: https://aurelioliving.myaurelio.com
2. Open Browser Console (F12)
3. Zoek naar logs:
   
   🔍 DNS Debug Info:
     - Hostname: aurelioliving.myaurelio.com
     - Potential subdomain: aurelioliving
     - Is myaurelio subdomain: true
   
   🏪 ✅ Detected valid subdomain: aurelioliving
   ✅ Successfully loaded store via subdomain: { name: 'Aurelio Living' ... }

4. Controleer:
   ✅ Juiste store naam in header
   ✅ Producten worden getoond (als ze er zijn)
   ✅ Add to Cart werkt
```

#### Test 2: Sensationals
```
1. Open: https://sensationals.myaurelio.com
2. Open Browser Console (F12)
3. Zoek naar logs:
   
   🔍 DNS Debug Info:
     - Hostname: sensationals.myaurelio.com
     - Potential subdomain: sensationals
   
   🏪 ✅ Detected valid subdomain: sensationals
   ✅ Successfully loaded store via subdomain: { name: 'Sensationals' ... }

4. Controleer:
   ✅ Store naam "Sensationals" wordt getoond
   ✅ Lege store (nog geen producten) - dit is normaal!
```

## 🔍 Troubleshooting

### Probleem: "Store not found" error

**Oplossing 1: Check DNS**
```bash
# Wacht 5-10 minuten na toevoegen subdomain in Lovable
# DNS propagation kan tijd kosten
```

**Oplossing 2: Check Database**
```sql
-- Kijk of stores bestaan
SELECT * FROM public.organizations;

-- Als geen aurelioliving:
INSERT INTO public.organizations (name, slug, subdomain)
VALUES ('Aurelio Living', 'aurelioliving', 'aurelioliving');

-- Als geen sensationals:
INSERT INTO public.organizations (name, slug, subdomain)
VALUES ('Sensationals', 'sensationals', 'sensationals');
```

**Oplossing 3: Hard Refresh Browser**
```
Chrome/Edge: Ctrl + Shift + R
Firefox: Ctrl + F5
Safari: Cmd + Shift + R
```

### Probleem: Verkeerde store wordt geladen

**Diagnose:**
```javascript
// Open console op de website en run:
console.log('Current hostname:', window.location.hostname);
console.log('Should detect subdomain:', window.location.hostname.split('.')[0]);

// Check in Supabase:
SELECT subdomain FROM organizations WHERE id = '[store-id-uit-console]';
```

**Fix:**
```sql
-- Update subdomain als het verkeerd is
UPDATE public.organizations
SET subdomain = 'juiste-subdomain'
WHERE slug = 'store-slug';
```

### Probleem: Fallback naar Aurelio Living

**Dit is normaal gedrag als:**
- Subdomain niet bestaat in database
- DNS nog niet gepropageerd is
- Er een typo in de URL zit

**Check:**
1. Is subdomain correct gespeld?
2. Staat store in database?
3. Is DNS propagatie compleet?

## 📊 Hoe Het Werkt (Technisch)

```
Browser Request Flow:
==================

1. User gaat naar: aurelioliving.myaurelio.com
                    ↓
2. StoreContext.tsx detecteert:
   - hostname = "aurelioliving.myaurelio.com"
   - subdomain = "aurelioliving"
                    ↓
3. Database Query:
   SELECT * FROM organizations 
   WHERE subdomain = 'aurelioliving'
                    ↓
4. Store gevonden:
   - name: "Aurelio Living"
   - id: "uuid-123"
                    ↓
5. Tenant Database Init:
   - getTenantDatabase(uuid-123)
   - Neon DB connectie voor deze store
                    ↓
6. Producten Laden:
   - SELECT * FROM products 
     WHERE organization_id = 'uuid-123'
                    ↓
7. ✅ Aurelio Living webshop ready!
```

## 🎯 Post-Deployment Taken

Na succesvolle deployment:

### Voor Aurelio Living (aurelioliving.myaurelio.com)
- [ ] Controleer alle producten worden getoond
- [ ] Test add to cart functionaliteit
- [ ] Test checkout proces
- [ ] Configureer Stripe Connect (indien nog niet gedaan)
- [ ] Genereer shopping feeds (Google/Facebook/TikTok)

### Voor Sensationals (sensationals.myaurelio.com)
- [ ] Voeg eerste producten toe via admin panel
- [ ] Upload logo en branding
- [ ] Configureer store settings
- [ ] Setup Stripe Connect
- [ ] Test complete checkout flow

## 🔐 Security Checklist

- [ ] RLS (Row Level Security) policies zijn actief
- [ ] Elke store ziet alleen eigen data
- [ ] Tenant databases zijn geïsoleerd
- [ ] API keys zijn veilig opgeslagen

## 📈 Monitoring

**Check deze metrics na deployment:**
```sql
-- Aantal stores
SELECT COUNT(*) FROM organizations WHERE subdomain IS NOT NULL;

-- Store activiteit (laatste 24u)
SELECT 
  o.name,
  COUNT(DISTINCT s.id) as sessions,
  COUNT(DISTINCT sc.id) as cart_items
FROM organizations o
LEFT JOIN sessions s ON s.organization_id = o.id 
  AND s.created_at > NOW() - INTERVAL '24 hours'
LEFT JOIN shopping_cart sc ON sc.organization_id = o.id
  AND sc.created_at > NOW() - INTERVAL '24 hours'
GROUP BY o.name;
```

---

## ✅ Success Criteria

Je deployment is succesvol als:

1. ✅ `aurelioliving.myaurelio.com` laadt de juiste store
2. ✅ `sensationals.myaurelio.com` laadt de juiste store  
3. ✅ Elke store toont alleen zijn eigen producten
4. ✅ Add to cart werkt op beide subdomeinen
5. ✅ Console logs bevestigen subdomain detectie
6. ✅ Geen errors in browser console

---

**Status:** Ready to deploy!  
**Estimated Time:** 15 minuten  
**Difficulty:** ⭐⭐☆☆☆ (Easy)
