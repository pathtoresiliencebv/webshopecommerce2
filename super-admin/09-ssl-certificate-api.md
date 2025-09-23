# SSL Certificate Management API

## Overview
Automated SSL certificate provisioning, renewal, and management for all domains in the Super Admin platform.

## Base URL
```
https://api.superadmin.platform/v1
```

## Authentication
```http
Authorization: Bearer {super_admin_token}
```

## Endpoints

### List All SSL Certificates
```http
GET /ssl/certificates
```

**Query Parameters:**
- `domain_id` (string): Filter by domain
- `store_id` (string): Filter by store
- `status` (string): "issued", "pending", "expired", "failed", "revoked"
- `expires_within_days` (integer): Certificates expiring within X days
- `auto_renewal` (boolean): Filter by auto-renewal status

**Response:**
```json
{
  "data": [
    {
      "id": "ssl_123",
      "domain_id": "domain_456",
      "domain": "fashion.store",
      "store_id": "store_789",
      "status": "issued",
      "certificate_authority": "Let's Encrypt",
      "issued_at": "2024-01-15T10:30:00Z",
      "expires_at": "2025-01-15T10:30:00Z",
      "days_until_expiry": 75,
      "auto_renewal": true,
      "validation_method": "http-01",
      "san_domains": ["fashion.store", "www.fashion.store"],
      "key_algorithm": "RSA-2048"
    }
  ],
  "summary": {
    "total_certificates": 156,
    "expiring_soon": 12,
    "failed_renewals": 2,
    "auto_renewal_enabled": 142
  }
}
```

### Get SSL Certificate Details
```http
GET /ssl/certificates/{certificate_id}
```

**Response:**
```json
{
  "data": {
    "id": "ssl_123",
    "domain_id": "domain_456",
    "domain": "fashion.store",
    "store_id": "store_789",
    "status": "issued",
    "certificate_details": {
      "serial_number": "03F2E4A5B1C9D7E8F6A2B3C4D5E6F7A8",
      "fingerprint_sha1": "A1B2C3D4E5F6789012345678901234567890ABCD",
      "fingerprint_sha256": "1A2B3C4D5E6F7890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
      "signature_algorithm": "SHA256-RSA",
      "key_size": 2048,
      "version": 3
    },
    "certificate_authority": {
      "name": "Let's Encrypt Authority X3",
      "issuer_dn": "CN=Let's Encrypt Authority X3,O=Let's Encrypt,C=US"
    },
    "subject": {
      "common_name": "fashion.store",
      "organization": null,
      "country": null
    },
    "validity": {
      "issued_at": "2024-01-15T10:30:00Z",
      "expires_at": "2025-01-15T10:30:00Z",
      "days_remaining": 75,
      "is_valid": true
    },
    "san_domains": [
      "fashion.store",
      "www.fashion.store"
    ],
    "validation": {
      "method": "http-01",
      "validated_at": "2024-01-15T10:25:00Z",
      "validation_records": [
        {
          "domain": "fashion.store",
          "challenge_type": "http-01",
          "validation_url": "http://fashion.store/.well-known/acme-challenge/token123"
        }
      ]
    },
    "auto_renewal": {
      "enabled": true,
      "next_renewal_attempt": "2024-12-15T10:30:00Z",
      "renewal_threshold_days": 30,
      "notification_recipients": ["admin@fashion.store"]
    },
    "usage_stats": {
      "https_requests_24h": 15432,
      "tls_handshakes_24h": 8765,
      "cipher_suites_used": ["ECDHE-RSA-AES128-GCM-SHA256", "ECDHE-RSA-AES256-GCM-SHA384"]
    }
  }
}
```

### Issue New SSL Certificate
```http
POST /ssl/certificates
```

**Request Body:**
```json
{
  "domain_id": "domain_456",
  "certificate_authority": "lets_encrypt",
  "validation_method": "http-01",
  "key_algorithm": "RSA-2048",
  "san_domains": ["example.com", "www.example.com"],
  "auto_renewal": true,
  "notification_email": "admin@example.com"
}
```

**Response:**
```json
{
  "data": {
    "certificate_id": "ssl_124",
    "status": "pending",
    "validation_challenges": [
      {
        "domain": "example.com",
        "type": "http-01",
        "token": "challenge_token_abc123",
        "validation_url": "http://example.com/.well-known/acme-challenge/challenge_token_abc123",
        "content": "challenge_token_abc123.domain_key_authorization"
      }
    ],
    "estimated_completion": "5-10 minutes"
  }
}
```

### Renew SSL Certificate
```http
POST /ssl/certificates/{certificate_id}/renew
```

**Request Body:**
```json
{
  "force_renewal": false,
  "validation_method": "http-01",
  "notification_email": "admin@example.com"
}
```

**Response:**
```json
{
  "data": {
    "renewal_id": "renewal_789",
    "status": "started",
    "current_certificate_expires": "2025-01-15T10:30:00Z",
    "estimated_completion": "5-10 minutes"
  }
}
```

### Get Renewal Status
```http
GET /ssl/renewals/{renewal_id}
```

**Response:**
```json
{
  "data": {
    "renewal_id": "renewal_789",
    "certificate_id": "ssl_123",
    "status": "completed",
    "started_at": "2024-01-20T14:00:00Z",
    "completed_at": "2024-01-20T14:05:32Z",
    "new_certificate": {
      "issued_at": "2024-01-20T14:05:00Z",
      "expires_at": "2025-01-20T14:05:00Z",
      "serial_number": "04A3B5C7D9E1F2A4B6C8D0E2F4A6B8C0"
    },
    "validation_logs": [
      {
        "timestamp": "2024-01-20T14:01:00Z",
        "domain": "fashion.store",
        "status": "validated"
      }
    ]
  }
}
```

