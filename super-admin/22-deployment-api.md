# Deployment Management API

## Overview
Store deployment, template management, and environment provisioning for the Super Admin platform.

## Endpoints

### Deploy Store Template
```http
POST /deployment/templates/{template_id}/deploy
```

**Request Body:**
```json
{
  "store_id": "store_456",
  "template_variables": {
    "store_name": "My New Store",
    "primary_color": "#FF6B6B",
    "currency": "EUR",
    "language": "nl"
  },
  "deployment_environment": "production",
  "auto_configure_domain": true
}
```

**Response:**
```json
{
  "data": {
    "deployment_id": "deploy_123",
    "status": "started",
    "progress": 0,
    "estimated_completion": "10-15 minutes",
    "deployment_url": "https://my-new-store.platform.com"
  }
}
```

### Get Deployment Status
```http
GET /deployment/deployments/{deployment_id}
```

**Response:**
```json
{
  "data": {
    "deployment_id": "deploy_123",
    "store_id": "store_456",
    "status": "completed",
    "progress": 100,
    "started_at": "2024-01-20T15:00:00Z",
    "completed_at": "2024-01-20T15:12:00Z",
    "deployment_logs": [
      {
        "timestamp": "2024-01-20T15:01:00Z",
        "stage": "template_processing",
        "status": "completed"
      },
      {
        "timestamp": "2024-01-20T15:05:00Z", 
        "stage": "database_setup",
        "status": "completed"
      }
    ],
    "deployed_urls": {
      "storefront": "https://my-new-store.platform.com",
      "admin": "https://my-new-store.platform.com/admin"
    }
  }
}
```

### List Available Templates
```http
GET /deployment/templates
```

**Response:**
```json
{
  "data": [
    {
      "template_id": "ecommerce_basic",
      "name": "Basic E-commerce Store",
      "description": "Perfect for small businesses starting online",
      "category": "ecommerce",
      "features": ["product_catalog", "shopping_cart", "checkout"],
      "preview_url": "https://preview.platform.com/ecommerce_basic"
    }
  ]
}
```

### Rollback Deployment
```http
POST /deployment/stores/{store_id}/rollback
```

**Request Body:**
```json
{
  "target_version": "v1.2.3",
  "rollback_reason": "Critical bug in new version"
}
```