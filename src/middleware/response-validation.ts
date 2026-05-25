import { type ZodType } from "zod";

import { AppError } from "../types/errors";

export const validateResponse = <T>(schema: ZodType<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new AppError("Response validation failed", 500, "RESPONSE_VALIDATION_FAILED");
  }

  return result.data;
};
