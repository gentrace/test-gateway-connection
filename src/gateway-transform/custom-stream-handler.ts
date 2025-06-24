import { z } from "zod";
import { ParseResult, ResponseHandler } from "@ai-sdk/provider-utils";

/**
 * Custom event source response handler for Gateway Transform streaming.
 * This handles potential differences in SSE format from the gateway.
 */
export function createCustomEventSourceResponseHandler<T>(
  chunkSchema: z.ZodSchema<T>
): ResponseHandler<ReadableStream<ParseResult<T>>> {
  return async ({ response }) => {
    console.log("[CustomStreamHandler] Processing streaming response");
    
    const stream = response.body;
    if (!stream) {
      throw new Error("Response body is empty");
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream<ParseResult<T>>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log("[CustomStreamHandler] Stream complete");
            controller.close();
            return;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith(':')) {
              continue;
            }

            // Handle data lines
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6);
              
              // Skip [DONE] message
              if (data === '[DONE]') {
                console.log("[CustomStreamHandler] Received [DONE] signal");
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                console.log("[CustomStreamHandler] Parsed chunk:", parsed);
                
                // Validate against schema
                const result = chunkSchema.safeParse(parsed);
                
                if (result.success) {
                  controller.enqueue({
                    type: "success",
                    value: result.data,
                  });
                } else {
                  console.error("[CustomStreamHandler] Schema validation failed:", result.error);
                  controller.enqueue({
                    type: "error",
                    error: result.error,
                  });
                }
              } catch (error) {
                console.error("[CustomStreamHandler] JSON parse error:", error);
                console.error("[CustomStreamHandler] Failed data:", data);
                // Skip malformed JSON
              }
            }
          }
        } catch (error) {
          console.error("[CustomStreamHandler] Stream read error:", error);
          controller.error(error);
        }
      },

      cancel() {
        reader.releaseLock();
      },
    });
  };
}