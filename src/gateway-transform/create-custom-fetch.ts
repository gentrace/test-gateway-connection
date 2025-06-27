import { FetchFunction } from "@ai-sdk/provider-utils";
import * as https from "https";
import nodeFetch from "node-fetch";

/**
 * Creates a custom fetch function that ignores SSL certificate errors.
 * WARNING: This should only be used in development/testing environments.
 * Never use this in production as it poses significant security risks.
 */
export function createCustomFetch(): FetchFunction {
  console.log("[CreateCustomFetch] Function: createCustomFetch");
  console.log("[CreateCustomFetch] Creating custom fetch with SSL bypass...");
  console.log("[CreateCustomFetch] Timestamp:", new Date().toISOString());
  console.warn(
    "[CreateCustomFetch] WARNING: SSL certificate verification is disabled!"
  );
  console.warn(
    "[CreateCustomFetch] This should only be used in development/testing environments."
  );
  console.warn("[CreateCustomFetch] NODE_ENV:", process.env.NODE_ENV);

  let agent;
  try {
    agent = new https.Agent({
      rejectUnauthorized: false,
    });
    console.log("[CreateCustomFetch] HTTPS agent created successfully");
  } catch (agentError) {
    console.error("[CreateCustomFetch] ERROR creating HTTPS agent:", {
      errorType: agentError?.constructor?.name,
      errorMessage: agentError?.message,
      errorStack: agentError?.stack,
      timestamp: new Date().toISOString(),
    });
    throw agentError;
  }

  return async (url, options) => {
    console.log("[CreateCustomFetch] Fetch called");
    console.log("[CreateCustomFetch] URL:", url.toString());
    console.log(
      "[CreateCustomFetch] Request method:",
      options?.method || "GET"
    );
    console.log("[CreateCustomFetch] Request headers:", options?.headers);

    if (options?.body) {
      console.log("[CreateCustomFetch] Request has body");
      console.log("[CreateCustomFetch] Body type:", typeof options.body);
      if (typeof options.body === "string") {
        console.log(
          "[CreateCustomFetch] Body preview:",
          options.body.substring(0, 200) + "..."
        );
      }
    }

    const isHttps = url.toString().startsWith("https");
    console.log("[CreateCustomFetch] Protocol:", isHttps ? "HTTPS" : "HTTP");
    console.log("[CreateCustomFetch] Using custom agent:", isHttps);

    try {
      console.log("[CreateCustomFetch] Initiating fetch request...");
      const startTime = Date.now();

      // @ts-ignore - node-fetch types don't perfectly align with standard fetch
      const response = (await nodeFetch(url, {
        ...options,
        agent: isHttps ? agent : undefined,
      })) as unknown as Response;

      const endTime = Date.now();
      console.log("[CreateCustomFetch] Fetch completed successfully");
      console.log(
        "[CreateCustomFetch] Response time:",
        endTime - startTime,
        "ms"
      );
      console.log("[CreateCustomFetch] Response status:", response.status);
      console.log(
        "[CreateCustomFetch] Response status text:",
        response.statusText
      );
      console.log("[CreateCustomFetch] Response headers:", response.headers);

      // Log response body for error responses
      if (response.status >= 400) {
        console.log("[CreateCustomFetch] Error response detected, attempting to read body...");
        try {
          // Clone the response so we can read it without consuming it
          const clonedResponse = response.clone();
          const responseText = await clonedResponse.text();
          console.log("[CreateCustomFetch] Error response body (raw):", responseText);
          
          // Try to parse as JSON
          try {
            const responseJson = JSON.parse(responseText);
            console.log("[CreateCustomFetch] Error response body (JSON):", JSON.stringify(responseJson, null, 2));
          } catch (jsonError) {
            console.log("[CreateCustomFetch] Response body is not valid JSON");
          }
        } catch (bodyError) {
          console.error("[CreateCustomFetch] Failed to read error response body:", bodyError?.message);
        }
      }

      return response;
    } catch (fetchError) {
      console.error("[CreateCustomFetch] ERROR during fetch:", {
        errorType: fetchError?.constructor?.name,
        errorMessage: fetchError?.message,
        errorStack: fetchError?.stack,
        url: url.toString(),
        method: options?.method || "GET",
        timestamp: new Date().toISOString(),
      });
      console.error("[CreateCustomFetch] Possible causes:");
      console.error("[CreateCustomFetch]   - Network connectivity issues");
      console.error("[CreateCustomFetch]   - Invalid URL");
      console.error("[CreateCustomFetch]   - Server not responding");
      console.error("[CreateCustomFetch]   - Firewall blocking request");
      throw fetchError;
    }
  };
}
