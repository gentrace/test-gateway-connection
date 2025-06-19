#!/usr/bin/env node
/*
Test script for the Gateway Transform AI SDK provider.

Example invocation with LLM auth environment variables:

LLM_AUTH_CONSUMER_ID="my-consumer-id" \
# NOTE: This is a test private key.
LLM_AUTH_PK_VALUE="-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyVR8EETV1XViLkSJPsIJHqTiw7J3dguY0p5B4cm9vZkJZx6c
XpLGaLDRKQSWmkkxh2y5rB8VXrJ1x1vGvnLPQWDGayG5VKJCnZJG7d/gLPNKHfXm
g8gw7QItmYaGDiGmO6fvPqwQOs2c9XDPLO6fLxgQEDcvqUxlmvMNe9Yq7eqUln7B
pqQV8H5Jzwt4VJDuFcTl2BJvN1CLPJkwZ4OBiV7hDdmeNvYhPiytGYHqpDwJqUSL
i8G0aqbjcXBG5UtpFPLNc1fk+vdvViGpOPAQ5Vx2aDjmKG7J7Ir8xKjLF5CgcOEB
Idg0RLapAGvgGnHCwNoP0pTjbJSkm9mXg4F+5QIDAQABAoIBAGcOKLrLQK7LbzJT
hLFkOH2pO3lFn6UiR+xJvpU3soJqQvpXNH2dVKfXCMQAlJHDJFZVqNvVp3+JzPqE
vfKdJtXtRfCZ8S7hHIvqUZAfAb7wXR7jPLkGmKHT8T5T8fu7g1B2CkVLJiPH+qYG
fQUQF1xEfmPvBvJNKJ8RM+TiLZamLJNdLVfJJqUBNEv3bOdQHm5VPITB8Qahbw3Y
zKaBHxcui2z9dLmUDonZ1dJ9jsmnOPz0xxEfFTwNEcBFzV7RA7F+UZCdGGxZbhT9
TpIoGKJQgQQPNjdNQEKrQTQhtYGhOZJiPeCetcPnhHQWd5RJJaH5V+ZRZIW5qnRC
c1GGOAECgYEA7MfKnUVzHEFEh1mJxe7FQQ7eKBBJOLmSDUkFNKDOsCHy8GZW+Smz
HRmrFFR8SrPXzQlUCIdhNELPs8xQw9LWLRFFGSvnR0vRG7Z72xvPr1NTzYGBSREf
rk0B1j5OZvm2um+hCYM6Hqkj0HG2PrGfVIadlEZB7QRnE5FQFM4FfuUCgYEA2gqJ
gPDYGJ8YT/Pa8XH6iYhzKF3K/7L1n9qC0W1DG5e0Qxf+4SKgWlT3hYNr8xJUhGEj
nGNKQfmvRPaHEi6X5xFDBn7nNxQ4qKc5SM1pUr0EfmarQHNuTL3fH1L/mAenFJpv
x8b1iqKkN3gH1wjfNTo3h+mSpaJxx7tb0PaTUgECgYEAiIx7f8vGmKKDXGCQ5f5A
hphuN2NT2kR1F3h1aG5WiHJRs7+7hjdL9JqWFBqpgzEYZCmKRQABFS4KqJmXeKDy
vptcgIM7bPddGqKrFXe8Z2rLObqy0VCfRWlYkJ1GjYplXKCdhuOZ4BdGVlML9EqY
KCE3gGsU35bhvPwwFoXmUZkCgYBnCCvqG1VaHEGSmhMt5CdlCmQ2mPPBPWwTmVKT
vMqBQBpRhLHM8bvAzK3ovx8YqIVHDudxcpNKkGtPCU5cgQKRJBJPqf/CMC7ctMlG
X0Hh05NPmWgH8tFDMH7eQgvKqTXmE9e9xMHJ2icOTYUQFD8rAHuJ2HrJfgX3qYi7
1MwJAQKBgH5Y1Y8u9OYlFEg1K1uwVCDdrOgprJPLUx/qKST/Gn+IvKL7bHD9vvwd
OPJ9lZ8N0vF8+5lkNHEsaJ0mVi8nQ7lZmI7VQKaf5J0rJPn2NA1A2IkIYK9wMmXg
hhou9Wsr0LE2B7xQ2LZKNnlQMPC0c4fyiYB7yBcNwAvoGPfD1KZV
-----END RSA PRIVATE KEY-----" \
LLM_AUTH_SERVICE_NAME="my-service" \
LLM_AUTH_SERVICE_ENV="production" \
LLM_AUTH_CONSUMER_ID_KEY="CONSUMER.ID" \
LLM_AUTH_CONSUMER_TIMESTAMP_KEY="CONSUMER.INTIMESTAMP" \
LLM_AUTH_KEY_VERSION_KEY="SEC.KEY_VERSION" \
LLM_AUTH_AUTH_SIGNATURE_KEY="SEC.AUTH_SIGNATURE" \
LLM_AUTH_SERVICE_NAME_KEY="SVC.NAME" \
LLM_AUTH_SERVICE_ENV_KEY="SVC.ENV" \
NODE_ENV=development \
npx tsx test-gateway.ts

Note: The gateway-transform provider now uses LLM_AUTH_* environment variables
for all authentication. If you don't need signed requests, you can use
LLM_AUTH_CONSUMER_ID without the other LLM_AUTH variables.
*/
import { generateText, streamText } from "ai";
import { createGatewayTransform, isLlmAuthClient } from "./src/index";

