# Gateway Transform Test Script

This repository contains `test-gateway.ts` - a comprehensive test script for validating Gateway Transform AI SDK provider connections.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file with your gateway configuration:

```bash
# Required: Your gateway URL
GATEWAY_TRANSFORM_BASE_URL=https://your-gateway-url.com

# Required: Consumer ID for authentication
LLM_AUTH_CONSUMER_ID=your-consumer-id

# Optional: For development environments with self-signed certificates
# WARNING: Only use this in development, never in production!
NODE_TLS_REJECT_UNAUTHORIZED=0
```

For full LLM authentication with request signing, add these additional variables:

```bash
# Private key for request signing (PEM format)
LLM_AUTH_PK_VALUE="-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END RSA PRIVATE KEY-----"

# Service configuration
LLM_AUTH_SERVICE_NAME=your-service-name
LLM_AUTH_SERVICE_ENV=production

# Header key names (customize based on your gateway requirements)
LLM_AUTH_CONSUMER_ID_KEY=CONSUMER.ID
LLM_AUTH_CONSUMER_TIMESTAMP_KEY=CONSUMER.INTIMESTAMP
LLM_AUTH_KEY_VERSION_KEY=SEC.KEY_VERSION
LLM_AUTH_AUTH_SIGNATURE_KEY=SEC.AUTH_SIGNATURE
LLM_AUTH_SERVICE_NAME_KEY=SVC.NAME
LLM_AUTH_SERVICE_ENV_KEY=SVC.ENV
```

### 3. Run the Test

```bash
npm test
```

## What the Test Does

The `test-gateway.ts` script runs 10 comprehensive tests:

1. **Basic Non-streaming with System Message** - Tests standard chat completion
2. **Multi-turn Conversation** - Tests conversation context handling
3. **Deterministic Response** - Tests with temperature=0
4. **Creative Response** - Tests with high temperature (1.5)
5. **Streaming with System Message** - Tests streaming responses
6. **Streaming Multi-turn Conversation** - Tests streaming with context
7. **User-Only Message** - Tests without system message
8. **Complex System Context** - Tests detailed system instructions
9. **Streaming with Default Temperature** - Tests model defaults
10. **Extended Conversation** - Tests long multi-turn exchanges

Each test logs:
- Full request configuration
- Response content
- Timing information
- Error details (if any)

## Understanding the Output

The test script provides extensive logging to help debug issues:

```
=== Gateway Transform AI SDK Provider Test Suite ===

Test started at: 2024-01-15T10:30:00.000Z
Node version: v20.11.0
Platform: darwin

--- Environment Configuration ---
Using LLM Auth: true
Gateway URL: https://your-gateway-url.com

--- Test 1: Basic Non-streaming with System Message ---
Test Configuration:
{
  "model": "gpt-4o",
  "streaming": false,
  "temperature": 0.7,
  "messages": [...]
}

Starting basic non-streaming request...
✅ Test 1 completed successfully!
Total Time: 1234ms
```

## SSL Certificate Handling

When connecting to development servers with self-signed certificates, you have two options:

1. **Set environment variable** (recommended for development):
   ```bash
   NODE_TLS_REJECT_UNAUTHORIZED=0 npm test
   ```

2. **Add to .env file** (for persistent development setup):
   ```bash
   NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

⚠️ **WARNING**: Never use `NODE_TLS_REJECT_UNAUTHORIZED=0` in production! This disables SSL certificate verification and poses significant security risks.

## Troubleshooting

If tests fail, check:

1. **Environment Variables** - Ensure `GATEWAY_TRANSFORM_BASE_URL` and `LLM_AUTH_CONSUMER_ID` are set
2. **Network Access** - Verify you can reach the gateway URL
3. **Authentication** - Check if your consumer ID is valid
4. **SSL Certificates** - For self-signed certificates, see SSL Certificate Handling section above

## Running with Echo Server

To test without a real gateway, use an echo server:

```bash
# Start echo server
docker run -p 9030:8080 mendhak/http-https-echo

# Set environment variable
GATEWAY_TRANSFORM_BASE_URL=http://localhost:9030

# Run tests
npm test
```

The echo server will return your request as the response, allowing you to verify the request format is correct.