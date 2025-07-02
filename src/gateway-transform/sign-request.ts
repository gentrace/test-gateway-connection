import {
  generateLlmAuthConsumerHeaders,
  isLlmAuthClient,
} from './llm-auth';

/**
 * Signs the request headers for Gateway Transform authentication.
 * Uses LLM auth configuration if available, otherwise falls back to basic auth.
 */
export function signRequest(
  headers: Record<string, string | undefined>,
  consumerId: string,
  privateKey?: string,
): Record<string, string | undefined> {
  try {
    // If LLM auth is configured, use it
    const isLlmAuth = isLlmAuthClient();

    if (isLlmAuth) {
      const authHeaders = generateLlmAuthConsumerHeaders();
      return {
        ...headers,
        ...authHeaders,
      };
    }

    // Otherwise, use the fallback basic auth with hardcoded header names
    // This is for cases where gateway-transform is used without full LLM auth setup
    if (!privateKey) {
      // If no private key is provided, just use basic auth with consumer ID
      return {
        ...headers,
        'CONSUMER.ID': consumerId,
        'Content-Type': 'application/json',
      };
    }

    // If private key is provided but LLM auth is not fully configured,
    // we can't sign the request properly
    // Private key provided but LLM auth is not fully configured. Using basic auth.

    return {
      ...headers,
      'CONSUMER.ID': consumerId,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    throw error;
  }
}