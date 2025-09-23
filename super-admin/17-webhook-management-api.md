# Webhook Management API

## Overview
Platform-wide webhook management and delivery monitoring.

## Endpoints

### Configure Platform Webhooks
```http
POST /webhooks/platform
```

**Request Body:**
```json
{
  "url": "https://api.example.com/webhooks",
  "events": ["store.created", "subscription.updated"],
  "secret": "webhook_secret_123",
  "retry_attempts": 3,
  "timeout_seconds": 30
}
```

### List All Webhooks
```http
GET /webhooks
```

**Response:**
```json
{
  "data": [
    {
      "webhook_id": "webhook_123",
      "url": "https://api.example.com/webhooks",
      "events": ["store.created", "subscription.updated"],
      "status": "active",
      "success_rate": 98.5,
      "last_delivery": "2024-01-20T15:30:00Z"
    }
  ]
}
```

### Get Webhook Delivery Logs
```http
GET /webhooks/{webhook_id}/deliveries
```

**Response:**
```json
{
  "data": [
    {
      "delivery_id": "delivery_123",
      "event": "store.created",
      "status": "success",
      "response_code": 200,
      "delivered_at": "2024-01-20T15:30:00Z",
      "attempts": 1,
      "payload_size": 1024
    }
  ]
}
```