# Gateway Transform Test Package

This is a standalone package for testing and debugging the Gateway Transform AI SDK provider. It includes extensive console logging to help diagnose connection and authentication issues.

## Overview

The Gateway Transform provider is a custom AI SDK provider that:

- Transforms requests to a specific gateway format
- Supports two authentication modes: LLM Auth and Basic Auth
- Handles both streaming and non-streaming responses
- Includes request signing with RSA signatures (for LLM Auth mode)

## Installation

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

## Configuration

### 1. Copy Environment Variables

```bash
cp .env.example .env
```

### 2. Configure Authentication

You can use either **LLM Auth Mode** or **Basic Auth Mode**.

#### LLM Auth Mode (Recommended for Production)

Set ALL of the following environment variables in your `.env` file:

```bash
# Gateway URL
GATEWAY_TRANSFORM_BASE_URL=https://your-gateway-url.com

# LLM Auth Configuration
LLM_AUTH_CONSUMER_ID=your-consumer-id
LLM_AUTH_PK_VALUE="-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END RSA PRIVATE KEY-----"
LLM_AUTH_SERVICE_NAME=your-service-name
LLM_AUTH_SERVICE_ENV=prod

# Header Key Names (customize based on your gateway)
LLM_AUTH_CONSUMER_ID_KEY=CONSUMER.ID
LLM_AUTH_CONSUMER_TIMESTAMP_KEY=CONSUMER.INTIMESTAMP
LLM_AUTH_KEY_VERSION_KEY=SEC.KEY_VERSION
LLM_AUTH_AUTH_SIGNATURE_KEY=SEC.AUTH_SIGNATURE
LLM_AUTH_SERVICE_NAME_KEY=SVC.NAME
LLM_AUTH_SERVICE_ENV_KEY=SVC.ENV

# Development mode (to bypass SSL verification)
NODE_ENV=development
```

#### Basic Auth Mode (Fallback)

If you don't have all LLM auth variables, the provider will fall back to basic auth:

```bash
# Gateway URL
GATEWAY_TRANSFORM_BASE_URL=https://your-gateway-url.com

# Basic Auth (uses LLM_AUTH_CONSUMER_ID without the other LLM auth variables)
LLM_AUTH_CONSUMER_ID=your-basic-consumer-id

# Development mode
NODE_ENV=development
```

## Running Tests

### Using npm/yarn scripts:

```bash
# Run the test
npm test

# Or with yarn
yarn test

# Run in watch mode for development
npm run dev
```

### Direct execution:

```bash
# With environment variables from .env file
npx tsx test-gateway.ts

# With inline environment variables
GATEWAY_TRANSFORM_BASE_URL=https://your-gateway.com \
LLM_AUTH_CONSUMER_ID=your-id \
NODE_ENV=development \
npx tsx test-gateway.ts
```

## Test Output

The test script will:

1. **Display configuration** - Shows which auth mode is being used and all relevant settings
2. **Run non-streaming test** - Makes a simple chat completion request
3. **Run streaming test** - Makes a streaming chat completion request
4. **Show detailed logs** - Every step is logged with prefixed tags for easy debugging

### Expected Output Structure

```
=== Gateway Transform AI SDK Provider Test ===

Test started at: 2024-01-15T10:30:00.000Z
Node version: v20.11.0
Platform: darwin

--- Environment Configuration ---
Using LLM Auth: true

LLM Auth Configuration:
  Consumer ID: abc123...
  Service Name: my-service
  ...

--- Test 1: Non-streaming Text Generation ---
[GatewayTransformProvider] Creating chat model...
[SignRequest] Starting request signing...
[LLMAuth] Generating LLM auth consumer headers...
...

✅ Non-streaming test completed successfully!
Response Time: 1234ms
Generated Text: Hello! How can I help you today?

--- Test 2: Streaming Text Generation ---
...
```

## Debugging

### Console Log Tags

Each component logs with a specific tag to help track the flow:

- `[GatewayTransformProvider]` - Provider initialization and configuration
- `[GatewayTransformChatLanguageModel]` - Model operations and API calls
- `[SignRequest]` - Request signing logic
- `[LLMAuth]` - LLM authentication details
- `[ConvertMessages]` - Message format conversion
- `[CreateCustomFetch]` - HTTP client operations
- `[MapFinishReason]` - Response mapping

### Common Issues

1. **Missing Environment Variables**

   - Check the `[LLMAuth] Environment check:` section in logs
   - All LLM auth variables must be set for LLM auth mode

2. **SSL Certificate Errors**

   - Set `NODE_ENV=development` to bypass SSL verification
   - Look for `[CreateCustomFetch]` logs

3. **Authentication Failures**

   - Check `[SignRequest]` and `[LLMAuth]` logs for header generation
   - Verify private key format (must be PEM format)

4. **Request Format Issues**
   - Check `[ConvertMessages]` logs for message conversion
   - Look at `[GatewayTransformChatLanguageModel] Final request body:` for the exact request

## Echo Server Testing

For initial testing without a real gateway, you can use an echo server:

```bash
# Start echo server
docker run -p 9030:8080 mendhak/http-https-echo

# Run tests against echo server
GATEWAY_TRANSFORM_BASE_URL=http://localhost:9030 npm test
```

The echo server will return the request as the response, allowing you to verify:

- Request format is correct
- Headers are properly signed
- Authentication is working

## Request Format

The gateway expects requests in this format:

```json
{
  "model": "gpt-4",
  "task": "chat/completions",
  "model-params": {
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Hello!" }
    ],
    "temperature": 0.7,
    "max_tokens": 100,
    "stream": false
  }
}
```

## Troubleshooting

1. **Enable all logs**: The package already has extensive logging enabled
2. **Check request/response**: Look for `Request body:` and `Response:` in logs
3. **Verify headers**: Check `Combined headers:` in logs to see all headers sent
4. **Test with curl**: Use the logged request details to test with curl directly

## Support

For issues specific to the Gateway Transform implementation, check:

- The console logs for detailed error information
- Environment variable configuration
- Network connectivity to the gateway URL
- Authentication credentials and format
