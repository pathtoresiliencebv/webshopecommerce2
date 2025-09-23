# Maintenance Mode API

## Overview
Platform and store-level maintenance operations and scheduled downtime management.

## Endpoints

### Enable Maintenance Mode
```http
POST /maintenance/stores/{store_id}/enable
```

**Request Body:**
```json
{
  "maintenance_type": "scheduled",
  "duration_minutes": 120,
  "message": "We're upgrading our systems for better performance",
  "notify_customers": true,
  "allow_admin_access": true,
  "start_time": "2024-01-21T02:00:00Z"
}
```

**Response:**
```json
{
  "data": {
    "maintenance_id": "maint_123",
    "status": "scheduled",
    "maintenance_page_url": "https://store456.com/maintenance",
    "admin_bypass_token": "admin_bypass_abc123"
  }
}
```

### Get Maintenance Status
```http
GET /maintenance/stores/{store_id}/status
```

**Response:**
```json
{
  "data": {
    "store_id": "store_456",
    "maintenance_active": false,
    "next_scheduled": "2024-01-21T02:00:00Z",
    "last_maintenance": "2024-01-15T03:30:00Z",
    "uptime_percentage": 99.97
  }
}
```

### Schedule Platform Maintenance
```http
POST /maintenance/platform/schedule
```

**Request Body:**
```json
{
  "maintenance_window": {
    "start_time": "2024-01-21T01:00:00Z",
    "duration_hours": 3
  },
  "affected_services": ["api", "dashboard", "billing"],
  "notification_schedule": {
    "advance_days": [7, 3, 1],
    "channels": ["email", "dashboard", "status_page"]
  }
}
```