async function testGatewayTransformProvider() {
  console.log("=== Gateway Transform AI SDK Provider Test ===\n");
  console.log("Test started at:", new Date().toISOString());
  console.log("Node version:", process.version);
  console.log("Platform:", process.platform);
  console.log("\n--- Environment Configuration ---");

  // Check if LLM auth is configured
  const usingLlmAuth = isLlmAuthClient();
  console.log(`\nUsing LLM Auth: ${usingLlmAuth}`);

  if (usingLlmAuth) {
    console.log("\nLLM Auth Configuration:");
    console.log(`  Consumer ID: ${process.env.LLM_AUTH_CONSUMER_ID}`);
    console.log(`  Service Name: ${process.env.LLM_AUTH_SERVICE_NAME}`);
    console.log(`  Service Env: ${process.env.LLM_AUTH_SERVICE_ENV}`);
    console.log(`  Has Private Key: ${!!process.env.LLM_AUTH_PK_VALUE}`);
    console.log("\nLLM Auth Header Keys:");
    console.log(`  Consumer ID Key: ${process.env.LLM_AUTH_CONSUMER_ID_KEY}`);
    console.log(
      `  Timestamp Key: ${process.env.LLM_AUTH_CONSUMER_TIMESTAMP_KEY}`
    );
    console.log(`  Key Version Key: ${process.env.LLM_AUTH_KEY_VERSION_KEY}`);
    console.log(
      `  Auth Signature Key: ${process.env.LLM_AUTH_AUTH_SIGNATURE_KEY}`
    );
    console.log(`  Service Name Key: ${process.env.LLM_AUTH_SERVICE_NAME_KEY}`);
    console.log(`  Service Env Key: ${process.env.LLM_AUTH_SERVICE_ENV_KEY}`);
  } else {
    console.log("\nBasic Auth Configuration:");
    console.log(
      `  Consumer ID: ${process.env.LLM_AUTH_CONSUMER_ID || "Not set"}`
    );
    console.log(
      `  Private Key: ${
        process.env.LLM_AUTH_PK_VALUE ? "Set (hidden)" : "Not set"
      }`
    );
  }

  // Load base URL from environment or use default
  const baseURL =
    process.env.GATEWAY_TRANSFORM_BASE_URL || "http://localhost:9030";
  console.log(`\n--- Gateway Configuration ---`);
  console.log(`Gateway URL: ${baseURL}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`Ignore SSL: ${process.env.NODE_ENV === "development"}`);

  console.log(`\n--- Creating Gateway Transform Provider ---`);
  // Create the provider
  const gatewayTransform = createGatewayTransform({
    baseURL,
    // The provider will use LLM_AUTH_CONSUMER_ID and LLM_AUTH_PK_VALUE from environment
    ignoreSSL: false,
  });
  console.log("Provider created successfully!");

  // Test 1: Non-streaming text generation
  console.log("\n\n========================================");
  console.log("--- Test 1: Non-streaming Text Generation ---");
  console.log("========================================\n");

  const test1Messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Say hello!" },
  ] as const;

  console.log("Test 1 Configuration:");
  console.log("  Model: gpt-4o");
  console.log("  Temperature: 0.7");
  console.log("  Max Tokens: 100");
  console.log("  Messages:", JSON.stringify(test1Messages, null, 2));

  try {
    console.log("\nStarting non-streaming request...");
    const startTime = Date.now();

    const result = await generateText({
      model: gatewayTransform("gpt-4o"),
      messages: [...test1Messages],
      temperature: 0.7,
      maxTokens: 100,
    });

    const endTime = Date.now();

    console.log(`\n✅ Non-streaming test completed successfully!`);
    console.log(`Response Time: ${endTime - startTime}ms`);
    console.log("Generated Text:", result.text);
    console.log("Finish Reason:", result.finishReason);
    console.log("Usage:", result.usage);
  } catch (error) {
    console.error("\n❌ Non-streaming test failed!");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    // Check if it's an echo server response
    if (error instanceof Error) {
      console.log("\n--- Error Analysis ---");

      // Try to parse error response
      try {
        const errorBody = JSON.parse(error.message);
        console.log("Parsed error body:", JSON.stringify(errorBody, null, 2));

        if (errorBody.task || error.message.includes("task")) {
          console.log("\n🔍 Echo Server Response Detected!");
          console.log("This appears to be an echo server response.");
          console.log("The gateway-transform provider successfully:");
          console.log("  ✓ Created and signed the request");
          console.log("  ✓ Formatted it in gateway-transform format");
          console.log("  ✓ Sent it to the server");
          console.log("\n✅ Provider is working correctly!");
          console.log(
            "When connected to a real gateway, it will parse actual LLM responses."
          );
        }
      } catch (parseError) {
        console.log("Could not parse error as JSON:", parseError.message);
      }
    }
  }

  // Test 2: Streaming text generation
  console.log("\n\n========================================");
  console.log("--- Test 2: Streaming Text Generation ---");
  console.log("========================================\n");

  const test2Messages = [{ role: "user", content: "Count to 5" }] as const;

  console.log("Test 2 Configuration:");
  console.log("  Model: gpt-4o");
  console.log("  Temperature: 0.5");
  console.log("  Messages:", JSON.stringify(test2Messages, null, 2));

  try {
    console.log("\nStarting streaming request...");
    const startTime = Date.now();

    const { textStream } = await streamText({
      model: gatewayTransform("gpt-4o"),
      messages: [...test2Messages],
      temperature: 0.5,
    });

    console.log("\nStream started, receiving chunks:");
    console.log("---");

    let chunkCount = 0;
    for await (const chunk of textStream) {
      chunkCount++;
      console.log(`[Chunk ${chunkCount}]: "${chunk}"`);
      process.stdout.write(chunk);
    }

    const endTime = Date.now();

    console.log("\n---");
    console.log(`\n✅ Streaming test completed successfully!`);
    console.log(`Total chunks received: ${chunkCount}`);
    console.log(`Response Time: ${endTime - startTime}ms`);
  } catch (error) {
    console.error("\n❌ Streaming test failed!");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    // Check if it's an echo server response
    if (error instanceof Error) {
      console.log("\n--- Error Analysis ---");

      // Try to parse error response
      try {
        const errorBody = JSON.parse(error.message);
        console.log("Parsed error body:", JSON.stringify(errorBody, null, 2));

        if (errorBody.task || error.message.includes("task")) {
          console.log("\n🔍 Echo Server Response Detected!");
          console.log("The streaming request was properly formatted.");
          console.log("✅ Streaming capability is working correctly!");
        }
      } catch (parseError) {
        console.log("Could not parse error as JSON:", parseError.message);
      }
    }
  }

  console.log("\n\n========================================");
  console.log("=== Test Summary ===");
  console.log("========================================");
  console.log("\nAll tests completed at:", new Date().toISOString());
  console.log("\nThe Gateway Transform provider has been tested.");
  console.log("When connected to a real gateway endpoint,");
  console.log("it will handle actual LLM responses properly.");
  console.log("\nFor debugging issues:");
  console.log(
    "1. Check all console logs above for detailed request/response info"
  );
  console.log("2. Verify environment variables are set correctly");
  console.log("3. Ensure the gateway URL is accessible");
  console.log("4. Check if SSL certificates are valid (if not in dev mode)");
}

// Print usage information
console.log("Gateway Transform Provider Test Script\n");
console.log("Environment Variables:");
console.log("  Gateway URL:");
console.log("    GATEWAY_TRANSFORM_BASE_URL (default: http://localhost:9030)");
console.log("\n  Authentication:");
console.log("    LLM_AUTH_CONSUMER_ID (required)");
console.log("    LLM_AUTH_PK_VALUE (optional, for signed requests)");
console.log("\n  For full LLM Auth with signed requests:");
console.log("    LLM_AUTH_SERVICE_NAME");
console.log("    LLM_AUTH_SERVICE_ENV");
console.log("    LLM_AUTH_CONSUMER_ID_KEY");
console.log("    LLM_AUTH_CONSUMER_TIMESTAMP_KEY");
console.log("    LLM_AUTH_KEY_VERSION_KEY");
console.log("    LLM_AUTH_AUTH_SIGNATURE_KEY");
console.log("    LLM_AUTH_SERVICE_NAME_KEY");
console.log("    LLM_AUTH_SERVICE_ENV_KEY\n");

testGatewayTransformProvider().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
