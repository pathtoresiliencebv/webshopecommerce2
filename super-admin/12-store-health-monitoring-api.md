# Store Health Monitoring API

## Overview
Comprehensive health monitoring and alerting system for all stores in the Super Admin platform, tracking performance, uptime, errors, and system health metrics.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### Get Platform Health Overview
```http
GET /monitoring/platform/health
```

**Response:**
```json
{
  "data": {
    "overall_health_score": 94.2,
    "status": "healthy",
    "total_stores": 156,
    "healthy_stores": 142,
    "warning_stores": 12,
    "critical_stores": 2,
    "system_metrics": {
      "avg_response_time_ms": 245,
      "uptime_percentage": 99.97,
      "error_rate": 0.03,
      "throughput_rps": 8945
    },
    "infrastructure": {
      "database_health": "healthy",
      "cdn_health": "healthy", 
      "api_gateway_health": "healthy",
      "storage_health": "healthy"
    },
    "alerts": {
      "active_alerts": 5,
      "critical_alerts": 1,
      "warning_alerts": 4
    }
  }
}
```

### Get Store Health Details
```http
GET /monitoring/stores/{store_id}/health
```

**Response:**
```json
{
  "data": {
    "store_id": "store_456",
    "store_name": "Fashion Store Amsterdam",
    "health_score": 92.5,
    "status": "healthy",
    "last_check": "2024-01-20T15:30:00Z",
    "uptime": {
      "percentage_24h": 100.0,
      "percentage_7d": 99.95,
      "percentage_30d": 99.89,
      "current_uptime": "15d 4h 23m",
      "last_downtime": "2024-01-05T08:15:00Z"
    },
    "performance": {
      "avg_response_time_ms": 235,
      "95th_percentile_ms": 580,
      "99th_percentile_ms": 1250,
      "apdex_score": 0.94,
      "throughput_rpm": 567
    },
    "errors": {
      "error_rate_24h": 0.02,
      "4xx_errors": 12,
      "5xx_errors": 2,
      "database_errors": 0,
      "api_errors": 3
    },
    "resources": {
      "cpu_usage": 45.2,
      "memory_usage": 67.8,
      "disk_usage": 34.5,
      "bandwidth_usage_gb": 125.3
    },
    "dependencies": {
      "database": "healthy",
      "cdn": "healthy",
      "payment_gateway": "healthy",
      "email_service": "degraded"
    },
    "security": {
      "ssl_certificate_expires_in_days": 75,
      "security_scan_score": 98,
      "vulnerability_count": 0
    }
  }
}
```

### List All Store Health Statuses
```http
GET /monitoring/stores/health
```

**Query Parameters:**
- `status` (string): "healthy", "warning", "critical", "unknown"
- `health_score_min` (integer): Minimum health score (0-100)
- `sort_by` (string): "health_score", "response_time", "uptime", "error_rate"
- `limit` (integer): Number of stores to return

**Response:**
```json
{
  "data": [
    {
      "store_id": "store_456",
      "store_name": "Fashion Store Amsterdam",
      "health_score": 92.5,
      "status": "healthy",
      "response_time_ms": 235,
      "uptime_24h": 100.0,
      "error_rate": 0.02,
      "last_check": "2024-01-20T15:30:00Z",
      "alerts_count": 0
    },
    {
      "store_id": "store_789",
      "store_name": "Tech Store Berlin", 
      "health_score": 78.3,
      "status": "warning",
      "response_time_ms": 890,
      "uptime_24h": 98.5,
      "error_rate": 2.1,
      "last_check": "2024-01-20T15:30:00Z",
      "alerts_count": 3
    }
  ],
  "summary": {
    "avg_health_score": 87.4,
    "stores_by_status": {
      "healthy": 142,
      "warning": 12,
      "critical": 2
    }
  }
}
```

### Get Store Performance History
```http
GET /monitoring/stores/{store_id}/performance/history
```

**Query Parameters:**
- `period` (string): "1h", "24h", "7d", "30d"
- `granularity` (string): "minute", "hour", "day"
- `metrics` (array): ["response_time", "error_rate", "throughput"]

**Response:**
```json
{
  "data": {
    "period": "24h",
    "granularity": "hour",
    "metrics": [
      {
        "timestamp": "2024-01-20T14:00:00Z",
        "response_time_ms": 245,
        "error_rate": 0.02,
        "throughput_rpm": 567,
        "uptime_percentage": 100.0,
        "health_score": 92.5
      }
    ],
    "summary": {
      "avg_response_time": 235,
      "max_response_time": 890,
      "min_response_time": 180,
      "avg_error_rate": 0.15,
      "total_requests": 456789
    }
  }
}
```

### Create Health Check
```http
POST /monitoring/stores/{store_id}/checks
```

**Request Body:**
```json
{
  "check_type": "http",
  "endpoint": "https://store456.com/health",
  "method": "GET",
  "expected_status": 200,
  "timeout_ms": 5000,
  "frequency_minutes": 5,
  "retry_attempts": 3,
  "headers": {
    "User-Agent": "SuperAdmin-HealthChecker/1.0"
  },
  "success_criteria": {
    "response_contains": "ok",
    "response_time_max_ms": 1000
  }
}
```

**Response:**
```json
{
  "data": {
    "check_id": "check_123",
    "status": "active",
    "next_check": "2024-01-20T15:35:00Z",
    "created_at": "2024-01-20T15:30:00Z"
  }
}
```

### Get Store Alerts
```http
GET /monitoring/stores/{store_id}/alerts
```

**Query Parameters:**
- `status` (string): "active", "resolved", "acknowledged"
- `severity` (string): "critical", "warning", "info"
- `limit` (integer): Number of alerts to return

