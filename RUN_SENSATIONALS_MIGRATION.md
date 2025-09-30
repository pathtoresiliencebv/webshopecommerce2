# ⚡ Sensationals Migratie Uitvoeren - SNELLE HANDLEIDING

**Let op:** Ik kan de migratie niet automatisch uitvoeren omdat ik geen toegang heb tot je Supabase database credentials. Volg deze stappen:

---

## 🚀 OPTIE 1: Supabase Dashboard (Snelst - 2 minuten)

### **Stap 1: Open Supabase Dashboard**
1. Ga naar: https://supabase.com/dashboard
2. Selecteer je project: `webshopecommerce2` of vergelijkbaar
3. Klik op **SQL Editor** in de linker sidebar

### **Stap 2: Kopieer de SQL**
1. Open deze file: `supabase/migrations/20250930200000_add_sensationals_products.sql`
2. Selecteer ALLES (Ctrl+A)
3. Kopieer (Ctrl+C)

### **Stap 3: Voer uit**
1. In SQL Editor, klik **"New Query"**
2. Plak de SQL (Ctrl+V)
3. Klik **RUN** knop (▶️)
4. Wacht 5-10 seconden

### **Stap 4: Verifieer Success**
Je moet zien:
```
✅ Found Sensationals ID: [uuid]
✅ Categories created
✅ Successfully created 8 products for Sensationals!
```

Run daarna deze verificatie query:
```sql
SELECT COUNT(*) as sensationals_products
FROM products p
JOIN organizations o ON o.id = p.organization_id
WHERE o.subdomain = 'sensationals';
```

**Moet zijn: 8**

---

## 🚀 OPTIE 2: Lokaal met Supabase CLI (Als je credentials hebt)

```bash
# Zet je DATABASE_URL environment variable
# Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres:[WACHTWOORD]@[HOST]:5432/postgres"

# Voer migratie uit
npx supabase db push --db-url $env:DATABASE_URL

# Of alleen deze specifieke migratie:
npx supabase db execute --file supabase/migrations/20250930200000_add_sensationals_products.sql --db-url $env:DATABASE_URL
```

---

## 🚀 OPTIE 3: Direct SQL Kopiëren (Ook snel)

**Kopieer onderstaande SQL en run in Supabase SQL Editor:**

```sql
-- KOPIEER VANAF HIER --
-- (Zie supabase/migrations/20250930200000_add_sensationals_products.sql)
-- TOT EINDE --
```

---

## ✅ Na Migratie

1. **Refresh Browser:**
   ```
   https://sensationals.myaurelio.com
   ```
   - Hard refresh: Ctrl+Shift+R

2. **Verwacht:**
   - ✅ 8 beauty/parfum producten zichtbaar
   - ✅ Armani parfums
   - ✅ Beauty producten
   - ❌ GEEN Aurelio Living meubels meer!

3. **Test:**
   - Klik op een product
   - Add to cart
   - Check product details

---

## 🐛 Als het Niet Werkt

**1. Check Console (F12):**
```javascript
// Moet zien:
"✅ Found store: Sensationals"
"organization_id: [uuid van Sensationals]"
```

**2. Run in SQL Editor:**
```sql
-- Check stores en hun producten
SELECT 
  o.name,
  o.subdomain,
  COUNT(p.id) as product_count
FROM organizations o
LEFT JOIN products p ON p.organization_id = o.id
WHERE o.subdomain IN ('aurelioliving', 'sensationals')
GROUP BY o.id, o.name, o.subdomain;
```

**3. Clear Cache:**
- Browser cache clear
- Hard refresh (Ctrl+Shift+R)
- Incognito window

---

## 📞 Support

Als het echt niet lukt:
1. Check of Sensationals organization bestaat in database
2. Verifieer subdomain = 'sensationals'
3. Check browser console voor errors
4. Verifieer dat migratie zonder errors is uitgevoerd

---

**VOER NU UIT VIA SUPABASE DASHBOARD → SQL EDITOR! 🚀**
