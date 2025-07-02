import { convertToGatewayTransformMessages } from './convert-to-gateway-transform-messages';
import { GatewayTransformChatSettings } from './gateway-transform-chat-settings';
import { gatewayTransformFailedResponseHandler } from './gateway-transform-error';
import { mapGatewayTransformFinishReason } from './map-gateway-transform-finish-reason';
import { signRequest } from './sign-request';
import {
  LanguageModelV1,
  LanguageModelV1CallWarning,
  LanguageModelV1StreamPart,
  UnsupportedFunctionalityError,
} from '@ai-sdk/provider';
import {
  FetchFunction,
  ParseResult,
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';

type GatewayTransformConfig = {
  provider: string;
  headers: () => Record<string, string | undefined>;
  url: () => string;
  fetch?: FetchFunction;
  consumerId: string;
  privateKey: string;
  serviceName: string;
  environment: string;
};

export class GatewayTransformChatLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1';

  readonly modelId: string;
  readonly settings: GatewayTransformChatSettings;

  private readonly config: GatewayTransformConfig;

  constructor(
    modelId: string,
    settings: GatewayTransformChatSettings,
    config: GatewayTransformConfig,
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  get defaultObjectGenerationMode() {
    return 'tool' as const;
  }

  get provider(): string {
    return this.config.provider;
  }

  private getArgs({
    mode,
    prompt,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    responseFormat,
    seed,
  }: Parameters<LanguageModelV1['doGenerate']>[0]) {
    const warnings: LanguageModelV1CallWarning[] = [];

    // Convert messages to the format expected by the Gateway Transform
    const messages = convertToGatewayTransformMessages(prompt);

    // Build the model-params object
    const modelParams: Record<string, unknown> = {
      messages,
      ...(topP !== undefined && { top_p: topP }),
      ...(topK !== undefined && { top_k: topK }),
      ...(frequencyPenalty !== undefined && {
        frequency_penalty: frequencyPenalty,
      }),
      ...(presencePenalty !== undefined && {
        presence_penalty: presencePenalty,
      }),
      ...(stopSequences !== undefined && { stop: stopSequences }),
      ...(seed !== undefined && { seed }),
      ...(responseFormat !== undefined && { response_format: responseFormat }),
      ...(this.settings.modelParams || {}),
    };

    // Handle different modes
    switch (mode.type) {
      case 'regular':
        // Check if tools are provided in regular mode
        if (mode.tools && mode.tools.length > 0) {
          // Convert tools to OpenAI format
          modelParams.tools = mode.tools.map((tool: any) => ({
            type: tool.type,
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          }));

          // Handle tool choice if specified
          if (mode.toolChoice) {
            if (mode.toolChoice.type === 'tool' && mode.toolChoice.toolName) {
              modelParams.tool_choice = {
                type: 'function',
                function: { name: mode.toolChoice.toolName },
              };
            } else if (mode.toolChoice.type === 'auto') {
              modelParams.tool_choice = 'auto';
            } else if (mode.toolChoice.type === 'none') {
              modelParams.tool_choice = 'none';
            } else if (mode.toolChoice.type === 'required') {
              modelParams.tool_choice = 'required';
            }
          }
        }
        break;

      case 'object-tool': {
        // Gateway Transform expects OpenAI-style tool format
        const { tool } = mode;
        modelParams.tools = [
          {
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          },
        ];
        modelParams.tool_choice = {
          type: 'function',
          function: { name: tool.name },
        };
        break;
      }

      default:
        throw new UnsupportedFunctionalityError({
          functionality: `${mode.type} mode`,
        });
    }

    // Build the request body in the Gateway Transform format
    const body: {
      model: string;
      task: string;
      'model-params': Record<string, unknown>;
      streaming?: boolean;
      'api-version': string;
    } = {
      model: this.modelId,
      task: 'chat/completions',
      'model-params': modelParams,
      'api-version': '2024-10-21',
    };

    return {
      args: body,
      warnings,
    };
  }

  async doGenerate(
    options: Parameters<LanguageModelV1['doGenerate']>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV1['doGenerate']>>> {
    const { args: body, warnings } = this.getArgs(options);

    // Add streaming flag and api-version at top level (false for non-streaming)
    body.streaming = false;
    body['api-version'] = '2024-10-21';

    // Update headers with proper signature
    const headers = this.config.headers();
    const signedHeaders = signRequest(
      headers,
      this.config.consumerId,
      this.config.privateKey,
    );

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url(),
      headers: combineHeaders(signedHeaders, options.headers),
      body,
      failedResponseHandler: gatewayTransformFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        gatewayTransformChatResponseSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error('No choice in response');
    }

    return {
      text: choice.message.content ?? undefined,
      toolCalls: choice.message.tool_calls?.map((toolCall) => ({
        toolCallType: 'function',
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        args: toolCall.function.arguments, // This should be a string, not parsed
      })),
      finishReason: mapGatewayTransformFinishReason(choice.finish_reason),
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? NaN,
        completionTokens: response.usage?.completion_tokens ?? NaN,
      },
      rawCall: { rawPrompt: body['model-params'].messages, rawSettings: body },
      rawResponse: { headers: responseHeaders },
      warnings,
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1['doStream']>[0],
  ): Promise<Awaited<ReturnType<LanguageModelV1['doStream']>>> {
    const { args: body, warnings } = this.getArgs(options);

    // Add streaming flag and api-version at top level
    body.streaming = true;
    body['api-version'] = '2024-10-21';

    // Update headers with proper signature
    const headers = this.config.headers();
    const signedHeaders = signRequest(
      headers,
      this.config.consumerId,
      this.config.privateKey,
    );

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url(),
      headers: combineHeaders(signedHeaders, options.headers),
      body,
      failedResponseHandler: gatewayTransformFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        gatewayTransformChatStreamChunkSchema,
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    // Track tool calls to maintain id, name, and accumulated arguments across chunks
    const toolCalls: Record<
      number,
      { id: string; name: string; arguments: string; emitted?: boolean }
    > = {};

    return {
      stream: response.pipeThrough(
        new TransformStream<
          ParseResult<z.infer<typeof gatewayTransformChatStreamChunkSchema>>,
          LanguageModelV1StreamPart
        >({
          transform(chunk, controller) {
            // Handle ParseResult structure
            if (chunk.success === false) {
              controller.enqueue({ type: 'error', error: chunk.error });
              return;
            }

            if (chunk.value.choices) {
              const choice = chunk.value.choices[0];
              if (!choice) {
                return;
              }

              // Handle finish reason
              if (choice.finish_reason) {
                // Before finishing, emit any complete tool calls that haven't been emitted yet
                for (const [, toolCall] of Object.entries(toolCalls)) {
                  if (toolCall && toolCall.arguments && !toolCall.emitted) {
                    try {
                      // Check if the arguments are valid JSON (indicating completion)
                      JSON.parse(toolCall.arguments);
                      controller.enqueue({
                        type: 'tool-call',
                        toolCallType: 'function',
                        toolCallId: toolCall.id,
                        toolName: toolCall.name,
                        args: toolCall.arguments,
                      });
                      toolCall.emitted = true;
                    } catch (e) {
                      // Arguments might not be complete JSON, skip
                    }
                  }
                }

                controller.enqueue({
                  type: 'finish',
                  finishReason: mapGatewayTransformFinishReason(
                    choice.finish_reason,
                  ),
                  usage: {
                    promptTokens: chunk.value.usage?.prompt_tokens ?? NaN,
                    completionTokens:
                      chunk.value.usage?.completion_tokens ?? NaN,
                  },
                });
                return;
              }

              // Handle text content
              if (choice.delta.content) {
                controller.enqueue({
                  type: 'text-delta',
                  textDelta: choice.delta.content,
                });
                return;
              }

              // Handle tool calls
              if (choice.delta.tool_calls) {
                for (let i = 0; i < choice.delta.tool_calls.length; i++) {
                  const toolCallDelta = choice.delta.tool_calls[i];
                  const index = i; // Use array index since chunks might not have index field

                  // Initialize tool call info on first chunk with id
                  if (toolCallDelta && toolCallDelta.id) {
                    toolCalls[index] = {
                      id: toolCallDelta.id,
                      name: toolCallDelta.function?.name || '',
                      arguments: '',
                    };
                  }

                  // Update name if provided
                  if (
                    toolCallDelta &&
                    toolCallDelta.function?.name &&
                    toolCalls[index]
                  ) {
                    toolCalls[index].name = toolCallDelta.function.name;
                  }

                  // Accumulate arguments and emit delta
                  if (
                    toolCallDelta &&
                    toolCallDelta.function?.arguments !== undefined &&
                    toolCalls[index]
                  ) {
                    const toolInfo = toolCalls[index];
                    toolInfo.arguments += toolCallDelta.function.arguments;

                    controller.enqueue({
                      type: 'tool-call-delta',
                      toolCallType: 'function',
                      toolCallId: toolInfo.id,
                      toolName: toolInfo.name,
                      argsTextDelta: toolCallDelta.function.arguments,
                    });

                    // Check if the tool call is complete (valid JSON) and not already emitted
                    if (!toolInfo.emitted) {
                      try {
                        JSON.parse(toolInfo.arguments);
                        // If we can parse it, emit a complete tool-call event
                        controller.enqueue({
                          type: 'tool-call',
                          toolCallType: 'function',
                          toolCallId: toolInfo.id,
                          toolName: toolInfo.name,
                          args: toolInfo.arguments,
                        });
                        toolInfo.emitted = true; // Mark as emitted
                      } catch (e) {}
                    }
                  }
                }
                return;
              }

              // Handle empty deltas (e.g., when only role is present)
              if (choice.delta.role && !choice.delta.content) {
                controller.enqueue({
                  type: 'text-delta',
                  textDelta: '',
                });
              }
            }
          },
        }),
      ),
      rawCall: { rawPrompt: body['model-params'].messages, rawSettings: body },
      rawResponse: { headers: responseHeaders },
      warnings,
    };
  }
}

// Response schemas
const gatewayTransformChatResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.string(),
        content: z.string().nullable(),
        tool_calls: z
          .array(
            z.object({
              id: z.string(),
              type: z.literal('function'),
              function: z.object({
                name: z.string(),
                arguments: z.string(),
              }),
            }),
          )
          .optional(),
      }),
      finish_reason: z.string().nullable(),
    }),
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

const gatewayTransformChatStreamChunkSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      delta: z.object({
        role: z.string().optional(),
        content: z.string().nullable().optional(),
        tool_calls: z
          .array(
            z.object({
              id: z.string().optional(),
              type: z.literal('function').optional(),
              function: z
                .object({
                  name: z.string().optional(),
                  arguments: z.string().optional(),
                })
                .optional(),
            }),
          )
          .optional(),
      }),
      finish_reason: z.string().nullable().optional(),
    }),
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});