import { FetchFunction } from "@ai-sdk/provider-utils";

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

  // Node.js 18+ has undici-based fetch that doesn't support custom agents
  // We need to use a different approach for SSL bypass
  const nodeVersion = process.version;
  console.log("[CreateCustomFetch] Node.js version:", nodeVersion);

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

    try {
      console.log("[CreateCustomFetch] Initiating fetch request...");
      const startTime = Date.now();

      // For Node.js 18+, we need to handle SSL differently
      // The native fetch doesn't support custom agents directly
      let response: Response;
      
      if (isHttps) {
        // Warning: This disables SSL verification globally for this request
        // This is a security risk and should only be used in development
        const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        
        try {
          response = await fetch(url, options);
        } finally {
          // Restore original setting
          if (originalRejectUnauthorized === undefined) {
            delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          } else {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
          }
        }
      } else {
        response = await fetch(url, options);
      }

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
          console.error("[CreateCustomFetch] Failed to read error response body:", (bodyError as Error)?.message);
        }
      }

      return response;
    } catch (fetchError) {
      console.error("[CreateCustomFetch] ERROR during fetch:", {
        errorType: (fetchError as Error)?.constructor?.name,
        errorMessage: (fetchError as Error)?.message,
        errorStack: (fetchError as Error)?.stack,
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
