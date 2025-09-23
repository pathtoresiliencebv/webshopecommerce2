# Platform Analytics API

## Overview
Comprehensive analytics and business intelligence across all stores in the Super Admin platform, providing insights into performance, user behavior, and growth metrics.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Get Platform Dashboard Metrics
```http
GET /analytics/platform/dashboard
```

**Query Parameters:**
- `period` (string): "24h", "7d", "30d", "90d", "1y"
- `timezone` (string): Timezone identifier (default: UTC)

**Response:**
```json
{
  "data": {
    "period": "30d",
    "summary": {
      "total_stores": 156,
      "active_stores": 142,
      "new_stores": 18,
      "churned_stores": 3,
      "total_revenue_usd": 145600.00,
      "total_orders": 15673,
      "total_customers": 89456,
      "avg_order_value": 67.85
    },
    "growth_metrics": {
      "stores_growth_rate": 12.5,
      "revenue_growth_rate": 18.2,
      "customer_growth_rate": 25.3,
      "order_growth_rate": 15.8
    },
    "health_score": 94.2,
    "trends": {
      "stores_trend": "up",
      "revenue_trend": "up",
      "performance_trend": "stable"
    }
  }
}
```

### Get Revenue Analytics
```http
GET /analytics/revenue
```

**Query Parameters:**
- `period` (string): Time period
- `breakdown` (string): "daily", "weekly", "monthly"
- `store_ids` (array): Filter by specific stores
- `currency` (string): Currency code (default: USD)

**Response:**
```json
{
  "data": {
    "period": "30d",
    "total_revenue": 145600.00,
    "currency": "USD",
    "breakdown": [
      {
        "date": "2024-01-20",
        "revenue": 4850.00,
        "orders": 67,
        "avg_order_value": 72.39,
        "stores_contributing": 45
      }
    ],
    "by_subscription_plan": {
      "starter": {
        "revenue": 24500.00,
        "stores": 67,
        "percentage": 16.8
      },
      "professional": {
        "revenue": 89100.00,
        "stores": 63,
        "percentage": 61.2
      },
      "enterprise": {
        "revenue": 32000.00,
        "stores": 26,
        "percentage": 22.0
      }
    },
    "recurring_vs_onetime": {
      "recurring_revenue": 125600.00,
      "onetime_revenue": 20000.00,
      "recurring_percentage": 86.3
    }
  }
}
```

### Get Store Performance Metrics
```http
GET /analytics/stores/performance
```

**Query Parameters:**
- `period` (string): Time period
- `sort_by` (string): "revenue", "orders", "customers", "growth_rate"
- `limit` (integer): Number of top stores to return

**Response:**
```json
{
  "data": [
    {
      "store_id": "store_123",
      "store_name": "Fashion Hub Amsterdam",
      "performance_score": 92.5,
      "revenue": 25600.00,
      "revenue_growth": 23.5,
      "orders": 1245,
      "orders_growth": 18.2,
      "customers": 892,
      "customer_growth": 15.8,
      "conversion_rate": 3.2,
      "avg_order_value": 67.85,
      "customer_lifetime_value": 245.60,
      "churn_rate": 5.2,
      "metrics": {
        "page_load_time_ms": 1250,
        "bounce_rate": 35.2,
        "session_duration": "4m 32s"
      }
    }
  ],
  "summary": {
    "avg_performance_score": 87.3,
    "top_performer": "Fashion Hub Amsterdam",
    "fastest_growing": "Tech Store Berlin"
  }
}
```

### Get Customer Analytics
```http
GET /analytics/customers
```

**Response:**
```json
{
  "data": {
    "total_customers": 89456,
    "active_customers": 67234,
    "new_customers_30d": 8945,
    "customer_acquisition": {
      "cost_per_acquisition": 25.60,
      "channels": [
        {"channel": "organic_search", "customers": 3456, "percentage": 38.6},
        {"channel": "social_media", "customers": 2134, "percentage": 23.9},
        {"channel": "direct", "customers": 1789, "percentage": 20.0}
      ]
    },
    "customer_segments": [
      {
        "segment": "high_value",
        "count": 8945,
        "avg_order_value": 156.80,
        "lifetime_value": 892.34
      },
      {
        "segment": "regular",
        "count": 45623,
        "avg_order_value": 67.85,
        "lifetime_value": 234.56
      }
    ],
    "retention_metrics": {
      "30_day_retention": 78.5,
      "90_day_retention": 62.3,
      "365_day_retention": 45.8
    },
    "geographic_distribution": [
      {"country": "Netherlands", "customers": 23456, "percentage": 26.2},
      {"country": "Germany", "customers": 18900, "percentage": 21.1},
      {"country": "Belgium", "customers": 12345, "percentage": 13.8}
    ]
  }
}
```

### Get Product Analytics
```http
GET /analytics/products
```

**Query Parameters:**
- `store_id` (string): Filter by store
- `category` (string): Filter by category
- `period` (string): Time period

**Response:**
```json
{
  "data": {
    "total_products": 567890,
    "active_products": 489567,
    "products_added_30d": 12456,
    "top_selling": [
      {
        "product_id": "prod_123",
        "name": "Wireless Headphones Pro",
        "store_name": "Tech Store",
        "units_sold": 1245,
        "revenue": 89560.00,
        "growth_rate": 25.3
      }
    ],
    "category_performance": [
      {
        "category": "Electronics",
        "products": 45678,
        "revenue": 567890.00,
        "avg_price": 89.50,
        "conversion_rate": 4.2
      }
    ],
    "inventory_metrics": {
      "out_of_stock_products": 2345,
      "low_stock_products": 5678,
      "overstock_products": 1234
    },
    "pricing_analysis": {
      "avg_product_price": 67.85,
      "price_range_distribution": [
        {"range": "0-25", "products": 12345, "percentage": 21.7},
        {"range": "25-50", "products": 23456, "percentage": 41.3}
      ]
    }
  }
}
```

