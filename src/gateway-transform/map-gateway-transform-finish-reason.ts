import { LanguageModelV1FinishReason } from '@ai-sdk/provider';

export function mapGatewayTransformFinishReason(
  finishReason: string | null | undefined,
): LanguageModelV1FinishReason {
  console.log('[MapFinishReason] Mapping finish reason:', finishReason);
  
  let mapped: LanguageModelV1FinishReason;
  
  switch (finishReason) {
    case 'stop':
      mapped = 'stop';
      break;
    case 'length':
    case 'max_tokens':
      mapped = 'length';
      break;
    case 'content_filter':
      mapped = 'content-filter';
      break;
    case 'tool_calls':
    case 'function_call':
      mapped = 'tool-calls';
      break;
    default:
      console.warn('[MapFinishReason] Unknown finish reason:', finishReason);
      mapped = 'unknown';
      break;
  }
  
  console.log('[MapFinishReason] Mapped to:', mapped);
  return mapped;
}