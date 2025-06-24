import {
  LanguageModelV1,
  LanguageModelV1CallWarning,
  LanguageModelV1StreamPart,
  UnsupportedFunctionalityError,
} from "@ai-sdk/provider";
import {
  FetchFunction,
  ParseResult,
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  postJsonToApi,
} from "@ai-sdk/provider-utils";
import { z } from "zod";
import { convertToGatewayTransformMessages } from "./convert-to-gateway-transform-messages";
import { createCustomFetch } from "./create-custom-fetch";
import { GatewayTransformChatSettings } from "./gateway-transform-chat-settings";
import { gatewayTransformFailedResponseHandler } from "./gateway-transform-error";
import { mapGatewayTransformFinishReason } from "./map-gateway-transform-finish-reason";
import { signRequest } from "./sign-request";
import { createCustomEventSourceResponseHandler } from "./custom-stream-handler";

type GatewayTransformConfig = {
  provider: string;
  headers: () => Record<string, string | undefined>;
  url: () => string;
  fetch?: FetchFunction;
  ignoreSSL: boolean;
  consumerId: string;
  privateKey: string;
};

export class GatewayTransformChatLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1";

  readonly modelId: string;
  readonly settings: GatewayTransformChatSettings;

  private readonly config: GatewayTransformConfig;

  constructor(
    modelId: string,
    settings: GatewayTransformChatSettings,
    config: GatewayTransformConfig
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  get defaultObjectGenerationMode() {
    return "tool" as const;
  }

  get provider(): string {
    return this.config.provider;
  }

  private getArgs({
    mode,
    prompt,
    maxTokens,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    responseFormat,
    seed,
  }: Parameters<LanguageModelV1["doGenerate"]>[0]) {
    console.log("[GatewayTransformChatLanguageModel] Function: getArgs");
    console.log("[GatewayTransformChatLanguageModel] Processing parameters:", {
      modeType: mode.type,
      hasMaxTokens: maxTokens !== undefined,
      temperature,
      topP,
      topK,
      frequencyPenalty,
      presencePenalty,
      hasStopSequences: !!stopSequences,
      hasResponseFormat: !!responseFormat,
      seed
    });
    
    const warnings: LanguageModelV1CallWarning[] = [];

    if (mode.type !== "regular") {
      console.error("[GatewayTransformChatLanguageModel] ERROR: Unsupported mode type:", mode.type);
      const error = new UnsupportedFunctionalityError({
        functionality: `${mode.type} mode`,
      });
      console.error("[GatewayTransformChatLanguageModel] Throwing UnsupportedFunctionalityError:", {
        errorType: error.constructor.name,
        errorMessage: error.message,
        modeType: mode.type,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    // Convert messages to the format expected by the Gateway Transform
    console.log("[GatewayTransformChatLanguageModel] Converting messages to Gateway Transform format...");
    let messages;
    try {
      messages = convertToGatewayTransformMessages(prompt);
      console.log("[GatewayTransformChatLanguageModel] Messages converted successfully");
    } catch (conversionError) {
      console.error("[GatewayTransformChatLanguageModel] ERROR during message conversion:", {
        errorType: conversionError?.constructor?.name,
        errorMessage: conversionError?.message,
        errorStack: conversionError?.stack,
        promptLength: prompt.length,
        timestamp: new Date().toISOString()
      });
      throw conversionError;
    }

    // Build the model-params object
    const modelParams: Record<string, unknown> = {
      messages,
      ...(maxTokens !== undefined && { max_tokens: maxTokens }),
      ...(temperature !== undefined && { temperature }),
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

    // Build the request body in the Gateway Transform format
    const body = {
      model: this.modelId,
      task: "chat/completions",
      "model-params": modelParams,
    };

    return {
      args: body,
      warnings,
    };
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    console.log("[GatewayTransformChatLanguageModel] Function: doGenerate");
    console.log("[GatewayTransformChatLanguageModel] Model ID:", this.modelId);
    console.log("[GatewayTransformChatLanguageModel] Timestamp:", new Date().toISOString());
    
    let body, warnings;
    try {
      const result = this.getArgs(options);
      body = result.args;
      warnings = result.warnings;
      console.log("[GatewayTransformChatLanguageModel] Arguments prepared successfully");
    } catch (argsError) {
      console.error("[GatewayTransformChatLanguageModel] ERROR preparing arguments:", {
        errorType: argsError?.constructor?.name,
        errorMessage: argsError?.message,
        errorStack: argsError?.stack,
        timestamp: new Date().toISOString()
      });
      throw argsError;
    }

    // Add streaming flag at top level (false for non-streaming)
    body.streaming = false;
    console.log("[GatewayTransformChatLanguageModel] Added streaming flag (false) to top level of body");

    // Update headers with proper signature
    console.log("[GatewayTransformChatLanguageModel] Preparing headers...");
    let signedHeaders;
    try {
      const headers = this.config.headers();
      signedHeaders = signRequest(
        headers,
        this.config.consumerId,
        this.config.privateKey
      );
      console.log("[GatewayTransformChatLanguageModel] Headers signed successfully");
    } catch (signError) {
      console.error("[GatewayTransformChatLanguageModel] ERROR signing headers:", {
        errorType: signError?.constructor?.name,
        errorMessage: signError?.message,
        errorStack: signError?.stack,
        timestamp: new Date().toISOString()
      });
      throw signError;
    }

    // Create custom fetch if SSL should be ignored
    const customFetch = this.config.ignoreSSL
      ? createCustomFetch()
      : this.config.fetch;

    console.log("[GatewayTransformChatLanguageModel] Making API request...");
    console.log("[GatewayTransformChatLanguageModel] Request URL:", this.config.url());
    console.log("[GatewayTransformChatLanguageModel] Request body:", JSON.stringify(body, null, 2));
    
    let responseHeaders, response;
    try {
      const apiResponse = await postJsonToApi({
        url: this.config.url(),
        headers: combineHeaders(signedHeaders, options.headers),
        body,
        failedResponseHandler: gatewayTransformFailedResponseHandler,
        successfulResponseHandler: createJsonResponseHandler(
          gatewayTransformChatResponseSchema
        ),
        abortSignal: options.abortSignal,
        fetch: customFetch,
      });
      responseHeaders = apiResponse.responseHeaders;
      response = apiResponse.value;
      console.log("[GatewayTransformChatLanguageModel] API request successful");
      console.log("[GatewayTransformChatLanguageModel] Response:", JSON.stringify(response, null, 2));
    } catch (apiError) {
      console.error("[GatewayTransformChatLanguageModel] ERROR: API request failed:", {
        errorType: apiError?.constructor?.name,
        errorMessage: apiError?.message,
        errorStack: apiError?.stack,
        url: this.config.url(),
        modelId: this.modelId,
        timestamp: new Date().toISOString()
      });
      throw apiError;
    }

    const choice = response.choices[0];
    if (!choice) {
      console.error("[GatewayTransformChatLanguageModel] ERROR: No choice in response", {
        response: JSON.stringify(response),
        timestamp: new Date().toISOString()
      });
      throw new Error("No choice in response");
    }

    return {
      text: choice.message.content ?? undefined,
      toolCalls: choice.message.tool_calls?.map((toolCall) => ({
        toolCallType: "function",
        toolCallId: toolCall.id,
        toolName: toolCall.function.name,
        args: toolCall.function.arguments!,
      })),
      finishReason: mapGatewayTransformFinishReason(choice.finish_reason),
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? NaN,
        completionTokens: response.usage?.completion_tokens ?? NaN,
      },
      rawCall: { rawPrompt: body["model-params"].messages, rawSettings: body },
      rawResponse: { headers: responseHeaders },
      warnings,
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    console.log("[GatewayTransformChatLanguageModel] Function: doStream");
    console.log("[GatewayTransformChatLanguageModel] Model ID:", this.modelId);
    console.log("[GatewayTransformChatLanguageModel] Timestamp:", new Date().toISOString());
    
    let body, warnings;
    try {
      const result = this.getArgs(options);
      body = result.args;
      warnings = result.warnings;
      console.log("[GatewayTransformChatLanguageModel] Stream arguments prepared successfully");
    } catch (argsError) {
      console.error("[GatewayTransformChatLanguageModel] ERROR preparing stream arguments:", {
        errorType: argsError?.constructor?.name,
        errorMessage: argsError?.message,
        errorStack: argsError?.stack,
        timestamp: new Date().toISOString()
      });
      throw argsError;
    }

    // Add streaming flag at top level
    body.streaming = true;
    console.log(
      "[GatewayTransformChatLanguageModel] Added streaming flag to top level of body"
    );

    // Update headers with proper signature
    console.log(
      "[GatewayTransformChatLanguageModel] Getting and signing headers for streaming..."
    );
    let signedHeaders;
    try {
      const headers = this.config.headers();
      signedHeaders = signRequest(
        headers,
        this.config.consumerId,
        this.config.privateKey
      );
      console.log("[GatewayTransformChatLanguageModel] Stream headers signed successfully");
    } catch (signError) {
      console.error("[GatewayTransformChatLanguageModel] ERROR signing stream headers:", {
        errorType: signError?.constructor?.name,
        errorMessage: signError?.message,
        errorStack: signError?.stack,
        timestamp: new Date().toISOString()
      });
      throw signError;
    }

    // Create custom fetch if SSL should be ignored
    const customFetch = this.config.ignoreSSL
      ? createCustomFetch()
      : this.config.fetch;
    console.log(
      "[GatewayTransformChatLanguageModel] Using custom fetch for streaming:",
      this.config.ignoreSSL
    );

    console.log(
      "[GatewayTransformChatLanguageModel] Making streaming API request..."
    );
    console.log("[GatewayTransformChatLanguageModel] URL:", this.config.url());
    console.log(
      "[GatewayTransformChatLanguageModel] Combined headers:",
      JSON.stringify(combineHeaders(signedHeaders, options.headers), null, 2)
    );
    console.log(
      "[GatewayTransformChatLanguageModel] Request body:",
      JSON.stringify(body, null, 2)
    );

    const { responseHeaders, value: response } = await postJsonToApi({
      url: this.config.url(),
      headers: combineHeaders(signedHeaders, options.headers),
      body,
      failedResponseHandler: gatewayTransformFailedResponseHandler,
      successfulResponseHandler: createCustomEventSourceResponseHandler(
        gatewayTransformChatStreamChunkSchema
      ),
      abortSignal: options.abortSignal,
      fetch: customFetch,
    });

    console.log(
      "[GatewayTransformChatLanguageModel] Stream response received!"
    );
    console.log(
      "[GatewayTransformChatLanguageModel] Response headers:",
      responseHeaders
    );

    const createStreamPart = (
      delta: z.infer<typeof gatewayTransformChatStreamChunkSchema>
    ): LanguageModelV1StreamPart => {
      console.log(
        "[GatewayTransformChatLanguageModel] Processing stream chunk:",
        JSON.stringify(delta, null, 2)
      );

      const choice = delta.choices?.[0];
      if (!choice) {
        console.error(
          "[GatewayTransformChatLanguageModel] ERROR: No choice in stream response"
        );
        return {
          type: "error",
          error: new Error("No choice in stream response"),
        };
      }

      if (choice.finish_reason) {
        console.log(
          "[GatewayTransformChatLanguageModel] Stream finished, reason:",
          choice.finish_reason
        );
        console.log(
          "[GatewayTransformChatLanguageModel] Final usage:",
          delta.usage
        );
        return {
          type: "finish",
          finishReason: mapGatewayTransformFinishReason(choice.finish_reason),
          usage: {
            promptTokens: delta.usage?.prompt_tokens ?? NaN,
            completionTokens: delta.usage?.completion_tokens ?? NaN,
          },
        };
      }

      if (choice.delta.content) {
        console.log(
          "[GatewayTransformChatLanguageModel] Text delta:",
          choice.delta.content
        );
        return {
          type: "text-delta",
          textDelta: choice.delta.content,
        };
      }

      if (choice.delta.tool_calls) {
        console.log(
          "[GatewayTransformChatLanguageModel] Tool call delta:",
          choice.delta.tool_calls
        );
        return {
          type: "tool-call-delta",
          toolCallType: "function",
          toolCallId: choice.delta.tool_calls[0].id ?? "",
          toolName: choice.delta.tool_calls[0].function?.name ?? "",
          argsTextDelta: choice.delta.tool_calls[0].function?.arguments ?? "",
        };
      }

      console.log(
        "[GatewayTransformChatLanguageModel] Unknown stream part type:",
        delta
      );
      // Return an error for unknown stream parts
      return {
        type: "error",
        error: new Error("Unknown stream part type"),
      };
    };

    console.log(
      "[GatewayTransformChatLanguageModel] Creating stream transform..."
    );

    return {
      stream: response.pipeThrough(
        new TransformStream<
          ParseResult<z.infer<typeof gatewayTransformChatStreamChunkSchema>>,
          LanguageModelV1StreamPart
        >({
          transform(chunk, controller) {
            console.log(
              "[GatewayTransformChatLanguageModel] Transform chunk:",
              JSON.stringify(chunk, null, 2)
            );

            // Handle ParseResult structure
            if (!chunk.success) {
              console.error(
                "[GatewayTransformChatLanguageModel] Stream parse error:",
                chunk.error
              );
              controller.enqueue({ type: "error", error: chunk.error });
              return;
            }

            if (chunk.value.choices) {
              const streamPart = createStreamPart(chunk.value);
              controller.enqueue(streamPart);
            } else {
              console.log(
                "[GatewayTransformChatLanguageModel] Chunk with no choices:",
                chunk.value
              );
            }
          },
        })
      ),
      rawCall: { rawPrompt: body["model-params"].messages, rawSettings: body },
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
              type: z.literal("function"),
              function: z.object({
                name: z.string(),
                arguments: z.string(),
              }),
            })
          )
          .optional(),
      }),
      finish_reason: z.string().nullable(),
    })
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
              type: z.literal("function").optional(),
              function: z
                .object({
                  name: z.string().optional(),
                  arguments: z.string().optional(),
                })
                .optional(),
            })
          )
          .optional(),
      }),
      finish_reason: z.string().nullable().optional(),
    })
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});
