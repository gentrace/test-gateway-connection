import {
  LanguageModelV1Prompt,
  UnsupportedFunctionalityError,
} from "@ai-sdk/provider";

export function convertToGatewayTransformMessages(
  prompt: LanguageModelV1Prompt
): unknown[] {
  console.log("[ConvertMessages] Function: convertToGatewayTransformMessages");
  console.log("[ConvertMessages] Starting message conversion...");
  console.log("[ConvertMessages] Timestamp:", new Date().toISOString());
  console.log("[ConvertMessages] Input prompt length:", prompt.length);
  console.log("[ConvertMessages] Input prompt:", JSON.stringify(prompt, null, 2));

  const messages: unknown[] = [];
  let messageIndex = 0;

  try {
    for (const { role, content } of prompt) {
      messageIndex++;
      console.log("[ConvertMessages] Processing message", messageIndex, "with role:", role);
      console.log("[ConvertMessages] Content type:", Array.isArray(content) ? 'array' : typeof content);

    switch (role) {
      case "system": {
        console.log("[ConvertMessages] System message:", content);
        messages.push({ role: "system", content: content });
        break;
      }

      case "user": {
        console.log("[ConvertMessages] User message parts:", content.length);
        const userContent = content
          .map((part) => {
            console.log(
              "[ConvertMessages] Processing user part type:",
              part.type
            );
            switch (part.type) {
              case "text": {
                console.log("[ConvertMessages] Text part:", part.text);
                return part.text;
              }
              case "image": {
                console.error(
                  "[ConvertMessages] ERROR: Image parts not supported"
                );
                console.error("[ConvertMessages] Image part details:", {
                  type: part.type,
                  messageIndex,
                  role,
                  timestamp: new Date().toISOString()
                });
                const error = new UnsupportedFunctionalityError({
                  functionality: "image-part",
                });
                console.error("[ConvertMessages] Throwing UnsupportedFunctionalityError:", {
                  errorType: error.constructor.name,
                  errorMessage: error.message,
                  functionality: "image-part"
                });
                throw error;
              }
              default: {
                const _exhaustiveCheck: never = part;
                console.error(
                  "[ConvertMessages] ERROR: Unsupported user part type:",
                  _exhaustiveCheck
                );
                console.error("[ConvertMessages] Unsupported part details:", {
                  part: _exhaustiveCheck,
                  messageIndex,
                  role,
                  timestamp: new Date().toISOString()
                });
                const error = new Error(`Unsupported part type: ${_exhaustiveCheck}`);
                console.error("[ConvertMessages] Throwing Error:", {
                  errorType: error.constructor.name,
                  errorMessage: error.message
                });
                throw error;
              }
            }
          })
          .join("");

        console.log("[ConvertMessages] Final user content:", userContent);
        messages.push({
          role: "user",
          content: userContent,
        });
        break;
      }

      case "assistant": {
        console.log(
          "[ConvertMessages] Assistant message parts:",
          content.length
        );
        let text = "";
        const toolCalls: any[] = [];

        for (const part of content) {
          console.log(
            "[ConvertMessages] Processing assistant part type:",
            part.type
          );
          switch (part.type) {
            case "text": {
              console.log("[ConvertMessages] Assistant text:", part.text);
              text += part.text;
              break;
            }
            case "tool-call": {
              console.log("[ConvertMessages] Tool call:", {
                id: part.toolCallId,
                name: part.toolName,
                args: part.args,
              });
              toolCalls.push({
                id: part.toolCallId,
                type: "function",
                function: {
                  name: part.toolName,
                  arguments: JSON.stringify(part.args),
                },
              });
              break;
            }
            default: {
              const _exhaustiveCheck: never = part;
              console.error(
                "[ConvertMessages] ERROR: Unsupported assistant part type:",
                _exhaustiveCheck
              );
              console.error("[ConvertMessages] Unsupported assistant part details:", {
                part: _exhaustiveCheck,
                messageIndex,
                role: "assistant",
                timestamp: new Date().toISOString()
              });
              const error = new Error(`Unsupported part type: ${_exhaustiveCheck}`);
              console.error("[ConvertMessages] Throwing Error:", {
                errorType: error.constructor.name,
                errorMessage: error.message
              });
              throw error;
            }
          }
        }

        console.log("[ConvertMessages] Assistant final text:", text);
        console.log(
          "[ConvertMessages] Assistant tool calls count:",
          toolCalls.length
        );

        messages.push({
          role: "assistant",
          content: text,
          ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
        });
        break;
      }

      case "tool": {
        console.log("[ConvertMessages] Tool message parts:", content.length);
        for (const part of content) {
          console.log(
            "[ConvertMessages] Processing tool part type:",
            part.type
          );
          if (part.type !== "tool-result") {
            console.error(
              "[ConvertMessages] ERROR: Unsupported tool part type:",
              part.type
            );
            console.error("[ConvertMessages] Unsupported tool part details:", {
              partType: part.type,
              messageIndex,
              role: "tool",
              timestamp: new Date().toISOString()
            });
            const error = new UnsupportedFunctionalityError({
              functionality: `${part.type}-part`,
            });
            console.error("[ConvertMessages] Throwing UnsupportedFunctionalityError:", {
              errorType: error.constructor.name,
              errorMessage: error.message,
              functionality: `${part.type}-part`
            });
            throw error;
          }

          console.log("[ConvertMessages] Tool result:", {
            result: part.result,
            toolCallId: part.toolCallId,
          });

          messages.push({
            role: "tool",
            content: JSON.stringify(part.result),
            tool_call_id: part.toolCallId,
          });
        }
        break;
      }

      default: {
        const _exhaustiveCheck: never = role;
        console.error(
          "[ConvertMessages] ERROR: Unsupported role:",
          _exhaustiveCheck
        );
        console.error("[ConvertMessages] Unsupported role details:", {
          role: _exhaustiveCheck,
          messageIndex,
          timestamp: new Date().toISOString()
        });
        const error = new Error(`Unsupported role: ${_exhaustiveCheck}`);
        console.error("[ConvertMessages] Throwing Error:", {
          errorType: error.constructor.name,
          errorMessage: error.message
        });
        throw error;
      }
    }
    }

    console.log(
      "[ConvertMessages] Conversion complete. Total messages:",
      messages.length
    );
    console.log(
      "[ConvertMessages] Converted messages:",
      JSON.stringify(messages, null, 2)
    );
    console.log("[ConvertMessages] Conversion successful", {
      inputMessages: prompt.length,
      outputMessages: messages.length,
      timestamp: new Date().toISOString()
    });
    return messages;
  } catch (error) {
    console.error("[ConvertMessages] FATAL ERROR in convertToGatewayTransformMessages:", {
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      functionName: "convertToGatewayTransformMessages",
      messageIndex,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}