**Response:**
```json
{
  "data": [
    {
      "alert_id": "alert_123",
      "severity": "warning",
      "status": "active",
      "title": "High Response Time",
      "description": "Average response time exceeded 500ms threshold",
      "metric": "response_time",
      "current_value": 890,
      "threshold": 500,
      "triggered_at": "2024-01-20T14:25:00Z",
      "duration": "1h 5m",
      "acknowledgments": [],
      "auto_resolve": true
    }
  ]
}
```

### Configure Store Monitoring
```http
PUT /monitoring/stores/{store_id}/config
```

**Request Body:**
```json
{
  "monitoring_enabled": true,
  "check_frequency_minutes": 5,
  "thresholds": {
    "response_time_warning_ms": 500,
    "response_time_critical_ms": 2000,
    "error_rate_warning": 1.0,
    "error_rate_critical": 5.0,
    "uptime_warning": 99.0,
    "uptime_critical": 95.0
  },
  "notifications": {
    "email_enabled": true,
    "webhook_enabled": true,
    "sms_enabled": false,
    "email_recipients": ["admin@store456.com"],
    "webhook_url": "https://store456.com/webhooks/monitoring"
  },
  "maintenance_windows": [
    {
      "day": "sunday",
      "start_time": "02:00",
      "end_time": "04:00",
      "timezone": "Europe/Amsterdam"
    }
  ]
}
```

### Acknowledge Alert
```http
POST /monitoring/alerts/{alert_id}/acknowledge
```

**Request Body:**
```json
{
  "acknowledged_by": "admin@platform.com",
  "note": "Investigating high response times, scaling resources"
}
```

### Resolve Alert
```http
POST /monitoring/alerts/{alert_id}/resolve
```

**Request Body:**
```json
{
  "resolved_by": "admin@platform.com",
  "resolution": "Increased server capacity, response times normalized"
}
```

### Get Uptime Statistics
```http
GET /monitoring/stores/{store_id}/uptime
```

**Query Parameters:**
- `period` (string): "24h", "7d", "30d", "90d", "1y"

**Response:**
```json
{
  "data": {
    "store_id": "store_456",
    "period": "30d",
    "uptime_percentage": 99.89,
    "total_downtime_minutes": 47,
    "incidents": [
      {
        "incident_id": "incident_123",
        "start_time": "2024-01-05T08:15:00Z",
        "end_time": "2024-01-05T08:47:00Z",
        "duration_minutes": 32,
        "cause": "Database connection timeout",
        "resolution": "Restarted database connection pool"
      }
    ],
    "sla_compliance": {
      "target_uptime": 99.9,
      "actual_uptime": 99.89,
      "sla_met": false,
      "sla_credit_eligible": true
    }
  }
}
```

### Get Resource Usage
```http
GET /monitoring/stores/{store_id}/resources
```

**Response:**
```json
{
  "data": {
    "cpu": {
      "current_usage": 45.2,
      "avg_24h": 38.7,
      "peak_24h": 78.9,
      "threshold_warning": 80.0,
      "threshold_critical": 95.0
    },
    "memory": {
      "current_usage": 67.8,
      "avg_24h": 62.3,
      "peak_24h": 89.1,
      "total_gb": 16,
      "available_gb": 5.2
    },
    "disk": {
      "usage_percentage": 34.5,
      "total_gb": 500,
      "used_gb": 172.5,
      "available_gb": 327.5,
      "growth_rate_gb_per_day": 2.3
    },
    "network": {
      "bandwidth_in_mbps": 125.3,
      "bandwidth_out_mbps": 89.7,
      "requests_per_second": 23.4,
      "connections_active": 156
    }
  }
}
```

### Trigger Manual Health Check
```http
POST /monitoring/stores/{store_id}/check
```

**Response:**
```json
{
  "data": {
    "check_id": "manual_check_456",
    "status": "completed",
    "results": {
      "http_check": "passed",
      "database_check": "passed",
      "api_check": "passed",
      "ssl_check": "passed"
    },
    "health_score": 95.2,
    "completed_at": "2024-01-20T15:32:15Z"
  }
}
```

## Real-time Monitoring

### WebSocket Health Updates
```javascript
// Real-time health status updates
{
  "event": "health.status_changed",
  "data": {
    "store_id": "store_456",
    "previous_status": "healthy",
    "current_status": "warning",
    "health_score": 78.5,
    "reason": "response_time_degraded"
  }
}
```

### Live Metrics Stream
```http
GET /monitoring/stores/{store_id}/metrics/stream
```

## Health Scoring Algorithm

### Scoring Factors
```json
{
  "factors": {
    "uptime": 30,
    "response_time": 25,
    "error_rate": 20,
    "resource_usage": 15,
    "security": 10
  }
}
```

### Thresholds
- **Healthy**: Score 90-100
- **Warning**: Score 70-89
- **Critical**: Score 0-69

## Integration & Automation

### Supported Integrations
- PagerDuty
- Slack
- Discord
- Microsoft Teams
- Email notifications
- SMS alerts
- Custom webhooks

### Auto-healing Actions
- Automatic service restart
- Traffic rerouting
- Resource scaling
- Cache purging
- Failover activation

## Error Codes
- `STORE_NOT_MONITORED` - Store monitoring not configured
- `HEALTH_CHECK_FAILED` - Health check execution failed
- `THRESHOLD_CONFIG_INVALID` - Invalid threshold configuration
- `NOTIFICATION_DELIVERY_FAILED` - Failed to deliver notification
- `MAINTENANCE_WINDOW_CONFLICT` - Check scheduled during maintenance