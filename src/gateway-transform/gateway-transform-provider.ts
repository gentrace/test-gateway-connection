import { LanguageModelV1 } from "@ai-sdk/provider";
import {
  FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
} from "@ai-sdk/provider-utils";
import { GatewayTransformChatLanguageModel } from "./gateway-transform-chat-language-model";
import { GatewayTransformChatSettings } from "./gateway-transform-chat-settings";

export interface GatewayTransformProvider {
  (modelId: string, settings?: GatewayTransformChatSettings): LanguageModelV1;

  /**
   * Creates a Gateway Transform chat model for text generation.
   */
  languageModel(
    modelId: string,
    settings?: GatewayTransformChatSettings
  ): LanguageModelV1;

  /**
   * Creates a Gateway Transform chat model for text generation.
   */
  chat(
    modelId: string,
    settings?: GatewayTransformChatSettings
  ): LanguageModelV1;
}

export interface GatewayTransformProviderSettings {
  /**
   * Base URL for the Gateway Transform API calls.
   */
  baseURL?: string;

  /**
   * Service name for the Gateway Transform.
   */
  serviceName?: string;

  /**
   * Service environment.
   */
  environment?: string;

  /**
   * Consumer ID for authentication.
   */
  consumerId?: string;

  /**
   * Private key for signing requests.
   */
  privateKey?: string;

  /**
   * Custom headers to include in the requests.
   */
  headers?: Record<string, string>;

  /**
   * Whether to ignore SSL certificate errors. Default is false.
   * WARNING: Only use this for development/testing. Never in production.
   */
  ignoreSSL?: boolean;

  /**
   * Custom fetch implementation. You can use it as a middleware to intercept requests,
   * or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;
}

/**
 * Create a Gateway Transform provider instance.
 */
export function createGatewayTransform(
  options: GatewayTransformProviderSettings = {}
): GatewayTransformProvider {
  console.log("[GatewayTransformProvider] Function: createGatewayTransform");
  console.log(
    "[GatewayTransformProvider] Creating gateway transform provider..."
  );
  console.log(
    "[GatewayTransformProvider] Timestamp:",
    new Date().toISOString()
  );
  console.log(
    "[GatewayTransformProvider] Options:",
    JSON.stringify(options, null, 2)
  );

  try {
    const baseURL =
      withoutTrailingSlash(options.baseURL) ?? "https://your-gateway-url.com";
    console.log("[GatewayTransformProvider] Base URL:", baseURL);

    if (!options.baseURL) {
      console.warn(
        "[GatewayTransformProvider] WARNING: No baseURL provided, using default"
      );
      console.warn(
        "[GatewayTransformProvider] Default URL: https://your-gateway-url.com"
      );
    }

    const serviceName = options.serviceName ?? "your-service-name";
    const environment = options.environment ?? "prod";
    console.log("[GatewayTransformProvider] Service Name:", serviceName);
    console.log("[GatewayTransformProvider] Environment:", environment);

    let consumerId;
    try {
      consumerId = loadApiKey({
        apiKey: options.consumerId,
        environmentVariableName: "LLM_AUTH_CONSUMER_ID",
        description: "LLM Auth Consumer ID",
      });
      console.log(
        "[GatewayTransformProvider] Consumer ID loaded:",
        !!consumerId,
        consumerId?.substring(0, 8) + "..."
      );
    } catch (consumerError) {
      console.error("[GatewayTransformProvider] ERROR loading consumer ID:", {
        errorType: consumerError?.constructor?.name,
        errorMessage: consumerError?.message,
        errorStack: consumerError?.stack,
        timestamp: new Date().toISOString(),
      });
      throw consumerError;
    }

    let privateKey;
    try {
      privateKey = loadApiKey({
        apiKey: options.privateKey,
        environmentVariableName: "LLM_AUTH_PK_VALUE",
        description: "LLM Auth Private Key",
      });
      console.log(
        "[GatewayTransformProvider] Private Key loaded:",
        !!privateKey
      );
      if (privateKey) {
        console.log(
          "[GatewayTransformProvider] Private Key length:",
          privateKey.length
        );
      }
    } catch (keyError) {
      console.error("[GatewayTransformProvider] ERROR loading private key:", {
        errorType: keyError?.constructor?.name,
        errorMessage: keyError?.message,
        errorStack: keyError?.stack,
        timestamp: new Date().toISOString(),
      });
      // Private key is optional, so we continue
      console.warn("[GatewayTransformProvider] Continuing without private key");
      privateKey = undefined;
    }

    const getHeaders = () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          ...options.headers,
        };
        console.log("[GatewayTransformProvider] Base headers:", headers);
        return headers;
      } catch (headerError) {
        console.error("[GatewayTransformProvider] ERROR creating headers:", {
          errorType: headerError?.constructor?.name,
          errorMessage: headerError?.message,
          errorStack: headerError?.stack,
          timestamp: new Date().toISOString(),
        });
        throw headerError;
      }
    };

    const createChatModel = (
      modelId: string,
      settings: GatewayTransformChatSettings = {}
    ) => {
      console.log("[GatewayTransformProvider] Function: createChatModel");
      console.log("[GatewayTransformProvider] Creating chat model...");
      console.log("[GatewayTransformProvider] Model ID:", modelId);
      console.log(
        "[GatewayTransformProvider] Settings:",
        JSON.stringify(settings, null, 2)
      );
      console.log(
        "[GatewayTransformProvider] Ignore SSL:",
        options.ignoreSSL ?? false
      );

      try {
        const model = new GatewayTransformChatLanguageModel(modelId, settings, {
          provider: "gateway-transform.chat",
          url: () => baseURL,
          headers: getHeaders,
          fetch: options.fetch,
          ignoreSSL: options.ignoreSSL ?? false,
          consumerId,
          privateKey,
        });

        console.log(
          "[GatewayTransformProvider] Chat model created successfully"
        );
        return model;
      } catch (modelError) {
        console.error("[GatewayTransformProvider] ERROR creating chat model:", {
          errorType: modelError?.constructor?.name,
          errorMessage: modelError?.message,
          errorStack: modelError?.stack,
          modelId,
          timestamp: new Date().toISOString(),
        });
        throw modelError;
      }
    };

    const provider = function (
      modelId: string,
      settings?: GatewayTransformChatSettings
    ) {
      console.log("[GatewayTransformProvider] Provider function called");
      console.log("[GatewayTransformProvider] Model ID:", modelId);
      return createChatModel(modelId, settings);
    };

    provider.languageModel = createChatModel;
    provider.chat = createChatModel;

    console.log("[GatewayTransformProvider] Provider created successfully");
    return provider as GatewayTransformProvider;
  } catch (error) {
    console.error(
      "[GatewayTransformProvider] FATAL ERROR in createGatewayTransform:",
      {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        functionName: "createGatewayTransform",
        timestamp: new Date().toISOString(),
      }
    );
    throw error;
  }
}
