import { createJsonErrorResponseHandler } from "@ai-sdk/provider-utils";
import { z } from "zod";

export const gatewayTransformErrorDataSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    code: z.string().nullable().optional(),
  }),
});

export type GatewayTransformErrorData = z.infer<
  typeof gatewayTransformErrorDataSchema
>;

export const gatewayTransformFailedResponseHandler: Parameters<
  typeof createJsonErrorResponseHandler
>[0] extends infer Config
  ? Config extends { errorSchema: infer Schema }
    ? ReturnType<typeof createJsonErrorResponseHandler<Schema>>
    : never
  : never = createJsonErrorResponseHandler({
  errorSchema: gatewayTransformErrorDataSchema,
  errorToMessage: (data) => {
    console.error("[GatewayTransformError] Error response data:", JSON.stringify(data, null, 2));
    return data.error.message;
  },
});
