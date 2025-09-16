# Webhook Implementation Guide

Guide for implementing Track123 webhooks in your application.

## Overview

Track123 webhooks allow you to receive real-time notifications when tracking status changes occur.

## Webhook Setup

### 1. Configure Webhook URL

Set your webhook endpoint URL in the Track123 dashboard or via API:

```json
{
  "webhook_url": "https://your-app.com/webhooks/track123",
  "events": ["status_updated", "delivered", "exception"],
  "secret": "your_webhook_secret"
}
```

### 2. Webhook Events

Available webhook events:

- `tracking_created` - New tracking created
- `status_updated` - Status changed
- `delivered` - Package delivered
- `exception` - Delivery exception occurred
- `estimated_delivery_updated` - ETA changed

## Webhook Payload

### Status Update Example

```json
{
  "event": "status_updated",
  "timestamp": "2023-01-01T12:00:00Z",
  "tracking": {
    "id": "track_123456",
    "tracking_number": "1234567890",
    "carrier": "fedex",
    "status": "out_for_delivery",
    "sub_status": "loaded_on_delivery_vehicle",
    "estimated_delivery": "2023-01-01T18:00:00Z",
    "current_location": {
      "city": "New York",
      "state": "NY",
      "country": "US"
    }
  },
  "previous_status": "in_transit"
}
```

## Security

### Webhook Signature Verification

Track123 signs webhook payloads using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const calculated = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(calculated, 'hex')
  );
}
```

### Headers

Webhook requests include these headers:

- `X-Track123-Signature` - HMAC signature
- `X-Track123-Event` - Event type
- `X-Track123-Timestamp` - Unix timestamp
- `User-Agent` - Track123-Webhooks/1.0

## Implementation Best Practices

### 1. Idempotency

Handle duplicate webhook deliveries:

```javascript
const processedEvents = new Set();

app.post('/webhooks/track123', (req, res) => {
  const eventId = req.headers['x-track123-event-id'];
  
  if (processedEvents.has(eventId)) {
    return res.status(200).send('Already processed');
  }
  
  processedEvents.add(eventId);
  // Process webhook...
});
```

### 2. Async Processing

Process webhooks asynchronously:

```javascript
app.post('/webhooks/track123', async (req, res) => {
  // Respond quickly
  res.status(200).send('OK');
  
  // Process asynchronously
  processWebhookAsync(req.body);
});
```

### 3. Retry Logic

Track123 retries failed webhooks with exponential backoff:

- Initial retry: 1 second
- Subsequent retries: 2, 4, 8, 16 seconds
- Max retries: 5 attempts

## Testing Webhooks

### 1. Webhook Testing Tool

Use Track123's webhook testing tool in the dashboard to send test payloads.

### 2. ngrok for Local Development

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the HTTPS URL for webhook configuration
```

## Error Handling

Return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (malformed payload)
- `401` - Unauthorized (invalid signature)
- `500` - Server error (retry)