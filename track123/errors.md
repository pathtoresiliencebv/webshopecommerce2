# Error Handling

Track123 API error codes and handling guidelines.

## Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized  
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Error Response Format

```json
{
  "error": {
    "code": "INVALID_TRACKING_NUMBER",
    "message": "The provided tracking number is invalid",
    "details": {}
  }
}
```

## Handling Strategies

Coming soon...