### Revoke SSL Certificate
```http
POST /ssl/certificates/{certificate_id}/revoke
```

**Request Body:**
```json
{
  "reason": "key_compromise",
  "replace_immediately": true
}
```

### Configure Auto-Renewal
```http
PUT /ssl/certificates/{certificate_id}/auto-renewal
```

**Request Body:**
```json
{
  "enabled": true,
  "renewal_threshold_days": 30,
  "notification_recipients": [
    "admin@example.com",
    "ssl-alerts@company.com"
  ],
  "webhook_url": "https://api.example.com/ssl-renewal-webhook"
}
```

### Get Expiring Certificates
```http
GET /ssl/certificates/expiring
```

**Query Parameters:**
- `days` (integer): Certificates expiring within X days (default: 30)
- `auto_renewal_only` (boolean): Only certificates with auto-renewal disabled

**Response:**
```json
{
  "data": [
    {
      "certificate_id": "ssl_125",
      "domain": "example.com",
      "store_name": "Example Store",
      "expires_at": "2024-02-15T10:30:00Z",
      "days_remaining": 25,
      "auto_renewal": false,
      "urgency": "medium"
    }
  ],
  "summary": {
    "total_expiring": 12,
    "critical": 2,
    "warning": 5,
    "info": 5
  }
}
```

### Bulk SSL Operations
```http
POST /ssl/certificates/bulk
```

**Request Body:**
```json
{
  "operation": "renew",
  "certificate_ids": ["ssl_123", "ssl_124", "ssl_125"],
  "options": {
    "force_renewal": false,
    "validation_method": "http-01",
    "parallel_processing": true
  }
}
```

**Response:**
```json
{
  "data": {
    "bulk_operation_id": "bulk_op_456",
    "status": "started",
    "certificates_queued": 3,
    "estimated_completion": "15-20 minutes"
  }
}
```

### Get SSL Analytics
```http
GET /ssl/analytics
```

**Query Parameters:**
- `period` (string): "7d", "30d", "90d"
- `store_id` (string): Filter by store

**Response:**
```json
{
  "data": {
    "period": "30d",
    "certificates_issued": 45,
    "certificates_renewed": 23,
    "renewal_success_rate": 98.5,
    "avg_issuance_time": "4.2 minutes",
    "certificate_authorities": {
      "lets_encrypt": 42,
      "digicert": 3
    },
    "validation_methods": {
      "http-01": 38,
      "dns-01": 7
    },
    "expiry_timeline": [
      {"month": "2024-02", "expiring_count": 12},
      {"month": "2024-03", "expiring_count": 8}
    ]
  }
}
```

### Test SSL Configuration
```http
POST /ssl/certificates/{certificate_id}/test
```

**Response:**
```json
{
  "data": {
    "test_id": "test_123",
    "overall_status": "pass",
    "tests": {
      "certificate_chain": {
        "status": "pass",
        "chain_length": 3,
        "root_ca_trusted": true
      },
      "cipher_suites": {
        "status": "pass",
        "strong_ciphers": 15,
        "weak_ciphers": 0,
        "recommended_suite": "ECDHE-RSA-AES256-GCM-SHA384"
      },
      "protocol_support": {
        "status": "pass",
        "tls_1_2": true,
        "tls_1_3": true,
        "ssl_v3": false
      },
      "vulnerability_scan": {
        "status": "pass",
        "heartbleed": false,
        "poodle": false,
        "beast": false
      }
    },
    "grade": "A+",
    "recommendations": []
  }
}
```

## Certificate Authority Support

### Supported CAs
```json
{
  "certificate_authorities": [
    {
      "name": "lets_encrypt",
      "display_name": "Let's Encrypt",
      "cost": "free",
      "validation_methods": ["http-01", "dns-01"],
      "max_validity_days": 90,
      "auto_renewal": true
    },
    {
      "name": "digicert",
      "display_name": "DigiCert",
      "cost": "paid",
      "validation_methods": ["http-01", "dns-01", "email"],
      "max_validity_days": 365,
      "warranty": "$1,000,000"
    }
  ]
}
```

### Validation Methods
- **HTTP-01**: File-based validation via HTTP
- **DNS-01**: TXT record validation via DNS
- **TLS-ALPN-01**: TLS extension validation

## Monitoring & Alerts

### Alert Conditions
```json
{
  "alerts": [
    {
      "condition": "certificate_expires_in_days <= 7",
      "severity": "critical",
      "action": "immediate_renewal"
    },
    {
      "condition": "renewal_failed",
      "severity": "high",
      "action": "notify_admin"
    }
  ]
}
```

## Webhooks
```json
{
  "event": "ssl.certificate_renewed",
  "data": {
    "certificate_id": "ssl_123",
    "domain": "fashion.store",
    "store_id": "store_456",
    "expires_at": "2025-01-20T14:05:00Z",
    "auto_renewed": true
  }
}
```

## Error Codes
- `DOMAIN_VALIDATION_FAILED` - Domain ownership validation failed
- `CA_RATE_LIMIT_EXCEEDED` - Certificate authority rate limit reached
- `INVALID_DOMAIN` - Domain name is invalid or restricted
- `CERTIFICATE_REVOKED` - Certificate has been revoked
- `RENEWAL_FAILED` - Automatic renewal failed
- `VALIDATION_TIMEOUT` - Domain validation timed out