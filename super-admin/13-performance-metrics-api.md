# Performance Metrics API

## Overview
Detailed performance monitoring and optimization insights for all stores in the Super Admin platform, including Core Web Vitals, page speed, and user experience metrics.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Get Platform Performance Overview
```http
GET /performance/platform/overview
```

**Response:**
```json
{
  "data": {
    "overall_performance_score": 87.3,
    "stores_analyzed": 156,
    "avg_core_web_vitals": {
      "lcp_ms": 1650,
      "fid_ms": 45,
      "cls": 0.08,
      "fcp_ms": 1200,
      "ttfb_ms": 320
    },
    "lighthouse_scores": {
      "avg_performance": 87,
      "avg_accessibility": 94,
      "avg_best_practices": 91,
      "avg_seo": 89
    },
    "performance_distribution": {
      "excellent": 67,
      "good": 78,
      "needs_improvement": 11,
      "poor": 0
    },
    "trending": {
      "performance_trend": "improving",
      "avg_improvement": 5.2
    }
  }
}
```

### Get Store Performance Metrics
```http
GET /performance/stores/{store_id}/metrics
```

**Query Parameters:**
- `period` (string): "24h", "7d", "30d", "90d"
- `device_type` (string): "desktop", "mobile", "tablet"
- `page_type` (string): "home", "product", "category", "checkout"

**Response:**
```json
{
  "data": {
    "store_id": "store_456",
    "period": "30d",
    "performance_score": 89.2,
    "core_web_vitals": {
      "largest_contentful_paint": {
        "value_ms": 1450,
        "score": 92,
        "threshold_good": 2500,
        "threshold_poor": 4000,
        "status": "good"
      },
      "first_input_delay": {
        "value_ms": 38,
        "score": 98,
        "threshold_good": 100,
        "threshold_poor": 300,
        "status": "good"
      },
      "cumulative_layout_shift": {
        "value": 0.06,
        "score": 95,
        "threshold_good": 0.1,
        "threshold_poor": 0.25,
        "status": "good"
      },
      "first_contentful_paint": {
        "value_ms": 1080,
        "score": 90,
        "threshold_good": 1800,
        "threshold_poor": 3000,
        "status": "good"
      },
      "time_to_first_byte": {
        "value_ms": 290,
        "score": 88,
        "threshold_good": 800,
        "threshold_poor": 1800,
        "status": "good"
      }
    },
    "lighthouse_audit": {
      "performance": 89,
      "accessibility": 96,
      "best_practices": 92,
      "seo": 91,
      "last_audit": "2024-01-20T14:30:00Z"
    },
    "page_speed_insights": {
      "mobile_score": 85,
      "desktop_score": 93,
      "opportunities": [
        {
          "audit": "unused-javascript",
          "impact": "medium",
          "savings_ms": 340
        }
      ]
    },
    "user_experience": {
      "bounce_rate": 32.5,
      "avg_session_duration": "4m 25s",
      "pages_per_session": 3.2,
      "conversion_rate": 4.1
    }
  }
}
```

### Get Performance History
```http
GET /performance/stores/{store_id}/history
```

**Query Parameters:**
- `period` (string): "7d", "30d", "90d"
- `granularity` (string): "hour", "day", "week"
- `metric` (string): "lcp", "fid", "cls", "performance_score"

**Response:**
```json
{
  "data": {
    "period": "30d",
    "granularity": "day",
    "metric": "performance_score",
    "data_points": [
      {
        "date": "2024-01-20",
        "value": 89.2,
        "lcp_ms": 1450,
        "fid_ms": 38,
        "cls": 0.06,
        "samples": 1245
      }
    ],
    "trends": {
      "overall_trend": "improving",
      "percentage_change": 5.2,
      "best_day": "2024-01-18",
      "worst_day": "2024-01-03"
    }
  }
}
```

### Get Page-Level Performance
```http
GET /performance/stores/{store_id}/pages
```

