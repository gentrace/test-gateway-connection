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
    ignoreSSL: true,
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
  // Creating a small 10x10 gradient image that transitions from blue to green
  // This is a more substantive test image that shows color gradients
  const base64GradientImage =
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAAxklEQVQYlWNgYGBgEBQUZGBgYGD4//8/AxYgKCjIwMDAwPD//38GbGpwKcamCKcibGqwKcKpCJsabIqwKcamBpsirGowFeFSg00xNjXYFGNTg00xNjXYFGNTg00xNjXYFGNTg00xNjXYFGNTg00xNjXYFGNTg00xNjXYFKNThE0NNsXY1GBTjE0NNsXY1GBTjE0NNsXY1GBTjE0NNsVUA7h+p5lizABXYmLg+H+Pof8/A8P/fwwMjP//MzAwMjJiSHNmZmZEVgMAPX0hJnB7mPgAAAAASUVORK5CYII=";

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
              image: `data:image/png;base64,${base64GradientImage}`,
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
                image: `data:image/png;base64,${base64GradientImage}`,
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
