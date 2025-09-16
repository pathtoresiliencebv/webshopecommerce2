# Performance Optimization Plan

## Database Performance

### 🔴 CRITICAL - Query Optimization

#### N+1 Query Resolution
- **WIE:** Senior Backend Developer (Maria)
- **WAT:** Multiple database calls in product listings
- **WAAR:** `src/components/ProductCard.tsx`, collection pages
- **WANNEER:** Deze week (3 dagen)
- **HOE:** Implement query batching en joins

```sql
-- Current: Multiple queries per product
SELECT * FROM products WHERE store_id = $1;
-- For each product: SELECT * FROM product_images WHERE product_id = $1;

-- Optimized: Single query with joins
SELECT 
  p.*,
  json_agg(DISTINCT pi.*) as images,
  json_agg(DISTINCT pv.*) as variants,
  c.name as collection_name
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN collections c ON p.collection_id = c.id
WHERE p.store_id = $1
GROUP BY p.id, c.name;
```

#### Database Indexing Strategy
- **WIE:** Database Administrator (Alex)
- **WAT:** Missing indexes causing slow queries
- **WAAR:** Core database tables
- **WANNEER:** Dit weekend (maintenance window)
- **HOE:** Add composite indexes voor common query patterns

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_products_store_status_created 
ON products(store_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_orders_customer_status 
ON orders(customer_id, status) WHERE status != 'draft';

CREATE INDEX CONCURRENTLY idx_product_search 
ON products USING gin(to_tsvector('english', title || ' ' || description));
```

#### Query Performance Monitoring
- **WIE:** DevOps Engineer (Tom)
- **WAT:** Geen insight in slow queries
- **WAAR:** Supabase analytics
- **WANNEER:** Week 1
- **HOE:** Setup performance dashboards

### 🟡 HIGH - Caching Strategy

#### Redis Implementation
- **WIE:** Backend Performance Specialist
- **WAT:** Geen caching van frequently accessed data
- **WAAR:** Product catalog, user sessions
- **WANNEER:** Week 2
- **HOE:** Redis cluster setup

```typescript
// Cache strategy implementation
class CacheService {
  async getProducts(storeId: string, ttl = 300) {
    const cacheKey = `products:${storeId}`;
    let products = await redis.get(cacheKey);
    
    if (!products) {
      products = await supabase
        .from('products')
        .select('*, images(*), variants(*)')
        .eq('store_id', storeId);
      
      await redis.setex(cacheKey, ttl, JSON.stringify(products));
    }
    
    return JSON.parse(products);
  }
}
```

#### CDN Integration
- **WIE:** Infrastructure Team (Tom + External)
- **WAT:** Static assets served direct from origin
- **WAAR:** Images, CSS, JS bundles
- **WANNEER:** Week 2-3
- **HOE:** Cloudflare of AWS CloudFront setup

## Frontend Performance

### 🔴 CRITICAL - Bundle Optimization

#### Code Splitting Implementation
- **WIE:** Frontend Performance Lead (Sarah)
- **WAT:** Single large bundle (2.1MB) causing slow load
- **WAAR:** Vite build configuration
- **WANNEER:** Deze week
- **HOE:** Route-based en component-based splitting

```typescript
// Route-based code splitting
const AdminPanel = lazy(() => import('./pages/Admin'));
const StoreManager = lazy(() => import('./pages/StoreManager'));
const CustomerStore = lazy(() => import('./components/store/CustomerStorefront'));

// Component-based splitting for heavy components
const ProductEditor = lazy(() => import('./components/admin/ProductEditor'));
const EmailBuilder = lazy(() => import('./components/admin/email/EmailBuilder'));
```

#### Tree Shaking Optimization
- **WIE:** Build Engineer
- **WAT:** Unused code in production bundle
- **WAAR:** `vite.config.ts`, import statements
- **WANNEER:** Week 1
- **HOE:** Analyze bundle en remove unused imports

```typescript
// Bundle analyzer setup
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'admin': ['./src/components/admin'],
          'store': ['./src/components/store']
        }
      }
    }
  }
});
```

### 🟡 HIGH - Image Optimization

#### Responsive Images Implementation
- **WIE:** Frontend Developer (John)
- **WAT:** Large unoptimized images (5MB+ product photos)
- **WAAR:** Product cards, hero sections
- **WANNEER:** Week 2
- **HOE:** Implement picture element met multiple formats

```typescript
// Optimized image component
interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}

