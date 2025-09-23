# Store Authentication API

## Overview
Cross-store authentication and Single Sign-On (SSO) management for the Super Admin platform.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Generate SSO Token
```http
POST /auth/sso/generate
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "target_store_id": "store_456",
  "permissions": ["admin", "products.manage"],
  "expires_in": 3600,
  "redirect_url": "https://store456.com/dashboard"
}
```

**Response:**
```json
{
  "data": {
    "sso_token": "sso_token_abc123xyz",
    "expires_at": "2024-01-20T15:30:00Z",
    "login_url": "https://store456.com/auth/sso?token=sso_token_abc123xyz",
    "user_permissions": [
      "admin",
      "products.manage"
    ]
  }
}
```

### Validate SSO Token
```http
GET /auth/sso/validate/{token}
```

**Response:**
```json
{
  "data": {
    "valid": true,
    "user_id": "user_123",
    "target_store_id": "store_456",
    "permissions": ["admin", "products.manage"],
    "expires_at": "2024-01-20T15:30:00Z",
    "user_info": {
      "email": "user@example.com",
      "name": "John Smith",
      "role": "store_admin"
    }
  }
}
```

### Complete SSO Login
```http
POST /auth/sso/complete
```

**Request Body:**
```json
{
  "sso_token": "sso_token_abc123xyz",
  "store_id": "store_456"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "store_access_token_789",
    "refresh_token": "store_refresh_token_456",
    "expires_in": 7200,
    "user_session": {
      "user_id": "user_123",
      "store_id": "store_456",
      "permissions": ["admin", "products.manage"],
      "session_id": "session_abc123"
    }
  }
}
```

### Cross-Store Session Check
```http
GET /auth/sessions/{session_id}/stores
```

**Response:**
```json
{
  "data": {
    "user_id": "user_123",
    "active_sessions": [
      {
        "store_id": "store_456",
        "store_name": "Fashion Store",
        "session_id": "session_abc123",
        "logged_in_at": "2024-01-20T14:00:00Z",
        "last_activity": "2024-01-20T14:25:00Z",
        "permissions": ["admin", "products.manage"]
      },
      {
        "store_id": "store_789",
        "store_name": "Tech Store",
        "session_id": "session_def456",
        "logged_in_at": "2024-01-20T13:30:00Z",
        "last_activity": "2024-01-20T14:20:00Z",
        "permissions": ["viewer"]
      }
    ]
  }
}
```

### Revoke Store Access
```http
POST /auth/revoke-access
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "store_id": "store_456",
  "revoke_all_sessions": true
}
```

### Get User Access Matrix
```http
GET /auth/users/{user_id}/access-matrix
```

**Response:**
```json
{
  "data": {
    "user_id": "user_123",
    "stores": [
      {
        "store_id": "store_456",
        "store_name": "Fashion Store",
        "role": "admin",
        "permissions": [
          "products.create",
          "products.update",
          "orders.view",
          "analytics.view"
        ],
        "granted_by": "user_789",
        "granted_at": "2024-01-15T10:30:00Z",
        "last_accessed": "2024-01-20T14:25:00Z"
      }
    ],
    "platform_permissions": [
      "stores.view",
      "users.manage"
    ]
  }
}
```

### Update User Permissions
```http
PUT /auth/users/{user_id}/stores/{store_id}/permissions
```

**Request Body:**
```json
{
  "permissions": [
    "products.create",
    "products.update",
    "orders.view"
  ],
  "role": "manager"
}
```

### Bulk Revoke Sessions
```http
POST /auth/sessions/bulk-revoke
```

**Request Body:**
```json
{
  "criteria": {
    "store_id": "store_456",
    "inactive_hours": 24,
    "role": "temporary"
  }
}
```

### Generate API Key for Store
```http
POST /auth/api-keys/generate
```

**Request Body:**
```json
{
  "store_id": "store_456",
  "name": "Integration API Key",
  "permissions": [
    "products.read",
    "orders.read"
  ],
  "expires_in_days": 365
}
```

**Response:**
```json
{
  "data": {
    "api_key_id": "key_123",
    "api_key": "sk_store456_abc123xyz789",
    "name": "Integration API Key",
    "permissions": [
      "products.read",
      "orders.read"
    ],
    "expires_at": "2025-01-20T00:00:00Z",
    "created_at": "2024-01-20T14:30:00Z"
  }
}
```

### List Store API Keys
```http
GET /stores/{store_id}/api-keys
```

**Response:**
```json
{
  "data": [
    {
      "api_key_id": "key_123",
      "name": "Integration API Key",
      "key_prefix": "sk_store456_abc123...",
      "permissions": [
        "products.read",
        "orders.read"
      ],
      "expires_at": "2025-01-20T00:00:00Z",
      "last_used": "2024-01-20T13:45:00Z",
      "created_by": "user_789"
    }
  ]
}
```

### Revoke API Key
```http
DELETE /auth/api-keys/{api_key_id}
```

## Authentication Methods

### SSO Flow Types
```json
{
  "flows": [
    {
      "type": "admin_impersonation",
      "description": "Super admin logs in as store user",
      "duration": "1 hour",
      "audit_logged": true
    },
    {
      "type": "cross_store_access",
      "description": "User switches between their stores",
      "duration": "session",
      "permissions_inherited": false
    },
    {
      "type": "temporary_access",
      "description": "Time-limited access for support",
      "duration": "configurable",
      "auto_revoke": true
    }
  ]
}
```

### Permission Inheritance
```json
{
  "inheritance_rules": {
    "platform_admin": {
      "auto_grants": ["store.view", "users.view"],
      "restrictions": ["billing.modify"]
    },
    "store_owner": {
      "auto_grants": ["full_store_access"],
      "cross_store_access": false
    }
  }
}
```

## Security Features

### Session Management
- Automatic session timeout after inactivity
- Concurrent session limits per user
- Geographic anomaly detection
- Device fingerprinting

### Audit Trail
```json
{
  "audit_event": {
    "event_type": "sso_login",
    "user_id": "user_123",
    "source_store": "super_admin",
    "target_store": "store_456",
    "timestamp": "2024-01-20T14:30:00Z",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "permissions_granted": ["admin"]
  }
}
```

## Webhooks
```json
{
  "event": "auth.cross_store_login",
  "data": {
    "user_id": "user_123",
    "from_store": "store_456",
    "to_store": "store_789",
    "method": "sso_token"
  }
}
```

## Error Codes
- `SSO_TOKEN_EXPIRED` - SSO token has expired
- `INVALID_PERMISSIONS` - Invalid permission requested
- `CROSS_STORE_DENIED` - Cross-store access not allowed
- `SESSION_LIMIT_EXCEEDED` - Too many active sessions
- `STORE_ACCESS_REVOKED` - Access to store was revoked
- `API_KEY_INVALID` - Invalid or expired API key