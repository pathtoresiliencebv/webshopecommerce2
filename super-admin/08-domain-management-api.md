# Domain Management API

## Overview
Comprehensive domain and subdomain management for all stores in the Super Admin platform, including custom domains, SSL certificates, and DNS management.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### List All Domains
```http
GET /domains
```

**Query Parameters:**
- `store_id` (string): Filter by store
- `type` (string): "subdomain", "custom_domain"
- `status` (string): "active", "pending", "failed", "suspended"
- `ssl_status` (string): "issued", "pending", "failed", "expired"

**Response:**
```json
{
  "data": [
    {
      "id": "domain_123",
      "store_id": "store_456",
      "store_name": "Fashion Store",
      "type": "custom_domain",
      "domain": "fashion.store",
      "subdomain": null,
      "status": "active",
      "ssl_status": "issued",
      "dns_status": "verified",
      "created_at": "2024-01-15T10:30:00Z",
      "expires_at": "2025-01-15T10:30:00Z",
      "is_primary": true,
      "traffic_stats": {
        "monthly_visitors": 15432,
        "bandwidth_gb": 125.3
      }
    },
    {
      "id": "domain_124",
      "store_id": "store_789",
      "store_name": "Tech Store",
      "type": "subdomain",
      "domain": "tech-store.platform.com",
      "subdomain": "tech-store",
      "status": "active",
      "ssl_status": "issued",
      "dns_status": "verified",
      "created_at": "2024-01-10T14:20:00Z",
      "is_primary": true
    }
  ]
}
```

### Get Domain Details
```http
GET /domains/{domain_id}
```

**Response:**
```json
{
  "data": {
    "id": "domain_123",
    "store_id": "store_456",
    "type": "custom_domain",
    "domain": "fashion.store",
    "status": "active",
    "ssl_certificate": {
      "status": "issued",
      "issued_at": "2024-01-15T10:30:00Z",
      "expires_at": "2025-01-15T10:30:00Z",
      "issuer": "Let's Encrypt",
      "serial_number": "03f2e4a5b1c9d7e8f6a2b3c4d5e6f7a8"
    },
    "dns_records": [
      {
        "type": "A",
        "name": "@",
        "value": "185.199.108.153",
        "status": "verified"
      },
      {
        "type": "CNAME",
        "name": "www",
        "value": "fashion.store",
        "status": "verified"
      }
    ],
    "verification": {
      "method": "dns",
      "token": "domain-verification-123abc",
      "verified_at": "2024-01-15T11:00:00Z"
    },
    "analytics": {
      "daily_visitors": [
        {"date": "2024-01-20", "visitors": 523},
        {"date": "2024-01-19", "visitors": 489}
      ],
      "bandwidth_usage": {
        "current_month_gb": 125.3,
        "previous_month_gb": 98.7
      }
    }
  }
}
```

### Create Custom Domain
```http
POST /domains/custom
```

**Request Body:**
```json
{
  "store_id": "store_456",
  "domain": "mystore.com",
  "subdomain_redirect": true,
  "force_https": true,
  "auto_renew_ssl": true
}
```

**Response:**
```json
{
  "data": {
    "domain_id": "domain_125",
    "domain": "mystore.com",
    "status": "pending_verification",
    "verification_method": "dns",
    "dns_records_required": [
      {
        "type": "A",
        "name": "@",
        "value": "185.199.108.153",
        "ttl": 300
      },
      {
        "type": "CNAME",
        "name": "www",
        "value": "mystore.com",
        "ttl": 300
      }
    ],
    "verification_token": "domain-verification-xyz789",
    "ssl_provisioning": "pending"
  }
}
```

### Create Subdomain
```http
POST /domains/subdomain
```

**Request Body:**
```json
{
  "store_id": "store_789",
  "subdomain": "my-awesome-store",
  "region": "eu-west-1"
}
```

**Response:**
```json
{
  "data": {
    "domain_id": "domain_126",
    "domain": "my-awesome-store.platform.com",
    "subdomain": "my-awesome-store",
    "status": "active",
    "ssl_status": "issued",
    "available_immediately": true
  }
}
```

### Verify Domain
```http
POST /domains/{domain_id}/verify
```

**Response:**
```json
{
  "data": {
    "domain_id": "domain_125",
    "verification_status": "verified",
    "verified_at": "2024-01-20T15:30:00Z",
    "dns_propagation_complete": true,
    "ssl_provisioning_started": true
  }
}
```

### Update Domain Settings
```http
PUT /domains/{domain_id}
```

**Request Body:**
```json
{
  "force_https": true,
  "subdomain_redirect": false,
  "auto_renew_ssl": true,
  "is_primary": true,
  "custom_headers": {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff"
  }
}
```

### Delete Domain
```http
DELETE /domains/{domain_id}
```

**Request Body:**
```json
{
  "transfer_traffic_to": "store_subdomain",
  "preserve_ssl": false,
  "cleanup_dns": true
}
```

### Get SSL Certificate Status
```http
GET /domains/{domain_id}/ssl
```

