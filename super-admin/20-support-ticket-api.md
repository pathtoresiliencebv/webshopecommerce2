# Support Ticket System API

## Overview
Platform-wide support ticket management and customer service operations.

## Endpoints

### List Support Tickets
```http
GET /support/tickets
```

**Query Parameters:**
- `status` (string): "open", "in_progress", "resolved", "closed"
- `priority` (string): "low", "medium", "high", "critical"
- `store_id` (string): Filter by store
- `assigned_agent` (string): Filter by agent

**Response:**
```json
{
  "data": [
    {
      "ticket_id": "ticket_123",
      "store_id": "store_456",
      "store_name": "Fashion Store",
      "subject": "Payment processing issue",
      "status": "open",
      "priority": "high",
      "created_at": "2024-01-20T14:30:00Z",
      "customer": {
        "name": "John Smith",
        "email": "john@example.com"
      },
      "assigned_agent": "support_agent_1",
      "category": "technical",
      "last_response": "2024-01-20T15:00:00Z"
    }
  ]
}
```

### Create Support Ticket
```http
POST /support/tickets
```

**Request Body:**
```json
{
  "store_id": "store_456",
  "subject": "Payment processing issue",
  "description": "Customers unable to complete checkout",
  "priority": "high",
  "category": "technical",
  "customer_info": {
    "name": "John Smith",
    "email": "john@example.com"
  }
}
```

### Get Support Analytics
```http
GET /support/analytics
```

**Response:**
```json
{
  "data": {
    "total_tickets": 1245,
    "open_tickets": 89,
    "avg_response_time": "2h 15m",
    "avg_resolution_time": "1d 4h",
    "customer_satisfaction": 4.2,
    "tickets_by_category": {
      "technical": 456,
      "billing": 234,
      "general": 555
    }
  }
}
```