# Platform Overview API

## Overview
The Platform Overview API provides comprehensive dashboard statistics and metrics across all connected stores in the Super Admin platform.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Get Platform Dashboard
```http
GET /platform/dashboard
```

**Response:**
```json
{
  "data": {
    "total_stores": 156,
    "active_stores": 142,
    "total_users": 8945,
    "total_revenue": {
      "amount": 2450000,
      "currency": "EUR",
      "period": "monthly"
    },
    "total_orders": 15673,
    "growth_metrics": {
      "stores_growth": 12.5,
      "revenue_growth": 18.2,
      "users_growth": 25.3
    }
  }
}
```

### Get Platform Statistics
```http
GET /platform/statistics
```

**Query Parameters:**
- `period` (string): "7d", "30d", "90d", "1y"
- `metric` (string): "revenue", "users", "orders", "stores"

**Response:**
```json
{
  "data": {
    "period": "30d",
    "metrics": [
      {
        "date": "2024-01-15",
        "stores_created": 5,
        "revenue": 125000,
        "active_users": 892,
        "total_orders": 1247
      }
    ]
  }
}
```

### Get Top Performing Stores
```http
GET /platform/stores/top-performers
```

**Response:**
```json
{
  "data": [
    {
      "store_id": "store_123",
      "name": "Fashion Store Amsterdam",
      "revenue": 45000,
      "orders": 342,
      "growth_rate": 23.5
    }
  ]
}
```

## Error Handling
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid super admin token"
  }
}
```