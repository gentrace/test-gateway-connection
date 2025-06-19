import { LanguageModelV1FinishReason } from '@ai-sdk/provider';

export function mapGatewayTransformFinishReason(
  finishReason: string | null | undefined,
): LanguageModelV1FinishReason {
  console.log('[MapFinishReason] Function: mapGatewayTransformFinishReason');
  console.log('[MapFinishReason] Input finish reason:', finishReason);
  console.log('[MapFinishReason] Input type:', typeof finishReason);
  console.log('[MapFinishReason] Is null:', finishReason === null);
  console.log('[MapFinishReason] Is undefined:', finishReason === undefined);
  console.log('[MapFinishReason] Timestamp:', new Date().toISOString());
  
  let mapped: LanguageModelV1FinishReason;
  
  try {
    switch (finishReason) {
      case 'stop':
        console.log('[MapFinishReason] Matched: stop');
        mapped = 'stop';
        break;
      case 'length':
      case 'max_tokens':
        console.log('[MapFinishReason] Matched: length/max_tokens');
        mapped = 'length';
        break;
      case 'content_filter':
        console.log('[MapFinishReason] Matched: content_filter');
        mapped = 'content-filter';
        break;
      case 'tool_calls':
      case 'function_call':
        console.log('[MapFinishReason] Matched: tool_calls/function_call');
        mapped = 'tool-calls';
        break;
      case null:
      case undefined:
        console.warn('[MapFinishReason] WARNING: Finish reason is null or undefined');
        console.warn('[MapFinishReason] Defaulting to "unknown"');
        mapped = 'unknown';
        break;
      default:
        console.warn('[MapFinishReason] WARNING: Unknown finish reason:', finishReason);
        console.warn('[MapFinishReason] Finish reason details:', {
          value: finishReason,
          type: typeof finishReason,
          length: finishReason?.length,
          timestamp: new Date().toISOString()
        });
        console.warn('[MapFinishReason] Defaulting to "unknown"');
        console.warn('[MapFinishReason] Known finish reasons: stop, length, max_tokens, content_filter, tool_calls, function_call');
        mapped = 'unknown';
        break;
    }
    
    console.log('[MapFinishReason] Successfully mapped to:', mapped);
    console.log('[MapFinishReason] Mapping complete:', {
      input: finishReason,
      output: mapped,
      timestamp: new Date().toISOString()
    });
    return mapped;
  } catch (error) {
    console.error('[MapFinishReason] ERROR in mapGatewayTransformFinishReason:', {
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      finishReason,
      timestamp: new Date().toISOString()
    });
    console.error('[MapFinishReason] Defaulting to "unknown" due to error');
    return 'unknown';
  }
}