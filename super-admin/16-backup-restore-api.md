# Backup & Restore API

## Overview
Automated backup and restore operations for store data and configurations.

## Endpoints

### Create Backup
```http
POST /backup/stores/{store_id}
```

**Request Body:**
```json
{
  "backup_type": "full",
  "include_data": ["products", "orders", "customers"],
  "retention_days": 30,
  "encryption": true
}
```

**Response:**
```json
{
  "data": {
    "backup_id": "backup_123",
    "status": "started",
    "estimated_completion": "15-30 minutes",
    "backup_size_estimate": "2.5 GB"
  }
}
```

### List Backups
```http
GET /backup/stores/{store_id}
```

### Restore Store
```http
POST /restore/stores/{store_id}
```

**Request Body:**
```json
{
  "backup_id": "backup_123",
  "restore_type": "full",
  "target_store_id": "store_new_456"
}
```