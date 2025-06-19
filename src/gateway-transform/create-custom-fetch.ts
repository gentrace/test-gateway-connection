import { FetchFunction } from "@ai-sdk/provider-utils";
import * as https from "https";
import nodeFetch from "node-fetch";

/**
 * Creates a custom fetch function that ignores SSL certificate errors.
 * WARNING: This should only be used in development/testing environments.
 * Never use this in production as it poses significant security risks.
 */
export function createCustomFetch(): FetchFunction {
  console.log("[CreateCustomFetch] Creating custom fetch with SSL bypass...");
  console.warn(
    "[CreateCustomFetch] WARNING: SSL certificate verification is disabled!"
  );
  console.warn(
    "[CreateCustomFetch] This should only be used in development/testing environments."
  );

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  return async (url, options) => {
    console.log("[CreateCustomFetch] Fetching URL:", url.toString());
    console.log(
      "[CreateCustomFetch] Request method:",
      options?.method || "GET"
    );
    console.log("[CreateCustomFetch] Request headers:", options?.headers);

    const isHttps = url.toString().startsWith("https");
    console.log("[CreateCustomFetch] Is HTTPS:", isHttps);
    console.log("[CreateCustomFetch] Using custom agent:", isHttps);

    // @ts-ignore - node-fetch types don't perfectly align with standard fetch
    return nodeFetch(url, {
      ...options,
      agent: isHttps ? agent : undefined,
    }) as unknown as Promise<Response>;
  };
}
