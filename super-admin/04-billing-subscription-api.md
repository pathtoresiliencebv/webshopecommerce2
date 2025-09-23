# Billing & Subscription API

## Overview
Comprehensive billing and subscription management across all stores in the platform.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Get Billing Overview
```http
GET /billing/overview
```

**Response:**
```json
{
  "data": {
    "total_mrr": 145600,
    "total_arr": 1747200,
    "active_subscriptions": 142,
    "trial_subscriptions": 23,
    "churned_this_month": 5,
    "new_subscriptions_this_month": 18,
    "revenue_breakdown": {
      "starter": 24500,
      "professional": 89100,
      "enterprise": 32000
    }
  }
}
```

### List All Subscriptions
```http
GET /subscriptions
```

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): "active", "trialing", "past_due", "canceled"
- `plan` (string): "starter", "professional", "enterprise"
- `store_id` (string): Filter by store

**Response:**
```json
{
  "data": [
    {
      "id": "sub_123",
      "store_id": "store_456",
      "store_name": "Fashion Store",
      "plan": "professional",
      "status": "active",
      "current_period_start": "2024-01-01T00:00:00Z",
      "current_period_end": "2024-02-01T00:00:00Z",
      "amount": 99.00,
      "currency": "EUR",
      "trial_end": null,
      "cancel_at_period_end": false,
      "usage": {
        "storage_gb": 15.5,
        "bandwidth_gb": 125.2,
        "api_calls": 45000,
        "products": 450
      }
    }
  ]
}
```

### Get Subscription Details
```http
GET /subscriptions/{subscription_id}
```

**Response:**
```json
{
  "data": {
    "id": "sub_123",
    "store_id": "store_456",
    "customer": {
      "id": "cus_789",
      "email": "owner@fashion.store",
      "name": "John Smith"
    },
    "plan": {
      "id": "plan_pro",
      "name": "Professional",
      "amount": 99.00,
      "currency": "EUR",
      "interval": "month",
      "features": [
        "unlimited_products",
        "advanced_analytics",
        "email_marketing"
      ]
    },
    "payment_method": {
      "type": "card",
      "last4": "4242",
      "brand": "visa",
      "exp_month": 12,
      "exp_year": 2025
    },
    "invoices": [
      {
        "id": "inv_456",
        "amount": 99.00,
        "status": "paid",
        "created": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Update Subscription
```http
PUT /subscriptions/{subscription_id}
```

**Request Body:**
```json
{
  "plan": "enterprise",
  "prorate": true,
  "billing_cycle_anchor": "unchanged"
}
```

### Cancel Subscription
```http
POST /subscriptions/{subscription_id}/cancel
```

**Request Body:**
```json
{
  "cancel_at_period_end": true,
  "reason": "customer_request"
}
```

### Create Invoice
```http
POST /subscriptions/{subscription_id}/invoices
```

**Request Body:**
```json
{
  "description": "Additional usage charges",
  "amount": 25.00,
  "currency": "EUR"
}
```

### Get Revenue Analytics
```http
GET /billing/analytics
```

**Query Parameters:**
- `period` (string): "7d", "30d", "90d", "1y"
- `granularity` (string): "day", "week", "month"

**Response:**
```json
{
  "data": {
    "period": "30d",
    "metrics": [
      {
        "date": "2024-01-15",
        "mrr": 145600,
        "new_revenue": 1800,
        "churned_revenue": 300,
        "expansion_revenue": 500
      }
    ],
    "cohort_analysis": [
      {
        "cohort": "2024-01",
        "customers": 18,
        "retention_rate": 94.4
      }
    ]
  }
}
```

### Get Usage Analytics
```http
GET /billing/usage
```

**Response:**
```json
{
  "data": {
    "total_storage_gb": 2156.8,
    "total_bandwidth_gb": 15667.2,
    "total_api_calls": 2456789,
    "overage_charges": {
      "storage": 125.50,
      "bandwidth": 89.20,
      "api_calls": 0
    },
    "by_plan": {
      "starter": {
        "stores": 45,
        "avg_storage": 5.2,
        "avg_bandwidth": 25.8
      }
    }
  }
}
```

### Get Churn Analytics
```http
GET /billing/churn
```

**Response:**
```json
{
  "data": {
    "monthly_churn_rate": 3.2,
    "annual_churn_rate": 18.5,
    "churn_reasons": [
      {
        "reason": "price_too_high",
        "count": 12,
        "percentage": 40.0
      }
    ],
    "at_risk_customers": [
      {
        "store_id": "store_789",
        "risk_score": 85,
        "factors": ["payment_failed", "low_usage"]
      }
    ]
  }
}
```

### Process Refund
```http
POST /billing/refunds
```

**Request Body:**
```json
{
  "invoice_id": "inv_456",
  "amount": 99.00,
  "reason": "customer_request"
}
```

## Subscription Plans

### Plan Configuration
```json
{
  "plans": [
    {
      "id": "starter",
      "name": "Starter",
      "amount": 29.00,
      "currency": "EUR",
      "interval": "month",
      "limits": {
        "products": 100,
        "storage_gb": 5,
        "bandwidth_gb": 50,
        "api_calls": 10000
      },
      "features": [
        "basic_analytics",
        "email_support"
      ]
    },
    {
      "id": "professional",
      "name": "Professional",
      "amount": 99.00,
      "currency": "EUR",
      "interval": "month",
      "limits": {
        "products": -1,
        "storage_gb": 50,
        "bandwidth_gb": 500,
        "api_calls": 100000
      },
      "features": [
        "unlimited_products",
        "advanced_analytics",
        "email_marketing",
        "priority_support"
      ]
    }
  ]
}
```

## Webhooks
```json
{
  "event": "subscription.updated",
  "data": {
    "subscription_id": "sub_123",
    "store_id": "store_456",
    "previous_plan": "starter",
    "new_plan": "professional"
  }
}
```

## Error Codes
- `SUBSCRIPTION_NOT_FOUND` - Subscription doesn't exist
- `PAYMENT_METHOD_REQUIRED` - Payment method needed
- `PLAN_NOT_AVAILABLE` - Requested plan not available
- `USAGE_LIMIT_EXCEEDED` - Store exceeded usage limits
- `REFUND_FAILED` - Refund processing failed