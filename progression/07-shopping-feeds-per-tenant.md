# Shopping Feeds per Tenant - Multi-Channel Marketing

**Datum:** 30 September 2025  
**Feature:** Elke webshop eigen Google Shopping, Facebook, TikTok feeds

## 🎯 Doel

Elke store owner moet kunnen adverteren op:
- ✅ **Google Shopping** (via Google Merchant Center)
- ✅ **Facebook/Instagram Shopping** (via Facebook Catalog)
- ✅ **TikTok Shopping** (via TikTok Catalog)
- ✅ **Pinterest Shopping** (optioneel)

### Waarom Dit Cruciaal Is
```
❌ Zonder Shopping Feeds:
   → Alleen organisch verkeer
   → Beperkte bereik
   → Moeilijk schalen

✅ Met Shopping Feeds:
   → Adverteren op Google, Facebook, TikTok
   → Geautomatiseerde product ads
   → 10x meer bereik
   → Betere ROI
```

## 🏗️ Architectuur Overzicht

```
┌─────────────────────────────────────────────────┐
│           STORE PRODUCTS (Tenant DB)            │
│                                                  │
│  Products → Auto-Generate Feeds                 │
│  - Images ✅                                    │
│  - Prices ✅                                    │
│  - Descriptions ✅                              │
│  - Stock levels ✅                              │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│          FEED GENERATOR (Edge Function)         │
│                                                  │
│  Generate per platform:                         │
│  - Google Shopping XML                          │
│  - Facebook CSV/XML                             │
│  - TikTok JSON                                  │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Google     │ │   Facebook   │ │   TikTok     │
│   Merchant   │ │   Catalog    │ │   Catalog    │
│   Center     │ │   Manager    │ │   Manager    │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        ▼               ▼               ▼
   Product Ads    Instagram Ads   TikTok Ads
```

## 📊 Database Schema

### Shopping Feed Configuration (Tenant Database)
```sql
-- Shopping feed configurations per store
CREATE TABLE shopping_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Platform
  platform TEXT NOT NULL CHECK (platform IN (
    'google_shopping', 'facebook', 'instagram', 'tiktok', 'pinterest'
  )),
  
  -- Feed Settings
  feed_name TEXT NOT NULL,
  feed_url TEXT NOT NULL, -- Public URL where feed is hosted
  is_active BOOLEAN DEFAULT false,
  
  -- Platform-specific config
  google_merchant_id TEXT,
  facebook_catalog_id TEXT,
  tiktok_catalog_id TEXT,
  
  -- Feed Options
  include_out_of_stock BOOLEAN DEFAULT false,
  minimum_price DECIMAL(10,2),
  maximum_price DECIMAL(10,2),
  excluded_categories TEXT[] DEFAULT '{}',
  custom_labels JSONB DEFAULT '{}',
  
  -- Scheduling
  auto_update BOOLEAN DEFAULT true,
  update_frequency TEXT DEFAULT 'daily' CHECK (update_frequency IN (
    'hourly', 'every_6_hours', 'daily', 'weekly', 'manual'
  )),
  last_generated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  
  -- Stats
  total_products INTEGER DEFAULT 0,
  approved_products INTEGER DEFAULT 0,
  disapproved_products INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feed generation history
CREATE TABLE feed_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_feed_id UUID NOT NULL REFERENCES shopping_feeds(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  products_count INTEGER NOT NULL,
  file_size_bytes INTEGER,
  generation_duration_ms INTEGER,
  
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product feed mapping (which products are in which feeds)
CREATE TABLE product_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_feed_id UUID NOT NULL REFERENCES shopping_feeds(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Status per platform
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'disapproved', 'excluded'
  )),
  
  -- Platform-specific product ID
  platform_product_id TEXT, -- Google: online:en:NL:123
  
  -- Issues
  disapproval_reasons TEXT[],
  warnings TEXT[],
  
  -- Override fields (optional per-product customization)
  custom_title TEXT,
  custom_description TEXT,
  custom_image_url TEXT,
  
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shopping_feed_id, product_id)
);

CREATE INDEX idx_shopping_feeds_platform ON shopping_feeds(platform);
CREATE INDEX idx_shopping_feeds_active ON shopping_feeds(is_active);
CREATE INDEX idx_product_feed_items_feed ON product_feed_items(shopping_feed_id);
CREATE INDEX idx_product_feed_items_status ON product_feed_items(status);
```

