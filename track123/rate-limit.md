Rate limit
To ensure optimal performance and prevent misuse, the Track123 API enforces rate limits.

Rate Limit Details
Maximum Requests: 5 requests per second per endpoint.
Exceeding the Limit: If the rate limit is exceeded, the API will return an HTTP A0706 Too Many Requests error.
Retry Mechanism: When you receive a A0706 error, reduce the frequency of requests and retry after a short delay.
Best Practices for Managing Rate Limits
Implement Request Throttling: Use a queuing mechanism in your application to ensure the request rate stays within the allowed limit.
Monitor Usage: Track your request rates to proactively avoid hitting the limit.
Handle A0706 Errors Gracefully: When a A0706 response is received, pause further requests to the API and retry after a delay.
For more information or assistance, please contact our support team.