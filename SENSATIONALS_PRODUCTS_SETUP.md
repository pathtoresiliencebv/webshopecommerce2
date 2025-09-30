# Sensationals Products Setup

**Probleem:** Sensationals.myaurelio.com toont producten van Aurelio Living  
**Oorzaak:** Sensationals heeft nog geen eigen producten in de database  
**Oplossing:** Migratie toevoegen met 8 beauty/parfum producten voor Sensationals

---

## 🎯 Migratie Details

**Bestand:** `supabase/migrations/20250930200000_add_sensationals_products.sql`

**Wat wordt aangemaakt:**
- 2 categorieën (Beauty, Parfum)
- 8 producten:
  - **Parfums (4):**
    1. Armani Because It's You - €35 (was €40) 
    2. Armani My Way - €35 (was €40)
    3. Armani Si - €35 (was €40)
    4. Armani Code - €38 (was €45)
  
  - **Beauty (4):**
    1. Klein Euphoria - €32 (was €38) 🆕
    2. Versailles Luxury Serum - €45 (was €55) 🆕
    3. Golden Glow Face Cream - €28 (was €35)
    4. Midnight Rose Body Oil - €24 (was €30)

---

## 🚀 Uitvoeren van de Migratie

### **Optie 1: Supabase Dashboard (Aanbevolen)**

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/[YOUR_PROJECT]/editor
   ```

2. **Ga naar SQL Editor:**
   - Klik op "SQL Editor" in de linker sidebar
   - Click "New Query"

3. **Kopieer de Migratie:**
   - Open `supabase/migrations/20250930200000_add_sensationals_products.sql`
   - Kopieer de VOLLEDIGE inhoud

4. **Run de Query:**
   - Plak de SQL in de editor
   - Click "RUN" (▶️)
   - Wacht op "Success" bericht

5. **Verifieer:**
   ```sql
   SELECT COUNT(*) FROM products 
   WHERE organization_id = (
     SELECT id FROM organizations WHERE subdomain = 'sensationals'
   );
   ```
   - Moet **8** retourneren

---

### **Optie 2: Supabase CLI**

```bash
# Als je Supabase CLI hebt geïnstalleerd
npx supabase db push

# Of alleen deze migratie:
npx supabase db execute --file supabase/migrations/20250930200000_add_sensationals_products.sql
```

---

### **Optie 3: Direct SQL (Quick Fix)**

Als je snel wilt testen zonder CLI:

```sql
-- In Supabase SQL Editor:
-- Kopieer en run de VOLLEDIGE inhoud van:
-- supabase/migrations/20250930200000_add_sensationals_products.sql
```

---

## ✅ Verificatie

### **1. Check Product Count**
```sql
SELECT 
  o.name as store,
  o.subdomain,
  COUNT(p.id) as product_count
FROM organizations o
LEFT JOIN products p ON p.organization_id = o.id
WHERE o.subdomain IN ('aurelioliving', 'sensationals')
GROUP BY o.id, o.name, o.subdomain;
```

**Verwacht resultaat:**
```
store            | subdomain      | product_count
-----------------|----------------|-------------
Aurelio Living   | aurelioliving  | 18-20
Sensationals     | sensationals   | 8
```

### **2. Check Sensationals Products**
```sql
SELECT 
  p.name,
  p.price,
  p.original_price,
  c.name as category,
  p.is_sale,
  p.is_new
FROM products p
JOIN organizations o ON o.id = p.organization_id
JOIN categories c ON c.id = p.category_id
WHERE o.subdomain = 'sensationals'
ORDER BY p.created_at;
```

### **3. Test in Browser**
1. Ga naar: `https://sensationals.myaurelio.com`
2. Verwacht: **8 beauty/parfum producten**
3. Niet meer: Aurelio Living meubels

---

## 🎨 Product Details

### **Armani Parfums (€35-€38)**
- ✅ All on SALE
- ✅ Professional product images (Unsplash)
- ✅ Dutch descriptions
- ✅ In stock (40-60 units)

### **Beauty Products (€24-€45)**
- ✅ 2 NEW products (Klein Euphoria, Versailles Serum)
- ✅ All on SALE
- ✅ Premium pricing
- ✅ Luxury descriptions

---

## 🐛 Troubleshooting

### **Probleem: Migratie geeft error**
```
ERROR: duplicate key value violates unique constraint
```
**Oplossing:** Categories bestaan al, dit is OK - producten worden alsnog aangemaakt.

### **Probleem: Nog steeds Aurelio producten**
1. **Clear browser cache** (Ctrl+Shift+R)
2. **Check console logs:**
   - Open Developer Tools (F12)
   - Kijk naar `console.log` voor store detection
   - Moet zien: `"✅ Found store: Sensationals"`

3. **Verifieer subdomain:**
   ```javascript
   // In browser console:
   console.log(window.location.hostname); 
   // Moet zijn: "sensationals.myaurelio.com"
   ```

### **Probleem: "Store not found" error**
**Controleer of Sensationals bestaat:**
```sql
SELECT id, name, subdomain FROM organizations 
WHERE subdomain = 'sensationals';
```

Zo niet, run eerst:
```sql
INSERT INTO organizations (name, slug, subdomain, description)
VALUES ('Sensationals', 'sensationals', 'sensationals', 
        'Premium beauty and parfum webshop');
```

---

## 📊 Database Schema

```
organizations (Central DB)
├── id: UUID
├── name: "Sensationals"
├── subdomain: "sensationals"
└── ...

products (Central DB, filtered by organization_id)
├── id: UUID
├── organization_id: UUID → organizations.id
├── category_id: UUID
├── name: TEXT
├── price: DECIMAL
└── ...

categories (Per Organization)
├── id: UUID
├── organization_id: UUID
├── name: TEXT ("Beauty", "Parfum")
└── ...
```

---

## 🚀 Next Steps

Na succesvolle migratie:

1. ✅ **Refresh browser:** `https://sensationals.myaurelio.com`
2. ✅ **Zie 8 beauty/parfum producten**
3. ✅ **Test add to cart**
4. ✅ **Upload Sensationals logo** in admin
5. ✅ **Apply Sensationals Dreamy theme** (uit theme-requirements/)

---

## 📝 Commit Log

```bash
✅ Commit: 91ddd11 - Add beauty and parfum products for Sensationals
✅ Push: Successful
✅ Migratie: Ready to run
```

---

## 🎯 Samenvatting

**Voor Migratie:**
- ❌ Sensationals toont Aurelio producten
- ❌ 0 eigen producten

**Na Migratie:**
- ✅ Sensationals toont eigen beauty/parfum producten
- ✅ 8 producten (4 parfums + 4 beauty)
- ✅ Alle producten on SALE
- ✅ 2 NEW products
- ✅ Professional images

**Run de migratie nu in Supabase Dashboard! 🚀**
