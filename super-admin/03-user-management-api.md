# User Management API

## Overview
Platform-wide user management across all stores, including roles, permissions, and cross-store access.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### List Platform Users
```http
GET /users
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `role` (string): "super_admin", "store_owner", "store_admin", "customer"
- `status` (string): "active", "inactive", "suspended"
- `search` (string): Search by name or email
- `store_id` (string): Filter by store association

**Response:**
```json
{
  "data": [
    {
      "id": "user_123",
      "email": "john@example.com",
      "name": "John Smith",
      "role": "store_owner",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "last_login": "2024-01-20T14:25:00Z",
      "stores": [
        {
          "store_id": "store_456",
          "name": "Fashion Store",
          "role": "owner"
        }
      ],
      "permissions": [
        "store.manage",
        "products.create",
        "orders.view"
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8945
  }
}
```

### Get User Details
```http
GET /users/{user_id}
```

**Response:**
```json
{
  "data": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Smith",
    "role": "store_owner",
    "status": "active",
    "profile": {
      "phone": "+31612345678",
      "address": {
        "street": "Damrak 123",
        "city": "Amsterdam",
        "postal_code": "1012 AB",
        "country": "NL"
      }
    },
    "stores": [
      {
        "store_id": "store_456",
        "name": "Fashion Store",
        "role": "owner",
        "joined_at": "2024-01-15T10:30:00Z"
      }
    ],
    "activity": {
      "last_login": "2024-01-20T14:25:00Z",
      "login_count": 245,
      "orders_placed": 12,
      "stores_created": 1
    }
  }
}
```

### Create Platform User
```http
POST /users
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "securepassword123",
  "role": "store_owner",
  "stores": [
    {
      "store_id": "store_789",
      "role": "admin"
    }
  ],
  "send_welcome_email": true
}
```

### Update User
```http
PUT /users/{user_id}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "store_admin",
  "status": "active",
  "permissions": [
    "products.create",
    "orders.manage"
  ]
}
```

### Suspend User
```http
POST /users/{user_id}/suspend
```

**Request Body:**
```json
{
  "reason": "Policy violation",
  "duration_days": 30,
  "notify_user": true
}
```

### Impersonate User
```http
POST /users/{user_id}/impersonate
```

**Response:**
```json
{
  "data": {
    "impersonation_token": "imp_token_abc123",
    "expires_at": "2024-01-20T15:30:00Z",
    "redirect_url": "https://store.example.com?token=imp_token_abc123"
  }
}
```

### Get User Activity Log
```http
GET /users/{user_id}/activity
```

**Response:**
```json
{
  "data": [
    {
      "id": "activity_123",
      "action": "login",
      "timestamp": "2024-01-20T14:25:00Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "store_id": "store_456",
      "details": {
        "success": true,
        "method": "email_password"
      }
    }
  ]
}
```

### Assign User to Store
```http
POST /users/{user_id}/stores
```

**Request Body:**
```json
{
  "store_id": "store_789",
  "role": "admin",
  "permissions": [
    "products.manage",
    "orders.view"
  ]
}
```

### Remove User from Store
```http
DELETE /users/{user_id}/stores/{store_id}
```

## User Roles & Permissions

### Platform Roles
- **super_admin**: Full platform access
- **support**: Customer support access
- **billing_admin**: Billing and subscription management

### Store Roles
- **owner**: Full store access
- **admin**: Store administration
- **manager**: Limited store management
- **staff**: Basic store operations
- **viewer**: Read-only access

### Permissions Matrix
```json
{
  "store.manage": ["owner", "admin"],
  "products.create": ["owner", "admin", "manager"],
  "orders.manage": ["owner", "admin", "manager", "staff"],
  "analytics.view": ["owner", "admin", "manager"],
  "billing.view": ["owner"]
}
```

## Error Codes
- `USER_NOT_FOUND` - User doesn't exist
- `EMAIL_ALREADY_EXISTS` - Email already registered
- `INVALID_ROLE` - Invalid role specified
- `PERMISSION_DENIED` - Insufficient permissions
- `STORE_ACCESS_DENIED` - User doesn't have access to store