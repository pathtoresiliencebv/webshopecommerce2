# Store Synchronization API

## Overview
Real-time data synchronization between stores and the Super Admin platform, including conflict resolution and data consistency management.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Configure Store Sync
```http
POST /stores/{store_id}/sync/configure
```

**Request Body:**
```json
{
  "sync_frequency": "real_time",
  "entities": [
    {
      "type": "products",
      "direction": "bidirectional",
      "conflict_resolution": "last_write_wins",
      "fields": ["title", "price", "inventory", "description"]
    },
    {
      "type": "orders",
      "direction": "to_platform",
      "fields": ["status", "total", "customer_info"]
    }
  ],
  "webhook_config": {
    "endpoint": "https://store.example.com/webhooks/sync",
    "secret": "webhook_secret_123"
  }
}
```

**Response:**
```json
{
  "data": {
    "sync_config_id": "sync_config_123",
    "status": "configured",
    "entities_configured": 2,
    "next_sync": "real_time",
    "webhook_urls": [
      "https://api.superadmin.platform/v1/webhooks/store_456/products",
      "https://api.superadmin.platform/v1/webhooks/store_456/orders"
    ]
  }
}
```

### Get Sync Status
```http
GET /stores/{store_id}/sync/status
```

**Response:**
```json
{
  "data": {
    "store_id": "store_456",
    "overall_status": "healthy",
    "last_sync": "2024-01-20T14:25:32Z",
    "next_sync": "real_time",
    "entities": [
      {
        "type": "products",
        "status": "synced",
        "last_sync": "2024-01-20T14:25:32Z",
        "records_count": 450,
        "pending_changes": 0,
        "conflicts": 0
      },
      {
        "type": "orders",
        "status": "syncing",
        "last_sync": "2024-01-20T14:24:15Z",
        "records_count": 1245,
        "pending_changes": 5,
        "conflicts": 0
      }
    ],
    "sync_health": {
      "success_rate": 99.8,
      "avg_sync_time": "2.3s",
      "error_count_24h": 2
    }
  }
}
```

### Trigger Manual Sync
```http
POST /stores/{store_id}/sync/trigger
```

**Request Body:**
```json
{
  "entities": ["products", "orders"],
  "sync_type": "incremental",
  "priority": "high",
  "options": {
    "force_full_sync": false,
    "validate_data": true,
    "resolve_conflicts": true
  }
}
```

**Response:**
```json
{
  "data": {
    "sync_job_id": "job_789",
    "status": "queued",
    "estimated_duration": "5-10 minutes",
    "entities_to_sync": ["products", "orders"],
    "queue_position": 1
  }
}
```

### Get Sync Job Status
```http
GET /sync/jobs/{job_id}
```

**Response:**
```json
{
  "data": {
    "job_id": "job_789",
    "store_id": "store_456",
    "status": "in_progress",
    "started_at": "2024-01-20T14:30:00Z",
    "progress": {
      "total_entities": 2,
      "completed_entities": 1,
      "percentage": 50.0,
      "current_entity": "orders",
      "records_processed": 623,
      "records_total": 1245
    },
    "results": {
      "products": {
        "status": "completed",
        "records_synced": 450,
        "records_updated": 12,
        "records_created": 3,
        "conflicts_resolved": 0,
        "errors": 0
      }
    },
    "estimated_completion": "2024-01-20T14:35:00Z"
  }
}
```

### Get Sync Conflicts
```http
GET /stores/{store_id}/sync/conflicts
```

**Query Parameters:**
- `status` (string): "pending", "resolved", "ignored"
- `entity_type` (string): "products", "orders", "customers"
- `page` (integer): Page number
- `limit` (integer): Items per page

