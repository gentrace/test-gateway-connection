import {
  LanguageModelV1Prompt,
  UnsupportedFunctionalityError,
} from "@ai-sdk/provider";

export function convertToGatewayTransformMessages(
  prompt: LanguageModelV1Prompt
): unknown[] {
  console.log("[ConvertMessages] Starting message conversion...");
  console.log("[ConvertMessages] Input prompt length:", prompt.length);

  const messages: unknown[] = [];

  for (const { role, content } of prompt) {
    console.log("[ConvertMessages] Processing message with role:", role);

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
                // Handle image parts if needed
                throw new UnsupportedFunctionalityError({
                  functionality: "image-part",
                });
              }
              default: {
                const _exhaustiveCheck: never = part;
                console.error(
                  "[ConvertMessages] ERROR: Unsupported part type:",
                  _exhaustiveCheck
                );
                throw new Error(`Unsupported part type: ${_exhaustiveCheck}`);
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
              throw new Error(`Unsupported part type: ${_exhaustiveCheck}`);
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
            throw new UnsupportedFunctionalityError({
              functionality: `${part.type}-part`,
            });
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
        throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
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
  return messages;
}
