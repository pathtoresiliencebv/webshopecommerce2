# Third-Party Integrations API

## Overview
Management of external service integrations across all stores.

## Endpoints

### List Available Integrations
```http
GET /integrations/available
```

**Response:**
```json
{
  "data": [
    {
      "integration_id": "stripe",
      "name": "Stripe Payments",
      "category": "payment",
      "description": "Accept credit card payments",
      "supported_features": ["payments", "subscriptions", "refunds"]
    }
  ]
}
```

### Configure Store Integration
```http
POST /stores/{store_id}/integrations
```

**Request Body:**
```json
{
  "integration_id": "stripe",
  "config": {
    "api_key": "sk_test_...",
    "webhook_endpoint": "https://store.com/webhooks/stripe"
  },
  "enabled_features": ["payments", "refunds"]
}
```

### Get Integration Status
```http
GET /stores/{store_id}/integrations/{integration_id}
```

**Response:**
```json
{
  "data": {
    "integration_id": "stripe",
    "status": "active",
    "health_check": "healthy",
    "last_sync": "2024-01-20T15:30:00Z",
    "configuration": {
      "api_version": "2024-01-01",
      "webhook_status": "active"
    }
  }
}
```