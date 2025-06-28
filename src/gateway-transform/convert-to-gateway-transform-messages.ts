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
  console.log("[ConvertMessages] Input prompt structure:", {
    length: prompt.length,
    roles: prompt.map((msg, idx) => ({
      index: idx,
      role: msg.role,
      contentType: Array.isArray(msg.content) ? "array" : typeof msg.content,
    })),
    fullPrompt: prompt,
  });

  const messages: unknown[] = [];
  let messageIndex = 0;

  try {
    for (const { role, content } of prompt) {
      messageIndex++;
      console.log(
        "[ConvertMessages] Processing message",
        messageIndex,
        "details:",
        {
          messageIndex,
          role,
          contentType: Array.isArray(content) ? "array" : typeof content,
          contentLength: Array.isArray(content)
            ? content.length
            : typeof content === "string"
            ? content.length
            : "unknown",
          contentPreview: Array.isArray(content)
            ? content.map((p) => ({ type: p.type, hasData: !!p }))
            : content,
        }
      );

      switch (role) {
        case "system": {
          console.log("[ConvertMessages] System message details:", {
            role: "system",
            contentType: typeof content,
            contentLength:
              typeof content === "string" ? content.length : "unknown",
            content: content,
          });
          messages.push({ role: "system", content: content });
          break;
        }

        case "user": {
          console.log("[ConvertMessages] User message analysis:", {
            role: "user",
            contentLength: content.length,
            contentParts: content.map((part, idx) => ({
              index: idx,
              type: part.type,
              hasText: part.type === "text" ? !!part.text : false,
              textLength: part.type === "text" ? part.text?.length : 0,
              hasImage: part.type === "image" ? !!part.image : false,
              imageType:
                part.type === "image"
                  ? part.image instanceof URL
                    ? "URL"
                    : typeof part.image
                  : null,
            })),
          });

          // Check if content has mixed types (text + images)
          const hasImages = content.some((part) => part.type === "image");
          const hasText = content.some((part) => part.type === "text");

          console.log("[ConvertMessages] Content type analysis:", {
            hasImages,
            hasText,
            isMixed: hasImages && hasText,
            imageCount: content.filter((p) => p.type === "image").length,
            textCount: content.filter((p) => p.type === "text").length,
          });

          if (hasImages && hasText) {
            // Mixed content - create array format
            const contentArray = [];

            console.log(
              "[ConvertMessages] Processing mixed content (text + images)"
            );
            for (const part of content) {
              console.log("[ConvertMessages] Processing part:", {
                type: part.type,
                partData:
                  part.type === "text"
                    ? {
                        textLength: part.text?.length,
                        textPreview: part.text?.substring(0, 100),
                      }
                    : part.type === "image"
                    ? {
                        imageType:
                          part.image instanceof URL ? "URL" : typeof part.image,
                        isDataUrl:
                          typeof part.image === "string" &&
                          (part.image as string).startsWith("data:"),
                      }
                    : {},
              });

              switch (part.type) {
                case "text": {
                  console.log("[ConvertMessages] Adding text part details:", {
                    type: "text",
                    textLength: part.text.length,
                    textPreview:
                      part.text.substring(0, 200) +
                      (part.text.length > 200 ? "..." : ""),
                    fullText: part.text,
                  });
                  contentArray.push({ type: "text", text: part.text });
                  break;
                }
                case "image": {
                  console.log(
                    "[ConvertMessages] Processing image part details:",
                    {
                      type: "image",
                      imageInstanceType:
                        part.image instanceof URL ? "URL" : typeof part.image,
                      isUrl: part.image instanceof URL,
                      isString: typeof part.image === "string",
                      isUint8Array: part.image instanceof Uint8Array,
                      stringPreview:
                        typeof part.image === "string"
                          ? (part.image as string).substring(0, 100) + "..."
                          : null,
                      urlHref:
                        part.image instanceof URL ? part.image.href : null,
                    }
                  );

                  if (part.image instanceof URL) {
                    // External URL
                    console.log("[ConvertMessages] Adding image_url details:", {
                      type: "image_url",
                      url: part.image.href,
                      protocol: part.image.protocol,
                      hostname: part.image.hostname,
                    });
                    contentArray.push({
                      type: "image_url",
                      image_url: { url: part.image.href },
                    });
                  } else if (typeof part.image === "string") {
                    // Base64 encoded image or data URL
                    const imageString = part.image as string;
                    console.log(
                      "[ConvertMessages] Processing string image details:",
                      {
                        stringLength: imageString.length,
                        isDataUrl: imageString.startsWith("data:"),
                        dataUrlPrefix: imageString.startsWith("data:")
                          ? imageString.substring(0, 50) + "..."
                          : null,
                        stringPreview: imageString.substring(0, 100) + "...",
                      }
                    );

                    if (imageString.startsWith("data:")) {
                      // Already a data URL, use it as-is
                      console.log(
                        "[ConvertMessages] Using data URL as image_url:",
                        {
                          type: "image_url",
                          dataUrlLength: imageString.length,
                          dataUrlPrefix: imageString.substring(0, 50) + "...",
                        }
                      );
                      contentArray.push({
                        type: "image_url",
                        image_url: { url: imageString },
                      });
                    } else {
                      // Raw base64, wrap it in a data URL
                      // Default to JPEG if we can't determine the type
                      const dataUrl = `data:image/jpeg;base64,${imageString}`;
                      console.log(
                        "[ConvertMessages] Wrapping base64 in data URL:",
                        {
                          type: "image_url",
                          base64Length: imageString.length,
                          resultingDataUrlLength: dataUrl.length,
                          dataUrlPrefix: dataUrl.substring(0, 50) + "...",
                        }
                      );
                      contentArray.push({
                        type: "image_url",
                        image_url: { url: dataUrl },
                      });
                    }
                  } else {
                    // Handle Uint8Array by converting to base64
                    console.log(
                      "[ConvertMessages] Converting Uint8Array to base64:",
                      {
                        uint8ArrayLength: part.image.length,
                        byteLength: part.image.byteLength,
                        constructor: part.image.constructor.name,
                      }
                    );
                    const base64 = Buffer.from(part.image).toString("base64");
                    // Detect image type from Uint8Array if possible, default to PNG
                    let mimeType = "image/png";
                    if (part.mimeType) {
                      mimeType = part.mimeType;
                    }
                    const dataUrl = `data:${mimeType};base64,${base64}`;
                    console.log("[ConvertMessages] Conversion result:", {
                      resultingBase64Length: base64.length,
                      mimeType: mimeType,
                      dataUrlLength: dataUrl.length,
                      dataUrlPrefix: dataUrl.substring(0, 50) + "...",
                    });
                    contentArray.push({
                      type: "image_url",
                      image_url: { url: dataUrl },
                    });
                  }
                  break;
                }
                default: {
                  const _exhaustiveCheck: never = part;
                  console.error(
                    "[ConvertMessages] ERROR: Unsupported user part type details:",
                    {
                      unexpectedPart: _exhaustiveCheck,
                      partKeys: Object.keys(_exhaustiveCheck || {}),
                      messageIndex,
                      role: "user",
                    }
                  );
                  throw new Error(`Unsupported part type: ${_exhaustiveCheck}`);
                }
              }
            }

            console.log("[ConvertMessages] Final user content array details:", {
              arrayLength: contentArray.length,
              contentTypes: contentArray.map((item) => item.type),
              fullArray: contentArray,
            });
            messages.push({
              role: "user",
              content: contentArray,
            });
          } else if (hasText && !hasImages) {
            // Text only - use string format
            const textParts = content.filter((part) => part.type === "text");
            const textContent = textParts.map((part) => part.text).join("");

            console.log("[ConvertMessages] Text-only user message details:", {
              textPartsCount: textParts.length,
              totalTextLength: textContent.length,
              textPreview:
                textContent.substring(0, 200) +
                (textContent.length > 200 ? "..." : ""),
              fullTextContent: textContent,
            });
            messages.push({
              role: "user",
              content: textContent,
            });
          } else if (hasImages && !hasText) {
            // Images only - still need array format
            const contentArray = [];

            console.log("[ConvertMessages] Image-only user message processing");
            for (const part of content) {
              if (part.type === "image") {
                console.log("[ConvertMessages] Processing image-only part:", {
                  imageType:
                    part.image instanceof URL ? "URL" : typeof part.image,
                  imageData:
                    part.image instanceof URL
                      ? { href: part.image.href }
                      : typeof part.image === "string"
                      ? {
                          length: part.image.length,
                          preview: part.image.substring(0, 50),
                        }
                      : {
                          type: part.image.constructor.name,
                          length: part.image.length,
                        },
                });

                if (part.image instanceof URL) {
                  contentArray.push({
                    type: "image_url",
                    image_url: { url: part.image.href },
                  });
                } else if (typeof part.image === "string") {
                  if (part.image.startsWith("data:")) {
                    // Already a data URL, use it as-is
                    contentArray.push({
                      type: "image_url",
                      image_url: { url: part.image },
                    });
                  } else {
                    // Raw base64, wrap it in a data URL
                    const dataUrl = `data:image/jpeg;base64,${part.image}`;
                    contentArray.push({
                      type: "image_url",
                      image_url: { url: dataUrl },
                    });
                  }
                } else {
                  // Handle Uint8Array
                  const base64 = Buffer.from(part.image).toString("base64");
                  const mimeType = part.mimeType || "image/png";
                  const dataUrl = `data:${mimeType};base64,${base64}`;
                  contentArray.push({
                    type: "image_url",
                    image_url: { url: dataUrl },
                  });
                }
              }
            }

            console.log("[ConvertMessages] Image-only content array:", {
              arrayLength: contentArray.length,
              imageTypes: contentArray.map((item) => item.type),
              fullArray: contentArray,
            });
            messages.push({
              role: "user",
              content: contentArray,
            });
          }
          break;
        }

        case "assistant": {
          console.log("[ConvertMessages] Assistant message details:", {
            role: "assistant",
            contentLength: content.length,
            contentParts: content.map((part, idx) => ({
              index: idx,
              type: part.type,
              hasText: part.type === "text" ? !!part.text : false,
              textLength: part.type === "text" ? part.text?.length : 0,
              isToolCall: part.type === "tool-call",
              toolName: part.type === "tool-call" ? part.toolName : null,
              toolCallId: part.type === "tool-call" ? part.toolCallId : null,
            })),
          });

          let text = "";
          const toolCalls: any[] = [];

          for (const part of content) {
            console.log(
              "[ConvertMessages] Processing assistant part details:",
              {
                type: part.type,
                partIndex: content.indexOf(part),
                partData:
                  part.type === "text"
                    ? { textLength: part.text?.length }
                    : part.type === "tool-call"
                    ? {
                        toolName: part.toolName,
                        toolCallId: part.toolCallId,
                        argsKeys: Object.keys(part.args || {}),
                      }
                    : {},
              }
            );

            switch (part.type) {
              case "text": {
                console.log("[ConvertMessages] Assistant text details:", {
                  textLength: part.text.length,
                  textPreview:
                    part.text.substring(0, 200) +
                    (part.text.length > 200 ? "..." : ""),
                  currentTotalTextLength: text.length,
                  newTotalTextLength: text.length + part.text.length,
                });
                text += part.text;
                break;
              }
              case "tool-call": {
                console.log("[ConvertMessages] Tool call details:", {
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  argsType: typeof part.args,
                  argsKeys: Object.keys(part.args || {}),
                  argsStringified: JSON.stringify(part.args),
                  fullToolCall: {
                    id: part.toolCallId,
                    name: part.toolName,
                    args: part.args,
                  },
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
                  "[ConvertMessages] ERROR: Unsupported assistant part type details:",
                  {
                    unexpectedPart: _exhaustiveCheck,
                    partKeys: Object.keys(_exhaustiveCheck || {}),
                    messageIndex,
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                  }
                );
                const error = new Error(
                  `Unsupported part type: ${_exhaustiveCheck}`
                );
                console.error("[ConvertMessages] Throwing Error details:", {
                  errorType: error.constructor.name,
                  errorMessage: error.message,
                  errorStack: error.stack,
                });
                throw error;
              }
            }
          }

          console.log("[ConvertMessages] Assistant final processing details:", {
            finalTextLength: text.length,
            finalText: text,
            toolCallsCount: toolCalls.length,
            toolCallIds: toolCalls.map((tc) => tc.id),
            toolCallNames: toolCalls.map((tc) => tc.function.name),
            fullToolCalls: toolCalls,
          });

          const assistantMessage = {
            role: "assistant",
            content: text,
            ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
          };

          console.log(
            "[ConvertMessages] Assistant message being added:",
            assistantMessage
          );
          messages.push(assistantMessage);
          break;
        }

        case "tool": {
          console.log("[ConvertMessages] Tool message details:", {
            role: "tool",
            contentLength: content.length,
            contentParts: content.map((part, idx) => ({
              index: idx,
              type: part.type,
              isToolResult: part.type === "tool-result",
              toolCallId: part.type === "tool-result" ? part.toolCallId : null,
              resultType:
                part.type === "tool-result" ? typeof part.result : null,
            })),
          });

          for (const part of content) {
            console.log("[ConvertMessages] Processing tool part details:", {
              type: part.type,
              partIndex: content.indexOf(part),
              isToolResult: part.type === "tool-result",
            });

            if (part.type !== "tool-result") {
              console.error(
                "[ConvertMessages] ERROR: Unsupported tool part type details:",
                {
                  partType: part.type,
                  partKeys: Object.keys(part || {}),
                  messageIndex,
                  role: "tool",
                  timestamp: new Date().toISOString(),
                }
              );
              const error = new UnsupportedFunctionalityError({
                functionality: `${part.type}-part`,
              });
              console.error(
                "[ConvertMessages] Throwing UnsupportedFunctionalityError details:",
                {
                  errorType: error.constructor.name,
                  errorMessage: error.message,
                  functionality: `${part.type}-part`,
                }
              );
              throw error;
            }

            console.log("[ConvertMessages] Tool result details:", {
              toolCallId: part.toolCallId,
              resultType: typeof part.result,
              resultKeys:
                typeof part.result === "object" && part.result
                  ? Object.keys(part.result)
                  : null,
              resultStringified: JSON.stringify(part.result),
              resultPreview:
                typeof part.result === "string"
                  ? part.result.substring(0, 200) +
                    (part.result.length > 200 ? "..." : "")
                  : null,
              fullResult: part.result,
            });

            const toolMessage = {
              role: "tool",
              content: JSON.stringify(part.result),
              tool_call_id: part.toolCallId,
            };

            console.log(
              "[ConvertMessages] Tool message being added:",
              toolMessage
            );
            messages.push(toolMessage);
          }
          break;
        }

        default: {
          const _exhaustiveCheck: never = role;
          console.error("[ConvertMessages] ERROR: Unsupported role details:", {
            unexpectedRole: _exhaustiveCheck,
            messageIndex,
            timestamp: new Date().toISOString(),
            messageContent: content,
          });
          const error = new Error(`Unsupported role: ${_exhaustiveCheck}`);
          console.error("[ConvertMessages] Throwing Error details:", {
            errorType: error.constructor.name,
            errorMessage: error.message,
            errorStack: error.stack,
          });
          throw error;
        }
      }
    }

    console.log("[ConvertMessages] Conversion complete details:", {
      totalInputMessages: prompt.length,
      totalOutputMessages: messages.length,
      messageRoles: messages.map((msg: any, idx) => ({
        index: idx,
        role: msg.role,
        hasToolCalls: !!msg.tool_calls,
      })),
      finalMessages: messages,
      conversionSummary: {
        inputMessages: prompt.length,
        outputMessages: messages.length,
        timestamp: new Date().toISOString(),
      },
    });

    return messages;
  } catch (error) {
    console.error(
      "[ConvertMessages] FATAL ERROR in convertToGatewayTransformMessages:",
      {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        functionName: "convertToGatewayTransformMessages",
        messageIndex,
        timestamp: new Date().toISOString(),
        errorDetails: error,
      }
    );
    throw error;
  }
}
