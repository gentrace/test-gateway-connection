import { GatewayTransformChatLanguageModel } from './gateway-transform-chat-language-model';
import { GatewayTransformChatSettings } from './gateway-transform-chat-settings';
import { LanguageModelV1 } from '@ai-sdk/provider';
import {
  FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';

export interface GatewayTransformProvider {
  (modelId: string, settings?: GatewayTransformChatSettings): LanguageModelV1;

  /**
   * Creates a Gateway Transform chat model for text generation.
   */
  languageModel(
    modelId: string,
    settings?: GatewayTransformChatSettings,
  ): LanguageModelV1;

  /**
   * Creates a Gateway Transform chat model for text generation.
   */
  chat(
    modelId: string,
    settings?: GatewayTransformChatSettings,
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
   * Custom fetch implementation. You can use it as a middleware to intercept requests,
   * or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;
}

/**
 * Create a Gateway Transform provider instance.
 */
export function createGatewayTransform(
  options: GatewayTransformProviderSettings = {},
): GatewayTransformProvider {
  // All these are required and will throw if not provided
  const baseURL =
    withoutTrailingSlash(options.baseURL) ??
    loadApiKey({
      apiKey: undefined,
      environmentVariableName: 'GATEWAY_TRANSFORM_BASE_URL',
      description: 'Gateway Transform Base URL',
    });

  const serviceName =
    options.serviceName ??
    loadApiKey({
      apiKey: undefined,
      environmentVariableName: 'LLM_AUTH_SERVICE_NAME',
      description: 'LLM Auth Service Name',
    });

  const environment =
    options.environment ??
    loadApiKey({
      apiKey: undefined,
      environmentVariableName: 'LLM_AUTH_SERVICE_ENV',
      description: 'LLM Auth Service Environment',
    });

  const consumerId = loadApiKey({
    apiKey: options.consumerId,
    environmentVariableName: 'LLM_AUTH_CONSUMER_ID',
    description: 'LLM Auth Consumer ID',
  });

  const privateKey = loadApiKey({
    apiKey: options.privateKey,
    environmentVariableName: 'LLM_AUTH_PK_VALUE',
    description: 'LLM Auth Private Key',
  });

  // Validate all required fields are present
  if (!baseURL || !serviceName || !environment || !consumerId || !privateKey) {
    throw new Error(
      'Gateway Transform provider requires all authentication parameters: ' +
        'GATEWAY_TRANSFORM_BASE_URL, LLM_AUTH_SERVICE_NAME, LLM_AUTH_SERVICE_ENV, ' +
        'LLM_AUTH_CONSUMER_ID, and LLM_AUTH_PK_VALUE must be set',
    );
  }

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  const createChatModel = (
    modelId: string,
    settings: GatewayTransformChatSettings = {},
  ) => {
    return new GatewayTransformChatLanguageModel(modelId, settings, {
      provider: 'gateway-transform.chat',
      url: () => baseURL,
      headers: getHeaders,
      fetch: options.fetch,
      consumerId,
      privateKey,
      serviceName,
      environment,
    });
  };

  const provider = function (
    modelId: string,
    settings?: GatewayTransformChatSettings,
  ) {
    return createChatModel(modelId, settings);
  };

  provider.languageModel = createChatModel;
  provider.chat = createChatModel;

  return provider as GatewayTransformProvider;
}