**Response:**
```json
{
  "data": {
    "status": "issued",
    "certificate": {
      "serial_number": "03f2e4a5b1c9d7e8f6a2b3c4d5e6f7a8",
      "issued_at": "2024-01-15T10:30:00Z",
      "expires_at": "2025-01-15T10:30:00Z",
      "issuer": "Let's Encrypt Authority X3",
      "subject": "CN=fashion.store",
      "san_domains": ["fashion.store", "www.fashion.store"]
    },
    "auto_renewal": {
      "enabled": true,
      "next_renewal_check": "2024-12-15T10:30:00Z"
    },
    "validation_method": "http-01"
  }
}
```

### Renew SSL Certificate
```http
POST /domains/{domain_id}/ssl/renew
```

**Response:**
```json
{
  "data": {
    "renewal_id": "renewal_123",
    "status": "started",
    "estimated_completion": "5-10 minutes"
  }
}
```

### Get DNS Records
```http
GET /domains/{domain_id}/dns
```

**Response:**
```json
{
  "data": {
    "domain": "fashion.store",
    "records": [
      {
        "id": "dns_123",
        "type": "A",
        "name": "@",
        "value": "185.199.108.153",
        "ttl": 300,
        "status": "active",
        "last_checked": "2024-01-20T15:30:00Z"
      },
      {
        "id": "dns_124",
        "type": "MX",
        "name": "@",
        "value": "10 mail.fashion.store",
        "ttl": 3600,
        "status": "active"
      }
    ]
  }
}
```

### Update DNS Records
```http
PUT /domains/{domain_id}/dns
```

**Request Body:**
```json
{
  "records": [
    {
      "type": "A",
      "name": "@",
      "value": "185.199.108.154",
      "ttl": 300
    },
    {
      "type": "CNAME",
      "name": "blog",
      "value": "blog.platform.com",
      "ttl": 3600
    }
  ]
}
```

### Check Domain Health
```http
GET /domains/{domain_id}/health
```

**Response:**
```json
{
  "data": {
    "overall_status": "healthy",
    "checks": {
      "dns_resolution": {
        "status": "pass",
        "response_time_ms": 45,
        "last_checked": "2024-01-20T15:30:00Z"
      },
      "ssl_certificate": {
        "status": "pass",
        "expires_in_days": 75,
        "last_checked": "2024-01-20T15:25:00Z"
      },
      "http_response": {
        "status": "pass",
        "response_code": 200,
        "response_time_ms": 250,
        "last_checked": "2024-01-20T15:30:00Z"
      }
    },
    "uptime_percentage": 99.97,
    "issues": []
  }
}
```

### Get Domain Analytics
```http
GET /domains/{domain_id}/analytics
```

**Query Parameters:**
- `period` (string): "7d", "30d", "90d"
- `metrics` (string): "traffic", "performance", "errors"

**Response:**
```json
{
  "data": {
    "period": "30d",
    "traffic": {
      "total_requests": 1567892,
      "unique_visitors": 45632,
      "page_views": 189453,
      "bandwidth_gb": 567.8
    },
    "performance": {
      "avg_response_time_ms": 245,
      "95th_percentile_ms": 890,
      "cache_hit_rate": 87.5
    },
    "errors": {
      "4xx_count": 234,
      "5xx_count": 12,
      "ssl_errors": 0
    },
    "top_pages": [
      {"path": "/", "views": 45632},
      {"path": "/products", "views": 23451}
    ]
  }
}
```

### Bulk Domain Operations
```http
POST /domains/bulk
```

**Request Body:**
```json
{
  "operation": "renew_ssl",
  "domain_ids": ["domain_123", "domain_124", "domain_125"],
  "options": {
    "force_renewal": false,
    "notification_email": "admin@platform.com"
  }
}
```

## Domain Configuration

### SSL Configuration Options
```json
{
  "ssl_options": {
    "provider": "lets_encrypt",
    "key_size": 2048,
    "validation_method": "http-01",
    "auto_renewal": true,
    "notification_days": [30, 7, 1]
  }
}
```

### DNS Templates
```json
{
  "ecommerce_template": {
    "records": [
      {"type": "A", "name": "@", "value": "platform_ip"},
      {"type": "CNAME", "name": "www", "value": "@"},
      {"type": "MX", "name": "@", "value": "10 mail.platform.com"}
    ]
  }
}
```

## Webhooks
```json
{
  "event": "domain.ssl_renewed",
  "data": {
    "domain_id": "domain_123",
    "domain": "fashion.store",
    "store_id": "store_456",
    "certificate_expires_at": "2025-01-15T10:30:00Z"
  }
}
```

## Error Codes
- `DOMAIN_NOT_AVAILABLE` - Domain already in use
- `DNS_VERIFICATION_FAILED` - DNS records not properly configured
- `SSL_PROVISIONING_FAILED` - SSL certificate issuance failed
- `DOMAIN_EXPIRED` - Domain registration expired
- `DNS_PROPAGATION_TIMEOUT` - DNS changes taking too long to propagate