**Query Parameters:**
- `sort_by` (string): "traffic", "performance_score", "lcp", "bounce_rate"
- `limit` (integer): Number of pages to return

**Response:**
```json
{
  "data": [
    {
      "page_url": "/",
      "page_type": "home",
      "page_views": 45678,
      "performance_score": 92.5,
      "core_web_vitals": {
        "lcp_ms": 1320,
        "fid_ms": 42,
        "cls": 0.05
      },
      "user_metrics": {
        "bounce_rate": 28.5,
        "avg_time_on_page": "3m 15s",
        "conversion_rate": 5.2
      },
      "optimization_opportunities": [
        {
          "type": "image_optimization",
          "potential_savings_ms": 450,
          "impact": "medium"
        }
      ]
    }
  ]
}
```

### Run Performance Audit
```http
POST /performance/stores/{store_id}/audit
```

**Request Body:**
```json
{
  "audit_type": "comprehensive",
  "pages_to_audit": ["/", "/products", "/checkout"],
  "device_types": ["mobile", "desktop"],
  "include_opportunities": true,
  "webhook_callback": "https://store456.com/webhooks/audit-complete"
}
```

**Response:**
```json
{
  "data": {
    "audit_id": "audit_123",
    "status": "queued",
    "pages_queued": 3,
    "estimated_completion": "10-15 minutes",
    "audit_url": "https://platform.com/audits/audit_123"
  }
}
```

### Get Audit Results
```http
GET /performance/audits/{audit_id}
```

**Response:**
```json
{
  "data": {
    "audit_id": "audit_123",
    "store_id": "store_456",
    "status": "completed",
    "completed_at": "2024-01-20T15:45:00Z",
    "overall_score": 87.5,
    "pages_audited": [
      {
        "url": "/",
        "device": "mobile",
        "lighthouse_score": 85,
        "core_web_vitals": {
          "lcp_ms": 1580,
          "fid_ms": 48,
          "cls": 0.07
        },
        "opportunities": [
          {
            "audit_id": "unused-css-rules",
            "title": "Remove unused CSS",
            "description": "Reduce unused rules from stylesheets",
            "score": 0.68,
            "savings_ms": 340,
            "savings_bytes": 23456
          }
        ],
        "diagnostics": [
          {
            "audit_id": "bootup-time",
            "title": "Reduce JavaScript execution time",
            "score": 0.75,
            "value_ms": 1250
          }
        ]
      }
    ],
    "recommendations": [
      {
        "category": "images",
        "title": "Optimize images",
        "impact": "high",
        "effort": "medium",
        "savings_ms": 890
      }
    ]
  }
}
```

### Get Performance Recommendations
```http
GET /performance/stores/{store_id}/recommendations
```

**Response:**
```json
{
  "data": [
    {
      "id": "rec_123",
      "category": "images",
      "title": "Optimize and compress images",
      "description": "Use modern image formats (WebP, AVIF) and implement lazy loading",
      "impact": "high",
      "effort": "medium",
      "potential_improvement": {
        "lcp_improvement_ms": 450,
        "performance_score_increase": 8
      },
      "implementation": {
        "steps": [
          "Enable WebP format in CDN settings",
          "Implement lazy loading for below-fold images",
          "Compress existing images"
        ],
        "estimated_time": "2-4 hours"
      },
      "priority": 1
    }
  ]
}
```

### Get Real User Monitoring (RUM) Data
```http
GET /performance/stores/{store_id}/rum
```

**Query Parameters:**
- `period` (string): "24h", "7d", "30d"
- `country` (string): Filter by country code
- `device_type` (string): Filter by device type