## 🛠️ Feed Generation System

### 1. Google Shopping Feed (XML)
```typescript
// supabase/functions/generate-google-shopping-feed/index.ts

interface GoogleShoppingProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  price: string;
  availability: 'in stock' | 'out of stock';
  brand?: string;
  gtin?: string;
  mpn?: string;
  condition: 'new' | 'refurbished' | 'used';
  google_product_category?: string;
}

serve(async (req) => {
  const { organizationId, feedId } = await req.json();
  
  try {
    // 1. Get tenant database
    const tenantDb = await getTenantDatabase(organizationId);
    
    // 2. Get feed config
    const { data: feed } = await tenantDb
      .from('shopping_feeds')
      .select('*')
      .eq('id', feedId)
      .single();
    
    // 3. Get products
    const { data: products } = await tenantDb
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gte('price', feed.minimum_price || 0);
    
    // 4. Get organization for base URL
    const { data: org } = await supabase
      .from('organizations')
      .select('subdomain, domain')
      .eq('id', organizationId)
      .single();
    
    const baseUrl = org.domain || `https://${org.subdomain}.myaurelio.com`;
    
    // 5. Generate Google Shopping XML
    const xmlProducts = products.map(product => ({
      id: product.id,
      title: product.name.substring(0, 150), // Max 150 chars
      description: stripHtml(product.description).substring(0, 5000),
      link: `${baseUrl}/products/${product.slug}`,
      image_link: product.images?.[0] || '',
      additional_image_link: product.images?.slice(1, 11).join(','), // Max 10
      price: `${product.price.toFixed(2)} EUR`,
      availability: product.stock > 0 ? 'in stock' : 'out of stock',
      brand: product.brand || org.name,
      condition: 'new',
      google_product_category: mapToGoogleCategory(product.category),
      product_type: product.category,
      gtin: product.ean || product.gtin,
      mpn: product.sku,
    }));
    
    // 6. Create XML feed
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${org.name} Product Feed</title>
    <link>${baseUrl}</link>
    <description>Products from ${org.name}</description>
    ${xmlProducts.map(p => `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.title}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${p.link}</g:link>
      <g:image_link>${p.image_link}</g:image_link>
      ${p.additional_image_link ? `<g:additional_image_link>${p.additional_image_link}</g:additional_image_link>` : ''}
      <g:price>${p.price}</g:price>
      <g:availability>${p.availability}</g:availability>
      <g:brand>${p.brand}</g:brand>
      <g:condition>${p.condition}</g:condition>
      ${p.google_product_category ? `<g:google_product_category>${p.google_product_category}</g:google_product_category>` : ''}
      ${p.gtin ? `<g:gtin>${p.gtin}</g:gtin>` : ''}
      ${p.mpn ? `<g:mpn>${p.mpn}</g:mpn>` : ''}
    </item>
    `).join('')}
  </channel>
</rss>`;
    
    // 7. Upload to storage
    const fileName = `feeds/${organizationId}/google-shopping-${feedId}.xml`;
    const { data: upload } = await supabase.storage
      .from('public-feeds')
      .upload(fileName, xml, {
        contentType: 'application/xml',
        upsert: true,
      });
    
    const feedUrl = `${supabaseUrl}/storage/v1/object/public/public-feeds/${fileName}`;
    
    // 8. Update feed record
    await tenantDb
      .from('shopping_feeds')
      .update({
        feed_url: feedUrl,
        last_generated_at: new Date().toISOString(),
        total_products: products.length,
      })
      .eq('id', feedId);
    
    // 9. Log generation
    await tenantDb
      .from('feed_generation_logs')
      .insert({
        shopping_feed_id: feedId,
        status: 'success',
        products_count: products.length,
        file_size_bytes: new Blob([xml]).size,
      });
    
    return new Response(
      JSON.stringify({ success: true, feedUrl, products: products.length }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Feed generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
});

function mapToGoogleCategory(category: string): string {
  // Map internal categories to Google product categories
  const mapping = {
    'clothing': 'Apparel & Accessories',
    'electronics': 'Electronics',
    'home': 'Home & Garden',
    'beauty': 'Health & Beauty',
    // Add more mappings
  };
  return mapping[category.toLowerCase()] || '';
}
```

