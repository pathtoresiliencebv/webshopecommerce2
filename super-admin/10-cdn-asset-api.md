# CDN & Asset Management API

## Overview
Global content delivery network and asset management for all stores in the Super Admin platform, including image optimization, caching, and performance analytics.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Get CDN Overview
```http
GET /cdn/overview
```

**Response:**
```json
{
  "data": {
    "total_assets": 1567892,
    "total_bandwidth_gb": 15678.9,
    "cache_hit_ratio": 94.2,
    "global_pops": 45,
    "active_stores": 156,
    "monthly_requests": 125678900,
    "performance_metrics": {
      "avg_response_time_ms": 45,
      "95th_percentile_ms": 120,
      "99th_percentile_ms": 280
    }
  }
}
```

### List Store Assets
```http
GET /cdn/stores/{store_id}/assets
```

**Query Parameters:**
- `type` (string): "image", "css", "js", "font", "video", "document"
- `size_min` (integer): Minimum file size in bytes
- `size_max` (integer): Maximum file size in bytes
- `uploaded_after` (string): ISO 8601 date
- `optimized` (boolean): Filter by optimization status
- `page` (integer): Page number
- `limit` (integer): Items per page

**Response:**
```json
{
  "data": [
    {
      "id": "asset_123",
      "store_id": "store_456",
      "filename": "hero-image.jpg",
      "type": "image",
      "size_bytes": 1250000,
      "optimized_size_bytes": 450000,
      "compression_ratio": 64.0,
      "cdn_url": "https://cdn.platform.com/store_456/hero-image.jpg",
      "original_url": "https://store456.com/uploads/hero-image.jpg",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "last_accessed": "2024-01-20T14:25:00Z",
      "access_count": 15432,
      "optimization": {
        "webp_available": true,
        "avif_available": true,
        "responsive_sizes": [320, 768, 1024, 1920],
        "lazy_loading": true
      },
      "cache_status": "cached",
      "edge_locations": ["us-east-1", "eu-west-1", "ap-southeast-1"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2456
  }
}
```

### Get Asset Details
```http
GET /cdn/assets/{asset_id}
```

**Response:**
```json
{
  "data": {
    "id": "asset_123",
    "store_id": "store_456",
    "filename": "hero-image.jpg",
    "type": "image",
    "mime_type": "image/jpeg",
    "size_original": 1250000,
    "size_optimized": 450000,
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "urls": {
      "original": "https://cdn.platform.com/store_456/orig/hero-image.jpg",
      "webp": "https://cdn.platform.com/store_456/webp/hero-image.webp",
      "avif": "https://cdn.platform.com/store_456/avif/hero-image.avif",
      "responsive": {
        "320w": "https://cdn.platform.com/store_456/320w/hero-image.jpg",
        "768w": "https://cdn.platform.com/store_456/768w/hero-image.jpg",
        "1024w": "https://cdn.platform.com/store_456/1024w/hero-image.jpg"
      }
    },
    "optimization": {
      "compression_level": 85,
      "format_conversion": ["webp", "avif"],
      "responsive_breakpoints": [320, 768, 1024, 1920],
      "progressive_jpeg": true,
      "strip_metadata": true
    },
    "analytics": {
      "requests_24h": 1234,
      "bandwidth_24h_mb": 556.8,
      "cache_hit_ratio": 96.5,
      "popular_sizes": [
        {"size": "1024w", "requests": 567},
        {"size": "768w", "requests": 345}
      ]
    },
    "cache_info": {
      "ttl_seconds": 86400,
      "cache_status": "cached",
      "edge_locations": 8,
      "last_cache_update": "2024-01-20T12:30:00Z"
    }
  }
}
```

### Upload Asset
```http
POST /cdn/stores/{store_id}/assets/upload
```

**Request Body (multipart/form-data):**
```
file: [binary file data]
optimization: {
  "auto_webp": true,
  "auto_avif": true,
  "quality": 85,
  "progressive": true,
  "responsive_sizes": [320, 768, 1024, 1920]
}
cache_settings: {
  "ttl_seconds": 86400,
  "edge_cache": true,
  "browser_cache": true
}
```

**Response:**
```json
{
  "data": {
    "asset_id": "asset_124",
    "upload_status": "processing",
    "original_url": "https://cdn.platform.com/store_456/orig/new-image.jpg",
    "processing_status": {
      "webp_conversion": "queued",
      "avif_conversion": "queued",
      "responsive_generation": "queued"
    },
    "estimated_completion": "2-5 minutes"
  }
}
```

### Optimize Asset
```http
POST /cdn/assets/{asset_id}/optimize
```

**Request Body:**
```json
{
  "quality": 80,
  "formats": ["webp", "avif"],
  "responsive_sizes": [320, 768, 1024, 1920],
  "progressive": true,
  "strip_metadata": true,
  "lazy_loading": true
}
```

### Purge Cache
```http
POST /cdn/cache/purge
```

**Request Body:**
```json
{
  "scope": "asset",
  "targets": [
    "https://cdn.platform.com/store_456/hero-image.jpg",
    "https://cdn.platform.com/store_456/webp/hero-image.webp"
  ],
  "purge_type": "immediate"
}
```

**Response:**
```json
{
  "data": {
    "purge_id": "purge_123",
    "status": "completed",
    "targets_purged": 2,
    "edge_locations_cleared": 45,
    "completion_time": "15 seconds"
  }
}
```

### Get CDN Analytics
```http
GET /cdn/analytics
```