**Response:**
```json
{
  "data": {
    "period": "30d",
    "total_page_views": 156789,
    "unique_visitors": 45678,
    "real_user_metrics": {
      "lcp_distribution": {
        "good": 78.5,
        "needs_improvement": 18.2,
        "poor": 3.3
      },
      "fid_distribution": {
        "good": 89.2,
        "needs_improvement": 8.5,
        "poor": 2.3
      },
      "cls_distribution": {
        "good": 85.7,
        "needs_improvement": 12.1,
        "poor": 2.2
      }
    },
    "performance_by_device": {
      "desktop": {
        "avg_lcp_ms": 1320,
        "avg_fid_ms": 35,
        "avg_cls": 0.05
      },
      "mobile": {
        "avg_lcp_ms": 1680,
        "avg_fid_ms": 52,
        "avg_cls": 0.08
      }
    },
    "geographic_performance": [
      {
        "country": "Netherlands",
        "avg_lcp_ms": 1450,
        "sample_count": 12456
      }
    ]
  }
}
```

### Set Performance Budget
```http
POST /performance/stores/{store_id}/budget
```

**Request Body:**
```json
{
  "metrics": {
    "lcp_ms": 2000,
    "fid_ms": 100,
    "cls": 0.1,
    "performance_score": 85,
    "bundle_size_kb": 500
  },
  "alerts": {
    "email_notifications": true,
    "webhook_url": "https://store456.com/webhooks/performance",
    "threshold_breach_action": "alert"
  }
}
```

### Get Performance Alerts
```http
GET /performance/stores/{store_id}/alerts
```

**Response:**
```json
{
  "data": [
    {
      "alert_id": "perf_alert_123",
      "metric": "lcp",
      "threshold": 2000,
      "actual_value": 2350,
      "severity": "warning",
      "triggered_at": "2024-01-20T14:25:00Z",
      "status": "active",
      "affected_pages": ["/products/category"]
    }
  ]
}
```

### Compare Store Performance
```http
POST /performance/compare
```

**Request Body:**
```json
{
  "store_ids": ["store_456", "store_789", "store_012"],
  "metrics": ["performance_score", "lcp", "fid", "cls"],
  "period": "30d"
}
```

**Response:**
```json
{
  "data": {
    "comparison": [
      {
        "store_id": "store_456",
        "store_name": "Fashion Store",
        "performance_score": 89.2,
        "lcp_ms": 1450,
        "fid_ms": 38,
        "cls": 0.06,
        "rank": 1
      }
    ],
    "benchmarks": {
      "platform_average": 84.7,
      "industry_average": 78.2,
      "top_10_percent": 92.1
    }
  }
}
```

## Performance Monitoring Features

### Automated Monitoring
- Continuous Core Web Vitals tracking
- Regular Lighthouse audits
- Real User Monitoring (RUM)
- Performance budget monitoring
- Regression detection

### Performance Optimization
- Image optimization recommendations
- Code splitting suggestions
- Caching strategy improvements
- CDN configuration optimization
- Database query optimization

### Reporting & Analytics
- Performance trend analysis
- User experience correlation
- Business impact measurement
- Competitive benchmarking
- ROI calculation for optimizations

## Integration & Webhooks

### Performance Budget Alerts
```json
{
  "event": "performance.budget_exceeded",
  "data": {
    "store_id": "store_456",
    "metric": "lcp",
    "budget_value": 2000,
    "actual_value": 2350,
    "page_url": "/products"
  }
}
```

### Audit Completion
```json
{
  "event": "performance.audit_completed",
  "data": {
    "audit_id": "audit_123",
    "store_id": "store_456",
    "overall_score": 87.5,
    "improvement_opportunities": 5
  }
}
```

## Error Codes
- `AUDIT_IN_PROGRESS` - Performance audit already running
- `INVALID_PERFORMANCE_BUDGET` - Budget values are invalid
- `PAGE_NOT_ACCESSIBLE` - Target page cannot be audited
- `INSUFFICIENT_RUM_DATA` - Not enough real user data available
- `PERFORMANCE_MONITORING_DISABLED` - Monitoring not enabled for store