### 2. Facebook/Instagram Feed (CSV)
```typescript
// supabase/functions/generate-facebook-feed/index.ts

serve(async (req) => {
  const { organizationId, feedId } = await req.json();
  
  // Similar to Google, but CSV format
  const csvHeader = 'id,title,description,availability,condition,price,link,image_link,brand';
  
  const csvRows = products.map(p => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${stripHtml(p.description).replace(/"/g, '""')}"`,
    p.stock > 0 ? 'in stock' : 'out of stock',
    'new',
    `${p.price.toFixed(2)} EUR`,
    `${baseUrl}/products/${p.slug}`,
    p.images?.[0] || '',
    p.brand || org.name,
  ].join(','));
  
  const csv = [csvHeader, ...csvRows].join('\n');
  
  // Upload and return URL
  // ...
});
```

### 3. TikTok Shopping Feed (JSON)
```typescript
// supabase/functions/generate-tiktok-feed/index.ts

serve(async (req) => {
  const { organizationId, feedId } = await req.json();
  
  const tiktokFeed = {
    products: products.map(p => ({
      id: p.id,
      title: p.name,
      description: stripHtml(p.description),
      price: {
        amount: p.price.toFixed(2),
        currency: 'EUR',
      },
      images: p.images || [],
      product_url: `${baseUrl}/products/${p.slug}`,
      availability: p.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      brand: p.brand || org.name,
      category: p.category,
    })),
  };
  
  const json = JSON.stringify(tiktokFeed, null, 2);
  
  // Upload and return URL
  // ...
});
```

## 🎨 Admin Interface - Feed Manager

### Feed Configuration UI
```typescript
// src/components/admin/AdminShoppingFeeds.tsx

export function AdminShoppingFeeds() {
  const { tenantDb, store } = useStore();
  const [feeds, setFeeds] = useState<ShoppingFeed[]>([]);
  
  const createFeed = async (platform: string) => {
    const { data: feed } = await tenantDb
      .from('shopping_feeds')
      .insert({
        platform: platform,
        feed_name: `${store.name} ${platform} Feed`,
        is_active: false,
        auto_update: true,
        update_frequency: 'daily',
      })
      .select()
      .single();
    
    // Generate initial feed
    await supabase.functions.invoke(`generate-${platform}-feed`, {
      body: { organizationId: store.id, feedId: feed.id }
    });
    
    toast.success('Feed aangemaakt!');
    loadFeeds();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shopping Feeds</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nieuwe Feed
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => createFeed('google_shopping')}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Google Shopping
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createFeed('facebook')}>
              <Facebook className="w-4 h-4 mr-2" />
              Facebook/Instagram
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => createFeed('tiktok')}>
              <Music className="w-4 h-4 mr-2" />
              TikTok Shopping
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feeds.map(feed => (
          <FeedCard key={feed.id} feed={feed} onRefresh={regenerateFeed} />
        ))}
      </div>
    </div>
  );
}

