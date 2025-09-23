# Migration Tools API

## Overview
Data migration and platform upgrade tools for existing stores.

## Endpoints

### Create Migration Job
```http
POST /migration/jobs
```

**Request Body:**
```json
{
  "source_platform": "shopify",
  "source_store_url": "https://mystore.myshopify.com",
  "target_store_id": "store_456",
  "migration_type": "full",
  "data_types": ["products", "customers", "orders"],
  "source_credentials": {
    "api_key": "shpat_...",
    "api_secret": "..."
  }
}
```

**Response:**
```json
{
  "data": {
    "migration_job_id": "migration_123",
    "status": "queued",
    "estimated_duration": "2-4 hours",
    "data_analysis": {
      "products_count": 1250,
      "customers_count": 5600,
      "orders_count": 8900
    }
  }
}
```

### Get Migration Status
```http
GET /migration/jobs/{job_id}
```

**Response:**
```json
{
  "data": {
    "job_id": "migration_123",
    "status": "in_progress",
    "progress": 45.2,
    "current_phase": "migrating_products",
    "completed_entities": {
      "products": 565,
      "customers": 2800
    },
    "errors": [],
    "estimated_completion": "2024-01-20T17:30:00Z"
  }
}
```