**Response:**
```json
{
  "data": [
    {
      "conflict_id": "conflict_123",
      "entity_type": "products",
      "entity_id": "product_456",
      "field": "price",
      "store_value": 99.99,
      "platform_value": 89.99,
      "last_modified_store": "2024-01-20T14:20:00Z",
      "last_modified_platform": "2024-01-20T14:15:00Z",
      "status": "pending",
      "created_at": "2024-01-20T14:25:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### Resolve Sync Conflict
```http
POST /sync/conflicts/{conflict_id}/resolve
```

**Request Body:**
```json
{
  "resolution": "use_store_value",
  "apply_to_similar": true,
  "create_rule": {
    "field": "price",
    "strategy": "newest_wins"
  }
}
```

### Get Sync History
```http
GET /stores/{store_id}/sync/history
```

**Query Parameters:**
- `start_date` (string): ISO 8601 date
- `end_date` (string): ISO 8601 date
- `entity_type` (string): Filter by entity type
- `status` (string): "success", "failed", "partial"

**Response:**
```json
{
  "data": [
    {
      "sync_id": "sync_abc123",
      "started_at": "2024-01-20T14:00:00Z",
      "completed_at": "2024-01-20T14:05:32Z",
      "status": "success",
      "trigger": "webhook",
      "entities_synced": [
        {
          "type": "products",
          "records_processed": 450,
          "records_updated": 12,
          "records_created": 3,
          "duration": "3.2s"
        }
      ],
      "summary": {
        "total_records": 450,
        "successful": 450,
        "failed": 0,
        "conflicts": 0
      }
    }
  ]
}
```

### Configure Sync Rules
```http
POST /stores/{store_id}/sync/rules
```

**Request Body:**
```json
{
  "rules": [
    {
      "name": "price_conflict_resolution",
      "entity_type": "products",
      "field": "price",
      "condition": "conflict_detected",
      "action": "use_highest_value"
    },
    {
      "name": "inventory_sync_frequency",
      "entity_type": "products",
      "field": "inventory",
      "condition": "always",
      "action": "sync_immediately"
    }
  ]
}
```

### Get Real-time Sync Events
```http
GET /stores/{store_id}/sync/events/stream
```
*WebSocket endpoint for real-time sync updates*

**WebSocket Messages:**
```json
{
  "event": "sync_started",
  "data": {
    "sync_id": "sync_def456",
    "entity_type": "orders",
    "trigger": "webhook"
  }
}

{
  "event": "sync_progress",
  "data": {
    "sync_id": "sync_def456",
    "progress": 75.0,
    "records_processed": 934,
    "records_total": 1245
  }
}

{
  "event": "sync_completed",
  "data": {
    "sync_id": "sync_def456",
    "status": "success",
    "duration": "4.2s",
    "records_synced": 1245
  }
}
```

### Pause/Resume Sync
```http
POST /stores/{store_id}/sync/pause
```

```http
POST /stores/{store_id}/sync/resume
```

### Configure Sync Filters
```http
POST /stores/{store_id}/sync/filters
```

**Request Body:**
```json
{
  "entity_type": "products",
  "filters": [
    {
      "field": "status",
      "operator": "equals",
      "value": "active"
    },
    {
      "field": "price",
      "operator": "greater_than",
      "value": 0
    }
  ],
  "exclude_fields": ["internal_notes", "vendor_code"]
}
```

## Sync Strategies

### Conflict Resolution Strategies
```json
{
  "strategies": [
    {
      "name": "last_write_wins",
      "description": "Most recently modified record wins"
    },
    {
      "name": "store_priority",
      "description": "Store version always wins"
    },
    {
      "name": "platform_priority", 
      "description": "Platform version always wins"
    },
    {
      "name": "manual_resolution",
      "description": "Human intervention required"
    }
  ]
}
```

### Sync Frequencies
- `real_time`: Immediate sync via webhooks
- `high`: Every 5 minutes
- `medium`: Every hour
- `low`: Daily
- `manual`: Only when triggered

## Error Handling

### Retry Logic
- Exponential backoff for failed syncs
- Maximum 5 retry attempts
- Dead letter queue for persistent failures
- Automatic recovery for transient errors

### Error Codes
- `SYNC_TIMEOUT` - Sync operation timed out
- `DATA_CONFLICT` - Unresolvable data conflict
- `WEBHOOK_FAILED` - Webhook delivery failed
- `RATE_LIMIT_EXCEEDED` - API rate limit reached
- `INVALID_DATA_FORMAT` - Data format validation failed
- `NETWORK_ERROR` - Network connectivity issues

## Monitoring & Alerts

### Sync Health Metrics
```json
{
  "metrics": {
    "sync_success_rate": 99.8,
    "avg_sync_duration": "2.3s",
    "conflicts_per_day": 3,
    "data_drift_percentage": 0.1,
    "webhook_delivery_rate": 99.9
  }
}
```

### Alert Conditions
- Sync failure rate > 5%
- Conflict count > 10 per hour
- Sync duration > 30 seconds
- Data drift > 1%
- Webhook failures > 3 consecutive