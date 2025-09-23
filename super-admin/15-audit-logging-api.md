# Audit Logging & Compliance API

## Overview
Comprehensive audit trail and compliance logging for all platform activities.

## Endpoints

### Get Audit Logs
```http
GET /audit/logs
```

**Query Parameters:**
- `store_id` (string): Filter by store
- `action_type` (string): Type of action
- `user_id` (string): Filter by user
- `start_date` (string): Start date (ISO 8601)
- `end_date` (string): End date (ISO 8601)

**Response:**
```json
{
  "data": [
    {
      "log_id": "log_123",
      "timestamp": "2024-01-20T15:30:00Z",
      "action": "store.created",
      "user_id": "user_456",
      "store_id": "store_789",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "details": {
        "store_name": "New Fashion Store",
        "subscription_plan": "professional"
      }
    }
  ]
}
```

### Generate Compliance Report
```http
POST /audit/compliance-report
```

**Request Body:**
```json
{
  "report_type": "gdpr",
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "include_stores": ["store_456", "store_789"]
}
```