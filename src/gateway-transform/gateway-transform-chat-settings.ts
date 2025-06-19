export interface GatewayTransformChatSettings {
  /**
   * Maximum number of tokens to generate.
   */
  maxTokens?: number;

  /**
   * Temperature for sampling.
   */
  temperature?: number;

  /**
   * Top-p (nucleus) sampling.
   */
  topP?: number;

  /**
   * Top-k sampling.
   */
  topK?: number;

  /**
   * Frequency penalty.
   */
  frequencyPenalty?: number;

  /**
   * Presence penalty.
   */
  presencePenalty?: number;

  /**
   * Stop sequences.
   */
  stopSequences?: string[];

  /**
   * Random seed for deterministic generation.
   */
  seed?: number;

  /**
   * Response format (e.g., 'json_object').
   */
  responseFormat?: { type: 'text' | 'json_object' };

  /**
   * Additional model parameters specific to the Gateway Transform.
   */
  modelParams?: Record<string, unknown>;
}