const OptimizedImage = ({ src, alt, sizes, className }: OptimizedImageProps) => {
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
  const avifSrc = src.replace(/\.(jpg|jpeg|png)$/, '.avif');
  
  return (
    <picture className={className}>
      <source srcSet={avifSrc} type="image/avif" />
      <source srcSet={webpSrc} type="image/webp" />
      <img 
        src={src} 
        alt={alt}
        loading="lazy"
        sizes={sizes}
      />
    </picture>
  );
};
```

#### Image Processing Pipeline
- **WIE:** DevOps + Frontend Team
- **WAT:** Manual image uploads zonder processing
- **WAAR:** Supabase Storage + CDN
- **WANNEER:** Week 3
- **HOE:** Automated image optimization pipeline

```typescript
// Supabase Edge Function voor image processing
export default async function optimizeImage(req: Request) {
  const formData = await req.formData();
  const image = formData.get('image') as File;
  
  // Generate multiple formats and sizes
  const optimized = await Promise.all([
    sharp(image).resize(800, 600).webp().toBuffer(),
    sharp(image).resize(400, 300).webp().toBuffer(),
    sharp(image).resize(200, 150).webp().toBuffer(),
  ]);
  
  // Upload optimized versions
  return uploadToStorage(optimized);
}
```

### 🔵 MEDIUM - Runtime Performance

#### React Optimization
- **WIE:** React Performance Specialist
- **WAT:** Unnecessary re-renders, large component trees
- **WAAR:** Product listings, admin dashboard
- **WANNEER:** Week 3-4
- **HOE:** Memo, callback optimization, virtual scrolling

```typescript
// Virtual scrolling for large product lists
import { FixedSizeList as List } from 'react-window';

const VirtualProductGrid = ({ products }: { products: Product[] }) => {
  const Row = useCallback(({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <ProductCard product={products[index]} />
    </div>
  ), [products]);

  return (
    <List
      height={600}
      itemCount={products.length}
      itemSize={250}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## Network Performance

### 🟡 HIGH - API Optimization

#### Request Batching
- **WIE:** API Developer
- **WAT:** Multiple individual API calls
- **WAAR:** Admin dashboard data loading
- **WANNEER:** Week 2
- **HOE:** GraphQL-style batched requests

```typescript
// Batch API requests
class BatchRequestService {
  private batch: Array<{ query: string; variables: any; resolve: Function; reject: Function }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  async request(query: string, variables: any) {
    return new Promise((resolve, reject) => {
      this.batch.push({ query, variables, resolve, reject });
      
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), 10);
      }
    });
  }

  private async executeBatch() {
    const batch = [...this.batch];
    this.batch = [];
    this.batchTimeout = null;

    try {
      const result = await supabase.rpc('batch_queries', { queries: batch });
      batch.forEach((item, index) => item.resolve(result[index]));
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}
```

#### Response Compression
- **WIE:** Backend Engineer
- **WAT:** Large JSON responses zonder compression
- **WAAR:** Supabase Edge Functions
- **WANNEER:** Week 1
- **HOE:** Gzip compression implementeren

## Performance Monitoring

### 🟡 HIGH - Metrics Collection

#### Real User Monitoring
- **WIE:** Analytics Engineer
- **WAT:** Geen insight in real user performance
- **WAAR:** Frontend performance tracking
- **WANNEER:** Week 2
- **HOE:** Web Vitals collection

```typescript
// Performance monitoring setup
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to Supabase analytics
  supabase.from('performance_metrics').insert({
    name: metric.name,
    value: metric.value,
    page: window.location.pathname,
    user_agent: navigator.userAgent,
    timestamp: new Date()
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Performance Budgets
- **WIE:** Performance Team Lead
- **WAT:** Geen performance budgets defined
- **WAAR:** CI/CD pipeline
- **WANNEER:** Week 3
- **HOE:** Lighthouse CI integration

```json
// lighthouse-ci.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/products"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}]
      }
    }
  }
}
```

## Implementation Timeline

### Week 1: Critical Database Issues
- [ ] N+1 query fixes
- [ ] Essential indexes creation
- [ ] Bundle size reduction

### Week 2: Caching & API
- [ ] Redis implementation
- [ ] CDN setup
- [ ] API request batching

### Week 3: Frontend Optimization
- [ ] Image optimization pipeline
- [ ] React performance fixes
- [ ] Performance monitoring

### Week 4: Monitoring & Fine-tuning
- [ ] Performance budgets
- [ ] Real user monitoring
- [ ] Performance testing automation

## Success Metrics

### Load Performance
- **First Contentful Paint:** <1.5s
- **Largest Contentful Paint:** <2.5s
- **Time to Interactive:** <3s

### Runtime Performance
- **Lighthouse Performance Score:** >90
- **Bundle Size:** <1MB initial load
- **Database Query Time:** <100ms average

### User Experience
- **Page Load Speed:** <2s
- **Search Response Time:** <500ms
- **Image Load Time:** <1s