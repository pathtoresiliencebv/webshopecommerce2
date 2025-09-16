# Delivery Sub-Status Codes

Detailed sub-status codes that provide additional context for delivery statuses.

## Sub-Status Categories

### Address Issues
- `incorrect_address` - Address is incorrect
- `insufficient_address` - Address information incomplete
- `address_inaccessible` - Cannot access delivery address

### Recipient Issues  
- `recipient_not_available` - Recipient not available
- `recipient_refused` - Recipient refused package
- `recipient_moved` - Recipient has moved

### Package Issues
- `package_damaged` - Package is damaged
- `package_oversized` - Package too large for delivery
- `package_restricted` - Contains restricted items

### Delivery Constraints
- `weather_delay` - Weather-related delay
- `holiday_delay` - Holiday-related delay
- `customs_clearance` - Held at customs
- `security_check` - Security screening required

### Facility Issues
- `facility_closed` - Delivery facility closed
- `no_safe_location` - No safe delivery location
- `signature_required` - Signature required for delivery