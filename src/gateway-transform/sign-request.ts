import {
  generateLlmAuthConsumerHeaders,
  isLlmAuthClient,
  loadLlmAuthConfig,
} from "./llm-auth";

/**
 * Signs the request headers for Gateway Transform authentication.
 * Uses LLM auth configuration if available, otherwise falls back to basic auth.
 */
export function signRequest(
  headers: Record<string, string | undefined>,
  consumerId: string,
  privateKey?: string
): Record<string, string | undefined> {
  console.log("[SignRequest] Starting request signing...");
  console.log("[SignRequest] Input headers:", JSON.stringify(headers, null, 2));
  console.log(
    "[SignRequest] Consumer ID:",
    consumerId?.substring(0, 8) + "..."
  );
  console.log("[SignRequest] Has private key:", !!privateKey);

  // If LLM auth is configured, use it
  if (isLlmAuthClient()) {
    console.log(
      "[SignRequest] LLM Auth client detected, generating auth headers..."
    );
    const authHeaders = generateLlmAuthConsumerHeaders();
    console.log(
      "[SignRequest] Generated auth headers:",
      JSON.stringify(authHeaders, null, 2)
    );

    const signedHeaders = {
      ...headers,
      ...authHeaders,
    };
    console.log(
      "[SignRequest] Final signed headers:",
      JSON.stringify(signedHeaders, null, 2)
    );
    return signedHeaders;
  }

  // Otherwise, use the fallback basic auth with hardcoded header names
  // This is for cases where gateway-transform is used without full LLM auth setup
  console.log(
    "[SignRequest] LLM Auth not configured, falling back to basic auth..."
  );

  if (!privateKey) {
    console.log(
      "[SignRequest] No private key provided, using basic auth with consumer ID only"
    );
    // If no private key is provided, just use basic auth with consumer ID
    const basicHeaders = {
      ...headers,
      "CONSUMER.ID": consumerId,
      "Content-Type": "application/json",
    };
    console.log(
      "[SignRequest] Basic auth headers:",
      JSON.stringify(basicHeaders, null, 2)
    );
    return basicHeaders;
  }

  // If private key is provided but LLM auth is not fully configured,
  // we can't sign the request properly
  console.warn(
    "[SignRequest] WARNING: Private key provided but LLM auth is not fully configured. Using basic auth."
  );
  console.warn(
    "[SignRequest] This may indicate missing LLM auth environment variables"
  );

  const fallbackHeaders = {
    ...headers,
    "CONSUMER.ID": consumerId,
    "Content-Type": "application/json",
  };
  console.log(
    "[SignRequest] Fallback headers:",
    JSON.stringify(fallbackHeaders, null, 2)
  );
  return fallbackHeaders;
}
