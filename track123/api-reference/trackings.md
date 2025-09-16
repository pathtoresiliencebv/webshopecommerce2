# Trackings API

API endpoints for managing package trackings.

## Create Tracking

**POST** `/trackings`

Create a new tracking for a package.

### Request Body

```json
{
  "tracking_number": "1234567890",
  "carrier": "fedex",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "additional_fields": {
    "reference_number": "ORDER-123",
    "delivery_instructions": "Leave at front door"
  }
}
```

### Response

```json
{
  "id": "track_123456",
  "tracking_number": "1234567890",
  "carrier": "fedex",
  "status": "pending",
  "created_at": "2023-01-01T00:00:00Z"
}
```

## Get Tracking

**GET** `/trackings/{tracking_id}`

Retrieve tracking information by ID.

### Response

```json
{
  "id": "track_123456",
  "tracking_number": "1234567890",
  "carrier": "fedex",
  "status": "in_transit",
  "sub_status": "out_for_delivery",
  "estimated_delivery": "2023-01-05T18:00:00Z",
  "events": [
    {
      "timestamp": "2023-01-01T10:00:00Z",
      "status": "picked_up",
      "location": "New York, NY",
      "description": "Package picked up"
    }
  ]
}
```

## Update Tracking

**PUT** `/trackings/{tracking_id}`

Update tracking information.

## Delete Tracking

**DELETE** `/trackings/{tracking_id}`

Delete a tracking.

## List Trackings

**GET** `/trackings`

List all trackings with pagination.

### Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `status` - Filter by status
- `carrier` - Filter by carrier