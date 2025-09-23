# Store Connection API

## Overview
API endpoints for connecting existing stores to the Super Admin platform and managing store integrations.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Generate Connection Token
```http
POST /stores/connect/generate-token
```

**Request Body:**
```json
{
  "store_url": "https://mystore.com",
  "owner_email": "owner@mystore.com",
  "expires_in": 3600
}
```

**Response:**
```json
{
  "data": {
    "connection_token": "conn_token_abc123xyz",
    "expires_at": "2024-01-20T15:30:00Z",
    "setup_url": "https://mystore.com/admin/connect?token=conn_token_abc123xyz",
    "instructions": {
      "step1": "Share the setup_url with the store owner",
      "step2": "Store owner visits URL and authorizes connection",
      "step3": "Connection is established automatically"
    }
  }
}
```

### Validate Connection Token
```http
GET /stores/connect/validate/{token}
```

**Response:**
```json
{
  "data": {
    "valid": true,
    "store_url": "https://mystore.com",
    "owner_email": "owner@mystore.com",
    "expires_at": "2024-01-20T15:30:00Z",
    "permissions_requested": [
      "read_products",
      "read_orders",
      "read_analytics",
      "manage_webhooks"
    ]
  }
}
```

### Complete Store Connection
```http
POST /stores/connect/complete
```

**Request Body:**
```json
{
  "connection_token": "conn_token_abc123xyz",
  "store_api_key": "sk_store_key_789",
  "store_metadata": {
    "platform": "shopify",
    "version": "2024.1",
    "store_id": "shop_456789"
  },
  "authorized_scopes": [
    "read_products",
    "read_orders",
    "read_analytics"
  ]
}
```

**Response:**
```json
{
  "data": {
    "store_id": "store_connected_123",
    "status": "connected",
    "sync_status": "pending",
    "webhook_endpoints": [
      "https://api.superadmin.platform/v1/webhooks/store_connected_123/orders",
      "https://api.superadmin.platform/v1/webhooks/store_connected_123/products"
    ],
    "initial_sync_estimated": "15-30 minutes"
  }
}
```

### List Connected Stores
```http
GET /stores/connected
```

**Query Parameters:**
- `status` (string): "connected", "syncing", "error", "disconnected"
- `platform` (string): "shopify", "woocommerce", "magento", "custom"

**Response:**
```json
{
  "data": [
    {
      "id": "store_connected_123",
      "name": "My Fashion Store",
      "url": "https://mystore.com",
      "platform": "shopify",
      "status": "connected",
      "connected_at": "2024-01-15T10:30:00Z",
      "last_sync": "2024-01-20T14:25:00Z",
      "sync_frequency": "hourly",
      "data_synced": {
        "products": 450,
        "orders": 1245,
        "customers": 892
      },
      "api_health": "healthy"
    }
  ]
}
```

### Get Store Connection Details
```http
GET /stores/connected/{store_id}
```

**Response:**
```json
{
  "data": {
    "id": "store_connected_123",
    "name": "My Fashion Store",
    "url": "https://mystore.com",
    "platform": "shopify",
    "status": "connected",
    "connection_config": {
      "api_version": "2024-01",
      "webhook_endpoints": [
        "orders/create",
        "orders/updated",
        "products/create"
      ],
      "sync_settings": {
        "frequency": "hourly",
        "batch_size": 100,
        "retry_attempts": 3
      }
    },
    "sync_history": [
      {
        "sync_id": "sync_789",
        "started_at": "2024-01-20T14:00:00Z",
        "completed_at": "2024-01-20T14:15:00Z",
        "status": "completed",
        "records_processed": {
          "products": 15,
          "orders": 23,
          "customers": 8
        }
      }
    ]
  }
}
```

### Update Store Connection
```http
PUT /stores/connected/{store_id}
```

**Request Body:**
```json
{
  "sync_frequency": "daily",
  "webhook_endpoints": [
    "orders/create",
    "products/create",
    "customers/create"
  ],
  "data_mapping": {
    "product_fields": ["title", "price", "inventory"],
    "order_fields": ["total", "status", "customer_email"]
  }
}
```

### Trigger Manual Sync
```http
POST /stores/connected/{store_id}/sync
```

**Request Body:**
```json
{
  "sync_type": "full",
  "entities": ["products", "orders", "customers"],
  "force_resync": false
}
```

**Response:**
```json
{
  "data": {
    "sync_id": "sync_abc123",
    "status": "started",
    "estimated_duration": "10-20 minutes",
    "entities_to_sync": ["products", "orders", "customers"]
  }
}
```

### Get Sync Status
```http
GET /stores/connected/{store_id}/sync/{sync_id}
```

**Response:**
```json
{
  "data": {
    "sync_id": "sync_abc123",
    "status": "in_progress",
    "started_at": "2024-01-20T14:00:00Z",
    "progress": {
      "products": {
        "total": 450,
        "processed": 230,
        "percentage": 51.1
      },
      "orders": {
        "total": 1245,
        "processed": 1245,
        "percentage": 100.0
      }
    },
    "errors": [],
    "estimated_completion": "2024-01-20T14:18:00Z"
  }
}
```

### Disconnect Store
```http
POST /stores/connected/{store_id}/disconnect
```

**Request Body:**
```json
{
  "reason": "store_closed",
  "preserve_data": true,
  "notify_owner": true
}
```

### Get Connection Health
```http
GET /stores/connected/{store_id}/health
```

**Response:**
```json
{
  "data": {
    "overall_status": "healthy",
    "api_connectivity": "healthy",
    "webhook_delivery": "healthy",
    "last_successful_sync": "2024-01-20T14:00:00Z",
    "issues": [],
    "metrics": {
      "api_response_time_ms": 250,
      "webhook_success_rate": 99.5,
      "sync_success_rate": 100.0
    }
  }
}
```

## Connection Flow Diagram

```
1. Super Admin generates connection token
2. Token shared with store owner
3. Store owner visits setup URL
4. Store authorizes connection & provides API access
5. Super Admin receives webhook with connection details
6. Initial data sync begins
7. Regular sync schedule established
```

## Supported Platforms

### Platform Configurations
```json
{
  "shopify": {
    "api_version": "2024-01",
    "required_scopes": [
      "read_products",
      "read_orders",
      "read_customers"
    ],
    "webhook_endpoints": [
      "orders/create",
      "orders/updated",
      "products/create"
    ]
  },
  "woocommerce": {
    "api_version": "v3",
    "required_permissions": [
      "read_product",
      "read_order",
      "read_customer"
    ]
  }
}
```

## Error Codes
- `CONNECTION_TOKEN_EXPIRED` - Token has expired
- `STORE_ALREADY_CONNECTED` - Store already connected
- `API_KEY_INVALID` - Invalid store API key
- `SYNC_FAILED` - Data synchronization failed
- `WEBHOOK_SETUP_FAILED` - Failed to setup webhooks
- `PLATFORM_NOT_SUPPORTED` - Store platform not supported