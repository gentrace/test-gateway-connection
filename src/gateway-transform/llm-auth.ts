import * as crypto from "crypto";

/**
 * [Customer specific] LLM auth consumer authentication headers for API gateway calls.
 * This type is used to generate the same headers required for LLM auth.
 */
export type LlmAuthConsumerHeaders = {
  [key: string]: string;
};

/**
 * [Customer specific] LLM auth configuration loaded from environment variables.
 */
export type LlmAuthConfig = {
  consumerId: string;
  privateKey: string;
  serviceName: string;
  serviceEnv: string;
  consumerIdKey: string;
  timestampKey: string;
  keyVersionKey: string;
  authSignatureKey: string;
  serviceNameKey: string;
  serviceEnvKey: string;
};

/**
 * [Customer specific] Loads and validates LLM auth configuration from environment variables.
 *
 * Environment variables required:
 * - LLM_AUTH_CONSUMER_ID_KEY / LLM_AUTH_CONSUMER_ID: The header name and consumer ID value
 * - LLM_AUTH_CONSUMER_TIMESTAMP_KEY: The header name for timestamp (value is generated)
 * - LLM_AUTH_KEY_VERSION_KEY: The header name for key version (value is '1')
 * - LLM_AUTH_AUTH_SIGNATURE_KEY: The header name for auth signature (value is generated)
 * - LLM_AUTH_SERVICE_NAME_KEY / LLM_AUTH_SERVICE_NAME: The header name and service name value
 * - LLM_AUTH_SERVICE_ENV_KEY / LLM_AUTH_SERVICE_ENV: The header name and service environment value
 * - LLM_AUTH_PK_VALUE: The RSA private key (PEM format) for signing
 *
 * @returns LlmAuthConfig object or null if not fully configured
 */
export function loadLlmAuthConfig(): LlmAuthConfig | null {
  console.log("[LLMAuth] Loading LLM auth configuration from environment...");

  const consumerId = process.env.LLM_AUTH_CONSUMER_ID;
  const privateKey = process.env.LLM_AUTH_PK_VALUE;
  const serviceName = process.env.LLM_AUTH_SERVICE_NAME;
  const serviceEnv = process.env.LLM_AUTH_SERVICE_ENV;
  const consumerIdKey = process.env.LLM_AUTH_CONSUMER_ID_KEY;
  const timestampKey = process.env.LLM_AUTH_CONSUMER_TIMESTAMP_KEY;
  const keyVersionKey = process.env.LLM_AUTH_KEY_VERSION_KEY;
  const authSignatureKey = process.env.LLM_AUTH_AUTH_SIGNATURE_KEY;
  const serviceNameKey = process.env.LLM_AUTH_SERVICE_NAME_KEY;
  const serviceEnvKey = process.env.LLM_AUTH_SERVICE_ENV_KEY;

  console.log("[LLMAuth] Environment check:");
  console.log(
    "[LLMAuth]   LLM_AUTH_CONSUMER_ID:",
    !!consumerId,
    consumerId?.substring(0, 8) + "..."
  );
  console.log("[LLMAuth]   LLM_AUTH_PK_VALUE:", !!privateKey);
  console.log("[LLMAuth]   LLM_AUTH_SERVICE_NAME:", !!serviceName, serviceName);
  console.log("[LLMAuth]   LLM_AUTH_SERVICE_ENV:", !!serviceEnv, serviceEnv);
  console.log(
    "[LLMAuth]   LLM_AUTH_CONSUMER_ID_KEY:",
    !!consumerIdKey,
    consumerIdKey
  );
  console.log(
    "[LLMAuth]   LLM_AUTH_CONSUMER_TIMESTAMP_KEY:",
    !!timestampKey,
    timestampKey
  );
  console.log(
    "[LLMAuth]   LLM_AUTH_KEY_VERSION_KEY:",
    !!keyVersionKey,
    keyVersionKey
  );
  console.log(
    "[LLMAuth]   LLM_AUTH_AUTH_SIGNATURE_KEY:",
    !!authSignatureKey,
    authSignatureKey
  );
  console.log(
    "[LLMAuth]   LLM_AUTH_SERVICE_NAME_KEY:",
    !!serviceNameKey,
    serviceNameKey
  );
  console.log(
    "[LLMAuth]   LLM_AUTH_SERVICE_ENV_KEY:",
    !!serviceEnvKey,
    serviceEnvKey
  );

  // Return null if any required environment variable is missing
  if (
    !consumerId ||
    !privateKey ||
    !serviceName ||
    !serviceEnv ||
    !consumerIdKey ||
    !timestampKey ||
    !keyVersionKey ||
    !authSignatureKey ||
    !serviceNameKey ||
    !serviceEnvKey
  ) {
    console.log(
      "[LLMAuth] Missing required environment variables for LLM auth"
    );
    const missing = [];
    if (!consumerId) missing.push("LLM_AUTH_CONSUMER_ID");
    if (!privateKey) missing.push("LLM_AUTH_PK_VALUE");
    if (!serviceName) missing.push("LLM_AUTH_SERVICE_NAME");
    if (!serviceEnv) missing.push("LLM_AUTH_SERVICE_ENV");
    if (!consumerIdKey) missing.push("LLM_AUTH_CONSUMER_ID_KEY");
    if (!timestampKey) missing.push("LLM_AUTH_CONSUMER_TIMESTAMP_KEY");
    if (!keyVersionKey) missing.push("LLM_AUTH_KEY_VERSION_KEY");
    if (!authSignatureKey) missing.push("LLM_AUTH_AUTH_SIGNATURE_KEY");
    if (!serviceNameKey) missing.push("LLM_AUTH_SERVICE_NAME_KEY");
    if (!serviceEnvKey) missing.push("LLM_AUTH_SERVICE_ENV_KEY");
    console.log("[LLMAuth] Missing variables:", missing.join(", "));
    return null;
  }

  console.log(
    "[LLMAuth] All required environment variables found, returning config"
  );
  return {
    consumerId,
    privateKey,
    serviceName,
    serviceEnv,
    consumerIdKey,
    timestampKey,
    keyVersionKey,
    authSignatureKey,
    serviceNameKey,
    serviceEnvKey,
  };
}

