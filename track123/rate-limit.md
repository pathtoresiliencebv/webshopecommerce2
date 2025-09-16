# Rate Limiting

Track123 API implements rate limiting to ensure fair usage and system stability.

## Rate Limits

- Standard tier: 100 requests per minute
- Premium tier: 500 requests per minute
- Enterprise tier: Custom limits

## Handling Rate Limits

When rate limits are exceeded, the API returns a 429 status code.

## Best Practices

- Implement exponential backoff
- Cache tracking results when possible
- Use batch requests for multiple trackings