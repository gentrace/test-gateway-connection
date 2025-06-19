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
  console.log("[SignRequest] Function: signRequest");
  console.log("[SignRequest] Starting request signing...");
  console.log("[SignRequest] Timestamp:", new Date().toISOString());
  console.log("[SignRequest] Input headers:", JSON.stringify(headers, null, 2));
  console.log(
    "[SignRequest] Consumer ID:",
    consumerId?.substring(0, 8) + "..."
  );
  console.log("[SignRequest] Has private key:", !!privateKey);

  try {
    // If LLM auth is configured, use it
    let isLlmAuth = false;
    try {
      isLlmAuth = isLlmAuthClient();
      console.log("[SignRequest] LLM Auth check result:", isLlmAuth);
    } catch (checkError) {
      console.error("[SignRequest] ERROR checking LLM auth client:", {
        errorType: checkError?.constructor?.name,
        errorMessage: checkError?.message,
        errorStack: checkError?.stack,
        timestamp: new Date().toISOString()
      });
      // Continue with basic auth if check fails
      isLlmAuth = false;
    }
    
    if (isLlmAuth) {
      console.log(
        "[SignRequest] LLM Auth client detected, generating auth headers..."
      );
      
      let authHeaders;
      try {
        authHeaders = generateLlmAuthConsumerHeaders();
        console.log(
          "[SignRequest] Generated auth headers:",
          JSON.stringify(authHeaders, null, 2)
        );
      } catch (authError) {
        console.error("[SignRequest] ERROR generating LLM auth headers:", {
          errorType: authError?.constructor?.name,
          errorMessage: authError?.message,
          errorStack: authError?.stack,
          timestamp: new Date().toISOString()
        });
        console.error("[SignRequest] Falling back to basic auth due to error");
        throw authError;
      }

      const signedHeaders = {
        ...headers,
        ...authHeaders,
      };
      console.log(
        "[SignRequest] Final signed headers:",
        JSON.stringify(signedHeaders, null, 2)
      );
      console.log("[SignRequest] Headers successfully signed with LLM auth");
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
      console.log("[SignRequest] Headers signed with basic auth (no private key)");
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
    console.warn("[SignRequest] Check environment variables:", {
      hasPrivateKey: true,
      hasConsumerId: !!consumerId,
      isLlmAuthConfigured: false,
      timestamp: new Date().toISOString()
    });

    const fallbackHeaders = {
      ...headers,
      "CONSUMER.ID": consumerId,
      "Content-Type": "application/json",
    };
    console.log(
      "[SignRequest] Fallback headers:",
      JSON.stringify(fallbackHeaders, null, 2)
    );
    console.log("[SignRequest] Headers signed with fallback basic auth");
    return fallbackHeaders;
  } catch (error) {
    console.error("[SignRequest] FATAL ERROR in signRequest:", {
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      functionName: "signRequest",
      consumerId: consumerId?.substring(0, 8) + "...",
      hasPrivateKey: !!privateKey,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