function FeedCard({ feed, onRefresh }: { feed: ShoppingFeed; onRefresh: (id: string) => void }) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google_shopping': return <ShoppingBag className="w-8 h-8" />;
      case 'facebook': return <Facebook className="w-8 h-8" />;
      case 'tiktok': return <Music className="w-8 h-8" />;
      default: return <Globe className="w-8 h-8" />;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getPlatformIcon(feed.platform)}
            <div>
              <CardTitle>{feed.feed_name}</CardTitle>
              <CardDescription>
                {feed.total_products} producten
              </CardDescription>
            </div>
          </div>
          <Badge variant={feed.is_active ? 'default' : 'secondary'}>
            {feed.is_active ? 'Actief' : 'Inactief'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feed URL */}
        <div>
          <Label className="text-xs text-muted-foreground">Feed URL</Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input 
              value={feed.feed_url} 
              readOnly 
              className="text-xs"
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(feed.feed_url);
                toast.success('URL gekopieerd!');
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {feed.approved_products}
            </p>
            <p className="text-xs text-muted-foreground">Goedgekeurd</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {feed.disapproved_products}
            </p>
            <p className="text-xs text-muted-foreground">Afgekeurd</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {feed.total_products}
            </p>
            <p className="text-xs text-muted-foreground">Totaal</p>
          </div>
        </div>
        
        {/* Last Updated */}
        <div className="text-xs text-muted-foreground">
          Laatste update: {formatDistanceToNow(new Date(feed.last_generated_at), { addSuffix: true, locale: nl })}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onRefresh(feed.id)} 
            size="sm" 
            className="flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Vernieuwen
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(feed.feed_url, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🔄 Automated Feed Updates

### Cron Job: Update All Feeds
```typescript
// supabase/functions/update-all-shopping-feeds/index.ts

serve(async (req) => {
  try {
    // Get all active feeds that need updating
    const { data: feeds } = await supabase
      .from('shopping_feeds')
      .select('*, organizations(id)')
      .eq('is_active', true)
      .eq('auto_update', true);
    
    for (const feed of feeds) {
      const shouldUpdate = shouldFeedUpdate(
        feed.last_generated_at,
        feed.update_frequency
      );
      
      if (shouldUpdate) {
        console.log(`Updating feed ${feed.id} for org ${feed.organizations.id}`);
        
        // Generate new feed
        await supabase.functions.invoke(`generate-${feed.platform}-feed`, {
          body: {
            organizationId: feed.organizations.id,
            feedId: feed.id,
          }
        });
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, updated: feeds.length }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
});

function shouldFeedUpdate(lastUpdate: string, frequency: string): boolean {
  const now = new Date();
  const last = new Date(lastUpdate);
  const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  
  switch (frequency) {
    case 'hourly': return hoursSince >= 1;
    case 'every_6_hours': return hoursSince >= 6;
    case 'daily': return hoursSince >= 24;
    case 'weekly': return hoursSince >= 168;
    default: return false;
  }
}
```

### Database Trigger: Update Feed on Product Change
```sql
-- Trigger to mark feed as needing update when products change
CREATE OR REPLACE FUNCTION mark_feeds_for_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all feeds as needing update
  UPDATE shopping_feeds
  SET last_generated_at = NOW() - INTERVAL '25 hours' -- Force update
  WHERE is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_changed_update_feeds
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH STATEMENT
EXECUTE FUNCTION mark_feeds_for_update();
```

## 📈 Platform Integration Guides

### Google Merchant Center Setup
```markdown
1. Create Google Merchant Center account
2. Verify website ownership (DNS or HTML file)
3. Add feed URL: https://storage.myaurelio.com/feeds/{org-id}/google-shopping.xml
4. Set feed fetch schedule: Daily
5. Link to Google Ads account
6. Create Shopping campaign
```

### Facebook Catalog Setup
```markdown
1. Create Facebook Business Manager account
2. Go to Commerce Manager
3. Create Product Catalog
4. Add Data Source → Schedule Feed
5. Feed URL: https://storage.myaurelio.com/feeds/{org-id}/facebook.csv
6. Set update frequency: Daily
7. Link to Facebook/Instagram ads
```

### TikTok Catalog Setup
```markdown
1. Create TikTok Seller Center account
2. Go to Product Management
3. Add Products → Via Data Feed
4. Feed URL: https://storage.myaurelio.com/feeds/{org-id}/tiktok.json
5. Set auto-sync: Daily
6. Create TikTok Shopping ads
```

## 🚀 Implementation Roadmap

### Week 1: Feed Generation Core
- [ ] Database schema
- [ ] Google Shopping XML generator
- [ ] Facebook CSV generator
- [ ] TikTok JSON generator

### Week 2: Admin Interface
- [ ] Feed management UI
- [ ] Feed creation wizard
- [ ] Feed preview & validation
- [ ] Manual regeneration

### Week 3: Automation
- [ ] Cron job for auto-updates
- [ ] Product change triggers
- [ ] Feed status monitoring
- [ ] Error handling & notifications

### Week 4: Platform Integration
- [ ] Platform setup guides
- [ ] Feed validation per platform
- [ ] Analytics integration
- [ ] Performance tracking

## 📊 Success Metrics

### Feed Quality
- ✅ >95% product approval rate
- ✅ <5% disapproval rate
- ✅ Daily automatic updates
- ✅ <1 hour feed generation time

### Business Impact
- 🎯 3x more traffic from shopping ads
- 🎯 2x conversion rate (shopping ads vs organic)
- 🎯 30% lower CPA (cost per acquisition)
- 🎯 5x ROAS (return on ad spend)

**Result:** Store owners kunnen adverteren op alle platforms met 1-klik setup! 🚀