### Get Traffic Analytics
```http
GET /analytics/traffic
```

**Response:**
```json
{
  "data": {
    "total_sessions": 1567890,
    "total_page_views": 4567890,
    "unique_visitors": 892345,
    "avg_session_duration": "4m 25s",
    "bounce_rate": 42.3,
    "pages_per_session": 2.9,
    "traffic_sources": [
      {
        "source": "organic_search",
        "sessions": 567890,
        "percentage": 36.2,
        "bounce_rate": 38.5
      },
      {
        "source": "direct",
        "sessions": 345678,
        "percentage": 22.1,
        "bounce_rate": 35.2
      }
    ],
    "device_breakdown": {
      "desktop": 45.6,
      "mobile": 48.9,
      "tablet": 5.5
    },
    "browser_breakdown": [
      {"browser": "Chrome", "percentage": 65.2},
      {"browser": "Safari", "percentage": 18.9},
      {"browser": "Firefox", "percentage": 9.8}
    ],
    "geographic_sessions": [
      {"country": "Netherlands", "sessions": 234567, "percentage": 15.0},
      {"country": "Germany", "sessions": 189012, "percentage": 12.1}
    ]
  }
}
```

### Get Conversion Funnel Analytics
```http
GET /analytics/conversion-funnel
```

**Response:**
```json
{
  "data": {
    "funnel_steps": [
      {
        "step": "page_view",
        "users": 100000,
        "conversion_rate": 100.0,
        "drop_off_rate": 0.0
      },
      {
        "step": "product_view",
        "users": 45600,
        "conversion_rate": 45.6,
        "drop_off_rate": 54.4
      },
      {
        "step": "add_to_cart",
        "users": 12800,
        "conversion_rate": 12.8,
        "drop_off_rate": 71.9
      },
      {
        "step": "checkout_initiated",
        "users": 8900,
        "conversion_rate": 8.9,
        "drop_off_rate": 30.5
      },
      {
        "step": "purchase_completed",
        "users": 3200,
        "conversion_rate": 3.2,
        "drop_off_rate": 64.0
      }
    ],
    "overall_conversion_rate": 3.2,
    "cart_abandonment_rate": 64.0,
    "checkout_completion_rate": 36.0
  }
}
```

### Get Real-time Analytics
```http
GET /analytics/realtime
```

**Response:**
```json
{
  "data": {
    "active_users_now": 5678,
    "sessions_last_hour": 12345,
    "orders_last_hour": 234,
    "revenue_last_hour": 15678.90,
    "top_pages_now": [
      {
        "page": "/",
        "active_users": 1234,
        "page_views": 2345
      }
    ],
    "active_stores": 142,
    "system_health": {
      "api_response_time": 145,
      "uptime_percentage": 99.98,
      "error_rate": 0.02
    },
    "live_events": [
      {
        "timestamp": "2024-01-20T15:30:25Z",
        "event": "order_completed",
        "store": "Fashion Store",
        "amount": 89.99
      }
    ]
  }
}
```

### Generate Custom Report
```http
POST /analytics/reports/generate
```

**Request Body:**
```json
{
  "report_name": "Monthly Store Performance",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "metrics": [
    "revenue",
    "orders",
    "customers",
    "conversion_rate"
  ],
  "dimensions": [
    "store_id",
    "subscription_plan",
    "geographic_region"
  ],
  "filters": {
    "subscription_plan": ["professional", "enterprise"],
    "min_revenue": 1000
  },
  "format": "json",
  "delivery": {
    "method": "webhook",
    "webhook_url": "https://api.example.com/reports"
  }
}
```

**Response:**
```json
{
  "data": {
    "report_id": "report_123",
    "status": "generating",
    "estimated_completion": "2-5 minutes",
    "download_url": null
  }
}
```

### Get Report Status
```http
GET /analytics/reports/{report_id}
```

**Response:**
```json
{
  "data": {
    "report_id": "report_123",
    "status": "completed",
    "generated_at": "2024-01-20T15:35:00Z",
    "download_url": "https://reports.platform.com/report_123.json",
    "expires_at": "2024-01-27T15:35:00Z",
    "metadata": {
      "total_records": 156,
      "file_size_mb": 2.5,
      "format": "json"
    }
  }
}
```

## Advanced Analytics Features

### Cohort Analysis
```http
GET /analytics/cohorts
```

### A/B Testing Results
```http
GET /analytics/ab-tests
```

### Predictive Analytics
```http
GET /analytics/predictions
```

**Response:**
```json
{
  "data": {
    "revenue_forecast": {
      "next_30_days": 168500.00,
      "confidence_interval": {
        "lower": 152600.00,
        "upper": 184400.00
      }
    },
    "churn_prediction": {
      "stores_at_risk": 12,
      "risk_factors": ["low_usage", "payment_issues"]
    }
  }
}
```

## Data Export & Integration

### Supported Export Formats
- JSON
- CSV
- Excel (XLSX)
- PDF Reports

### Webhook Integration
```json
{
  "event": "analytics.threshold_reached",
  "data": {
    "metric": "daily_revenue",
    "threshold": 5000.00,
    "actual_value": 5250.00,
    "store_id": "store_456"
  }
}
```

## Error Codes
- `INVALID_DATE_RANGE` - Date range is invalid or too large
- `METRIC_NOT_FOUND` - Requested metric doesn't exist
- `INSUFFICIENT_DATA` - Not enough data for analysis
- `REPORT_GENERATION_FAILED` - Failed to generate report
- `EXPORT_FORMAT_UNSUPPORTED` - Export format not supported