/**
 * [Customer specific] Checks if the client is a LLM auth client.
 * This function checks if all required LLM auth environment variables are set.
 *
 * @returns true if the client is a LLM auth client, false otherwise
 */
export function isLlmAuthClient(): boolean {
  const result = loadLlmAuthConfig() !== null;
  console.log("[LLMAuth] isLlmAuthClient:", result);
  return result;
}

/**
 * [Customer specific] Generates LLM auth consumer authentication headers for API gateway calls.
 * This function creates the same headers required for LLM auth.
 *
 * @returns LlmAuthConsumerHeaders object with all required headers
 * @throws Error if required environment variables are missing
 */
export function generateLlmAuthConsumerHeaders(): LlmAuthConsumerHeaders {
  console.log("[LLMAuth] Generating LLM auth consumer headers...");
  const config = loadLlmAuthConfig();

  if (!config) {
    console.error("[LLMAuth] ERROR: Cannot generate headers - config is null");
    throw new Error(
      "Missing one or more required environment variables: " +
        "LLM_AUTH_CONSUMER_ID, " +
        "LLM_AUTH_PK_VALUE, " +
        "LLM_AUTH_SERVICE_NAME, " +
        "LLM_AUTH_SERVICE_ENV, " +
        "LLM_AUTH_CONSUMER_ID_KEY, " +
        "LLM_AUTH_CONSUMER_TIMESTAMP_KEY, " +
        "LLM_AUTH_KEY_VERSION_KEY, " +
        "LLM_AUTH_AUTH_SIGNATURE_KEY, " +
        "LLM_AUTH_SERVICE_NAME_KEY, " +
        "LLM_AUTH_SERVICE_ENV_KEY"
    );
  }

  const KEY_VERSION = "1";
  const timestamp = Date.now();

  console.log("[LLMAuth] Signing parameters:");
  console.log("[LLMAuth]   Key version:", KEY_VERSION);
  console.log("[LLMAuth]   Timestamp:", timestamp);
  console.log("[LLMAuth]   Consumer ID:", config.consumerId);

  // Create the data to sign (same format as Python)
  const dataToSign = `${config.consumerId}\n${timestamp}\n${KEY_VERSION}\n`;
  console.log("[LLMAuth] Data to sign:", JSON.stringify(dataToSign));

  // Sign the data using RSA with SHA256
  const sign = crypto.createSign("SHA256");
  sign.update(dataToSign, "utf8");
  sign.end();

  const signature = sign.sign(config.privateKey, "base64");
  console.log(
    "[LLMAuth] Generated signature:",
    signature.substring(0, 20) + "..."
  );

  const headers = {
    [config.consumerIdKey]: config.consumerId,
    [config.timestampKey]: timestamp.toString(),
    [config.keyVersionKey]: KEY_VERSION,
    [config.authSignatureKey]: signature,
    [config.serviceNameKey]: config.serviceName,
    [config.serviceEnvKey]: config.serviceEnv,
  };

  console.log("[LLMAuth] Generated headers:");
  Object.entries(headers).forEach(([key, value]) => {
    if (key === config.authSignatureKey) {
      console.log(`[LLMAuth]   ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`[LLMAuth]   ${key}: ${value}`);
    }
  });

  return headers;
}