**Query Parameters:**
- `store_id` (string): Filter by store
- `period` (string): "1h", "24h", "7d", "30d"
- `metrics` (string): "bandwidth", "requests", "cache", "performance"
- `granularity` (string): "minute", "hour", "day"

**Response:**
```json
{
  "data": {
    "period": "24h",
    "metrics": [
      {
        "timestamp": "2024-01-20T14:00:00Z",
        "requests": 125678,
        "bandwidth_gb": 567.8,
        "cache_hit_ratio": 94.2,
        "avg_response_time_ms": 45,
        "error_rate": 0.02
      }
    ],
    "summary": {
      "total_requests": 3015072,
      "total_bandwidth_gb": 13627.2,
      "avg_cache_hit_ratio": 94.8,
      "data_saved_gb": 12931.6,
      "cost_savings_usd": 1293.16
    },
    "top_assets": [
      {
        "url": "https://cdn.platform.com/store_456/hero-image.jpg",
        "requests": 45632,
        "bandwidth_mb": 2056.4
      }
    ],
    "geographic_distribution": [
      {"region": "North America", "requests": 45.2, "bandwidth_percentage": 42.8},
      {"region": "Europe", "requests": 32.1, "bandwidth_percentage": 35.6}
    ]
  }
}
```

### Configure Store CDN Settings
```http
PUT /cdn/stores/{store_id}/settings
```

**Request Body:**
```json
{
  "optimization": {
    "auto_webp": true,
    "auto_avif": true,
    "quality_preset": "balanced",
    "progressive_jpeg": true,
    "lazy_loading": true
  },
  "caching": {
    "browser_ttl": 86400,
    "edge_ttl": 604800,
    "vary_accept_encoding": true
  },
  "security": {
    "hotlink_protection": true,
    "allowed_domains": ["store456.com", "www.store456.com"],
    "token_auth": false
  },
  "performance": {
    "minify_css": true,
    "minify_js": true,
    "gzip_compression": true,
    "brotli_compression": true
  }
}
```

### Get Edge Locations
```http
GET /cdn/edge-locations
```

**Response:**
```json
{
  "data": [
    {
      "id": "edge_us_east_1",
      "name": "US East (N. Virginia)",
      "region": "North America",
      "city": "Ashburn",
      "country": "US",
      "status": "healthy",
      "capacity_usage": 67.5,
      "avg_response_time_ms": 23,
      "stores_served": 45
    },
    {
      "id": "edge_eu_west_1",
      "name": "EU West (Ireland)",
      "region": "Europe",
      "city": "Dublin",
      "country": "IE",
      "status": "healthy",
      "capacity_usage": 72.1,
      "avg_response_time_ms": 28,
      "stores_served": 38
    }
  ]
}
```

### Image Transformation
```http
GET /cdn/stores/{store_id}/images/{image_id}/transform
```

**Query Parameters:**
- `w` (integer): Width in pixels
- `h` (integer): Height in pixels
- `q` (integer): Quality (1-100)
- `f` (string): Format ("webp", "avif", "jpeg", "png")
- `fit` (string): "cover", "contain", "fill", "inside", "outside"
- `blur` (integer): Blur radius (1-100)
- `brightness` (float): Brightness (-100 to 100)

**Example:**
```
GET /cdn/stores/456/images/123/transform?w=800&h=600&q=85&f=webp&fit=cover
```

### Bandwidth Usage
```http
GET /cdn/stores/{store_id}/bandwidth
```

**Query Parameters:**
- `period` (string): "24h", "7d", "30d", "90d"
- `breakdown` (string): "hourly", "daily", "weekly"

**Response:**
```json
{
  "data": {
    "period": "30d",
    "total_bandwidth_gb": 1567.8,
    "breakdown": [
      {"date": "2024-01-20", "bandwidth_gb": 67.8},
      {"date": "2024-01-19", "bandwidth_gb": 54.2}
    ],
    "by_content_type": {
      "images": 78.5,
      "css": 8.2,
      "javascript": 6.8,
      "fonts": 4.1,
      "other": 2.4
    },
    "cost_estimate_usd": 156.78,
    "overage_charges": 0
  }
}
```

## CDN Configuration

### Optimization Presets
```json
{
  "presets": {
    "ecommerce": {
      "image_quality": 85,
      "formats": ["webp", "avif"],
      "responsive_sizes": [320, 768, 1024, 1920],
      "lazy_loading": true
    },
    "performance": {
      "image_quality": 75,
      "aggressive_compression": true,
      "minification": true,
      "gzip": true
    },
    "quality": {
      "image_quality": 95,
      "lossless_optimization": true,
      "preserve_metadata": true
    }
  }
}
```

### Security Features
- Hotlink protection
- Token-based authentication
- IP whitelisting/blacklisting
- Rate limiting
- DDoS protection

## Real-time Features

### WebSocket Notifications
```javascript
// Real-time asset processing updates
{
  "event": "asset.processing_complete",
  "data": {
    "asset_id": "asset_123",
    "formats_generated": ["webp", "avif"],
    "responsive_sizes": [320, 768, 1024],
    "total_size_reduction": "64%"
  }
}
```

## Error Codes
- `ASSET_NOT_FOUND` - Asset doesn't exist
- `OPTIMIZATION_FAILED` - Image optimization failed
- `CACHE_PURGE_FAILED` - Cache purge operation failed
- `BANDWIDTH_LIMIT_EXCEEDED` - Monthly bandwidth limit reached
- `UNSUPPORTED_FORMAT` - File format not supported
- `FILE_TOO_LARGE` - Asset exceeds size limit