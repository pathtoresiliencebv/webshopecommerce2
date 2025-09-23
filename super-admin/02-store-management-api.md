# Store Management API

## Overview
Complete CRUD operations for managing stores within the Super Admin platform.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### List All Stores
```http
GET /stores
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `status` (string): "active", "inactive", "suspended"
- `subscription_plan` (string): "starter", "professional", "enterprise"
- `search` (string): Search by store name or domain

**Response:**
```json
{
  "data": [
    {
      "id": "store_123",
      "name": "Fashion Store Amsterdam",
      "domain": "fashion.store",
      "subdomain": "fashion-amsterdam",
      "status": "active",
      "subscription_plan": "professional",
      "created_at": "2024-01-15T10:30:00Z",
      "owner": {
        "id": "user_456",
        "email": "owner@fashion.store",
        "name": "John Smith"
      },
      "metrics": {
        "monthly_revenue": 25000,
        "total_products": 450,
        "total_orders": 234
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### Get Store Details
```http
GET /stores/{store_id}
```

**Response:**
```json
{
  "data": {
    "id": "store_123",
    "name": "Fashion Store Amsterdam",
    "domain": "fashion.store",
    "subdomain": "fashion-amsterdam",
    "status": "active",
    "subscription_plan": "professional",
    "settings": {
      "currency": "EUR",
      "timezone": "Europe/Amsterdam",
      "language": "nl"
    },
    "billing": {
      "next_billing_date": "2024-02-15T00:00:00Z",
      "monthly_cost": 99.00,
      "usage": {
        "storage_gb": 15.5,
        "bandwidth_gb": 125.2,
        "api_calls": 45000
      }
    },
    "owner": {
      "id": "user_456",
      "email": "owner@fashion.store",
      "name": "John Smith"
    }
  }
}
```

### Create New Store
```http
POST /stores
```

**Request Body:**
```json
{
  "name": "New Store Name",
  "subdomain": "new-store",
  "owner_email": "owner@newstore.com",
  "subscription_plan": "starter",
  "settings": {
    "currency": "EUR",
    "timezone": "Europe/Amsterdam",
    "language": "en"
  },
  "template": "ecommerce_basic"
}
```

**Response:**
```json
{
  "data": {
    "id": "store_789",
    "name": "New Store Name",
    "subdomain": "new-store",
    "status": "provisioning",
    "setup_url": "https://setup.superadmin.platform/store_789"
  }
}
```

### Update Store
```http
PUT /stores/{store_id}
```

**Request Body:**
```json
{
  "name": "Updated Store Name",
  "status": "active",
  "subscription_plan": "professional",
  "settings": {
    "currency": "USD",
    "timezone": "America/New_York"
  }
}
```

### Suspend Store
```http
POST /stores/{store_id}/suspend
```

**Request Body:**
```json
{
  "reason": "Payment overdue",
  "notify_owner": true,
  "grace_period_days": 7
}
```

### Delete Store
```http
DELETE /stores/{store_id}
```

**Request Body:**
```json
{
  "confirmation": "DELETE",
  "backup_data": true,
  "transfer_domain": false
}
```

## Webhooks
```json
{
  "event": "store.created",
  "data": {
    "store_id": "store_789",
    "name": "New Store Name",
    "owner_email": "owner@newstore.com"
  }
}
```

## Error Codes
- `STORE_NOT_FOUND` - Store doesn't exist
- `SUBDOMAIN_TAKEN` - Subdomain already in use
- `INVALID_SUBSCRIPTION_PLAN` - Invalid plan specified
- `STORE_DELETE_FAILED` - Failed to delete store