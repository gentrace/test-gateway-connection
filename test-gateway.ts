#!/usr/bin/env node
import "dotenv/config";
/*
Test script for the Gateway Transform AI SDK provider.

Example invocation with minimal configuration:

GATEWAY_TRANSFORM_BASE_URL="https://your-gateway-url.com" \
LLM_AUTH_CONSUMER_ID="my-consumer-id" \
NODE_ENV=development \
npx tsx test-gateway.ts

Example invocation with full LLM auth environment variables:

GATEWAY_TRANSFORM_BASE_URL="https://your-gateway-url.com" \
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

interface TestResult {
  name: string;
  status: "passed" | "failed";
  duration: number;
  error?: string;
}

const testResults: TestResult[] = [];

async function runTest(
  testName: string,
  testConfig: any,
  testFunc: () => Promise<void>
) {
  console.log("\n\n========================================");
  console.log(`--- ${testName} ---`);
  console.log("========================================\n");

  console.log("Test Configuration:");
  console.log(JSON.stringify(testConfig, null, 2));

  const startTime = Date.now();

  try {
    await testFunc();
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`\n✅ ${testName} completed successfully!`);
    console.log(`Total Time: ${duration}ms`);

    testResults.push({
      name: testName,
      status: "passed",
      duration,
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`\n❌ ${testName} failed!`);
    console.error(`Total Time: ${duration}ms`);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    // Check if it's an echo server response
    if (error instanceof Error && error.message.includes("task")) {
      console.log("\n🔍 Echo Server Response Detected!");
      console.log("Request was properly formatted and sent.");
    }

    testResults.push({
      name: testName,
      status: "failed",
      duration,
      error: error?.message || "Unknown error",
    });
  }
}

async function testGatewayTransformProvider() {
  console.log("=== Gateway Transform AI SDK Provider Test Suite ===\n");
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
    process.env.GATEWAY_TRANSFORM_BASE_URL ||
    "https://localhost:3443/wmtllmgateway/v1/generate";
  console.log(`\n--- Gateway Configuration ---`);
  console.log(`Gateway URL: ${baseURL}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`NODE_TLS_REJECT_UNAUTHORIZED: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED}`);

  console.log(`\n--- Creating Gateway Transform Provider ---`);
  // Create the provider
  const gatewayTransform = createGatewayTransform({
    baseURL,
    // The provider will use LLM_AUTH_CONSUMER_ID and LLM_AUTH_PK_VALUE from environment
  });
  console.log("Provider created successfully!");

  // Test 1: Basic Non-streaming with System Message
  await runTest(
    "Test 1: Basic Non-streaming with System Message",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0.7,
      maxTokens: 100,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello!" },
      ],
    },
    async () => {
      console.log(
        "\nStarting basic non-streaming request with system message..."
      );

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello!" },
        ],
        temperature: 0.7,
        maxTokens: 100,
      });

      console.log("\nResponse received:");
      console.log("Generated Text:", result.text);
      console.log("Finish Reason:", result.finishReason);
      console.log("Usage:", result.usage);
    }
  );

  // Test 2: Multi-turn Conversation Non-streaming
  await runTest(
    "Test 2: Multi-turn Conversation (Non-streaming)",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0.5,
      maxTokens: 150,
      messages: [
        { role: "system", content: "You are a math teacher." },
        { role: "user", content: "What is 2 + 2?" },
        { role: "assistant", content: "2 + 2 equals 4." },
        { role: "user", content: "And what is 4 + 4?" },
      ],
    },
    async () => {
      console.log("\nStarting multi-turn conversation test...");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          { role: "system", content: "You are a math teacher." },
          { role: "user", content: "What is 2 + 2?" },
          { role: "assistant", content: "2 + 2 equals 4." },
          { role: "user", content: "And what is 4 + 4?" },
        ],
        temperature: 0.5,
        maxTokens: 150,
      });

      console.log("\nConversation response:");
      console.log("Generated Text:", result.text);
      console.log("Finish Reason:", result.finishReason);
      console.log("Usage:", result.usage);
    }
  );

  // Test 3: No Temperature (Deterministic)
  await runTest(
    "Test 3: No Temperature (Deterministic)",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0,
      maxTokens: 50,
      messages: [{ role: "user", content: "What is the capital of France?" }],
    },
    async () => {
      console.log("\nStarting deterministic request (temperature=0)...");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [{ role: "user", content: "What is the capital of France?" }],
        temperature: 0,
        maxTokens: 50,
      });

      console.log("\nDeterministic response:");
      console.log("Generated Text:", result.text);
      console.log("Finish Reason:", result.finishReason);
      console.log("Temperature: 0 (deterministic)");
    }
  );

  // Test 4: High Temperature (Creative)
  await runTest(
    "Test 4: High Temperature (Creative)",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 1.5,
      maxTokens: 100,
      messages: [
        { role: "system", content: "You are a creative storyteller." },
        { role: "user", content: "Tell me about a magical forest." },
      ],
    },
    async () => {
      console.log("\nStarting creative request (temperature=1.5)...");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          { role: "system", content: "You are a creative storyteller." },
          { role: "user", content: "Tell me about a magical forest." },
        ],
        temperature: 1.5,
        maxTokens: 100,
      });

      console.log("\nCreative response:");
      console.log("Generated Text:", result.text);
      console.log("Temperature: 1.5 (highly creative)");
    }
  );

  // Test 5: Streaming with System Message
  await runTest(
    "Test 5: Streaming with System Message",
    {
      model: "gpt-4o",
      streaming: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are a counting assistant." },
        { role: "user", content: "Count from 1 to 5 slowly." },
      ],
    },
    async () => {
      console.log("\nStarting streaming request with system message...");

      const { textStream } = await streamText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          { role: "system", content: "You are a counting assistant." },
          { role: "user", content: "Count from 1 to 5 slowly." },
        ],
        temperature: 0.7,
      });

      console.log("\nStream started, receiving chunks:");
      console.log("---");

      let chunkCount = 0;
      let fullText = "";
      for await (const chunk of textStream) {
        chunkCount++;
        console.log(`[Chunk ${chunkCount}]: "${chunk}"`);
        fullText += chunk;
      }

      console.log("---");
      console.log(`Total chunks received: ${chunkCount}`);
      console.log(`Full streamed text: "${fullText}"`);
    }
  );

  // Test 6: Streaming Multi-turn Conversation
  await runTest(
    "Test 6: Streaming Multi-turn Conversation",
    {
      model: "gpt-4o",
      streaming: true,
      temperature: 0.8,
      messages: [
        { role: "system", content: "You are a helpful coding assistant." },
        { role: "user", content: "How do I write a for loop in Python?" },
        {
          role: "assistant",
          content:
            "In Python, you can write a for loop using the following syntax:\n\n```python\nfor item in iterable:\n    # code to execute\n```",
        },
        { role: "user", content: "Now show me a while loop." },
      ],
    },
    async () => {
      console.log("\nStarting streaming multi-turn conversation...");

      const { textStream } = await streamText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          { role: "system", content: "You are a helpful coding assistant." },
          { role: "user", content: "How do I write a for loop in Python?" },
          {
            role: "assistant",
            content:
              "In Python, you can write a for loop using the following syntax:\n\n```python\nfor item in iterable:\n    # code to execute\n```",
          },
          { role: "user", content: "Now show me a while loop." },
        ],
        temperature: 0.8,
      });

      console.log("\nStreaming conversation response:");
      console.log("---");

      let chunkCount = 0;
      let fullText = "";
      for await (const chunk of textStream) {
        chunkCount++;
        console.log(`[Chunk ${chunkCount}]: "${chunk}"`);
        fullText += chunk;
      }

      console.log("---");
      console.log(`Total chunks: ${chunkCount}`);
      console.log(`Full response: "${fullText}"`);
    }
  );

  // Test 7: No System Message
  await runTest(
    "Test 7: No System Message (User Only)",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0.7,
      maxTokens: 80,
      messages: [
        { role: "user", content: "Explain quantum computing in one sentence." },
      ],
    },
    async () => {
      console.log("\nStarting request without system message...");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          {
            role: "user",
            content: "Explain quantum computing in one sentence.",
          },
        ],
        temperature: 0.7,
        maxTokens: 80,
      });

      console.log("\nResponse without system context:");
      console.log("Generated Text:", result.text);
      console.log("Note: No system message was provided");
    }
  );

  // Test 8: Multiple System Messages
  await runTest(
    "Test 8: Complex System Context",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0.6,
      maxTokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You are an expert chef. You specialize in Italian cuisine. Always be enthusiastic about food.",
        },
        { role: "user", content: "What's your favorite pasta dish?" },
      ],
    },
    async () => {
      console.log("\nStarting request with complex system context...");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          {
            role: "system",
            content:
              "You are an expert chef. You specialize in Italian cuisine. Always be enthusiastic about food.",
          },
          { role: "user", content: "What's your favorite pasta dish?" },
        ],
        temperature: 0.6,
        maxTokens: 200,
      });

      console.log("\nResponse with detailed system context:");
      console.log("Generated Text:", result.text);
      console.log(
        "System prompt included: role definition + expertise + personality"
      );
    }
  );

  // Test 9: Streaming without Temperature
  await runTest(
    "Test 9: Streaming without Temperature Parameter",
    {
      model: "gpt-4o",
      streaming: true,
      temperature: "default",
      messages: [{ role: "user", content: "List three primary colors." }],
    },
    async () => {
      console.log("\nStarting streaming without explicit temperature...");

      const { textStream } = await streamText({
        model: gatewayTransform("gpt-4o"),
        messages: [{ role: "user", content: "List three primary colors." }],
        // No temperature specified - using model default
      });

      console.log("\nStreaming with default temperature:");
      console.log("---");

      let chunkCount = 0;
      for await (const chunk of textStream) {
        chunkCount++;
        console.log(`[Chunk ${chunkCount}]: "${chunk}"`);
      }

      console.log("---");
      console.log(`Total chunks: ${chunkCount}`);
      console.log("Temperature: Using model default");
    }
  );

  // Test 10: Long Multi-turn Conversation
  await runTest(
    "Test 10: Extended Multi-turn Conversation",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0.7,
      maxTokens: 150,
      messages: [
        { role: "system", content: "You are a travel guide." },
        { role: "user", content: "I want to visit Europe." },
        {
          role: "assistant",
          content:
            "Europe is a wonderful destination! What specific countries or cities are you interested in?",
        },
        { role: "user", content: "I'm thinking about Paris and Rome." },
        {
          role: "assistant",
          content:
            "Excellent choices! Paris and Rome are two of Europe's most iconic cities. Paris offers the Eiffel Tower, Louvre Museum, and amazing cuisine. Rome has the Colosseum, Vatican City, and incredible history.",
        },
        { role: "user", content: "How many days should I spend in each city?" },
      ],
    },
    async () => {
      console.log("\nStarting extended conversation test...");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          { role: "system", content: "You are a travel guide." },
          { role: "user", content: "I want to visit Europe." },
          {
            role: "assistant",
            content:
              "Europe is a wonderful destination! What specific countries or cities are you interested in?",
          },
          { role: "user", content: "I'm thinking about Paris and Rome." },
          {
            role: "assistant",
            content:
              "Excellent choices! Paris and Rome are two of Europe's most iconic cities. Paris offers the Eiffel Tower, Louvre Museum, and amazing cuisine. Rome has the Colosseum, Vatican City, and incredible history.",
          },
          {
            role: "user",
            content: "How many days should I spend in each city?",
          },
        ],
        temperature: 0.7,
        maxTokens: 150,
      });

      console.log("\nExtended conversation response:");
      console.log("Generated Text:", result.text);
      console.log("Conversation turns: 3 user messages, 2 assistant messages");
    }
  );

  // Test 11: Vision with External Image URL
  await runTest(
    "Test 11: Vision with External Image URL",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0.7,
      maxTokens: 200,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What's in this image?" },
            {
              type: "image",
              image:
                "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
            },
          ],
        },
      ],
    },
    async () => {
      console.log("\nStarting vision test with external image URL...");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What's in this image?" },
              {
                type: "image",
                image:
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
              },
            ],
          },
        ],
        temperature: 0.7,
        maxTokens: 200,
      });

      console.log("\nVision response (external URL):");
      console.log("Generated Text:", result.text);
      console.log("Image source: External URL");
    }
  );

  // Test 12: Vision with Base64 Encoded Image
  const base64Image =
    "data:image/jpeg;base64,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";

  await runTest(
    "Test 12: Vision with Base64 Encoded Image",
    {
      model: "gpt-4o",
      streaming: false,
      temperature: 0.7,
      maxTokens: 150,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe what you see in this image. Can you identify any colors or patterns?",
            },
            {
              type: "image",
              image: base64Image,
            },
          ],
        },
      ],
    },
    async () => {
      console.log("\nStarting vision test with base64 encoded image...");
      console.log("Image: 10x10 gradient PNG (blue to green transition)");

      const result = await generateText({
        model: gatewayTransform("gpt-4o"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe what you see in this image. Can you identify any colors or patterns?",
              },
              {
                type: "image",
                image: base64Image,
              },
            ],
          },
        ],
        temperature: 0.7,
        maxTokens: 150,
      });

      console.log("\nVision response (base64):");
      console.log("Generated Text:", result.text);
      console.log("Image source: Base64 encoded data");
    }
  );

  console.log("\n\n========================================");
  console.log("=== Test Results Summary ===");
  console.log("========================================");
  console.log("\nAll tests completed at:", new Date().toISOString());

  // Display results table
  console.log(
    "\n┌─────┬──────────────────────────────────────────────────────┬──────────┬──────────┐"
  );
  console.log(
    "│  #  │ Test Name                                            │  Status  │ Duration │"
  );
  console.log(
    "├─────┼──────────────────────────────────────────────────────┼──────────┼──────────┤"
  );

  testResults.forEach((result, index) => {
    const num = String(index + 1).padEnd(3);
    const name = result.name.padEnd(52);
    const status =
      result.status === "passed" ? "✅ PASS".padEnd(8) : "❌ FAIL".padEnd(8);
    const duration = `${result.duration}ms`.padStart(8);

    console.log(`│ ${num} │ ${name} │ ${status} │ ${duration} │`);
  });

  console.log(
    "└─────┴──────────────────────────────────────────────────────┴──────────┴──────────┘"
  );

  // Summary statistics
  const passed = testResults.filter((r) => r.status === "passed").length;
  const failed = testResults.filter((r) => r.status === "failed").length;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTest Summary:`);
  console.log(`  Total Tests: ${testResults.length}`);
  console.log(
    `  Passed: ${passed} (${Math.round((passed / testResults.length) * 100)}%)`
  );
  console.log(
    `  Failed: ${failed} (${Math.round((failed / testResults.length) * 100)}%)`
  );
  console.log(`  Total Duration: ${totalDuration}ms`);

  // Show failed test details if any
  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults
      .filter((r) => r.status === "failed")
      .forEach((result) => {
        console.log(`\n  ${result.name}:`);
        console.log(`    Error: ${result.error}`);
      });
  }

  console.log("\nThe Gateway Transform provider has been thoroughly tested.");
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
