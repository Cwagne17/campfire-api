import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { logger } from "../config/logger";
import {
  AppError,
  BadRequestError,
  ErrorResponseSchema,
  type ErrorResponse,
} from "../types/errors";

interface HttpBodyParserError extends Error {
  status?: number;
  type?: string;
}

const isBodyParserError = (error: unknown): error is HttpBodyParserError => {
  return (
    error instanceof Error &&
    typeof (error as HttpBodyParserError).status === "number" &&
    (error as HttpBodyParserError).type === "entity.parse.failed"
  );
};

const toErrorResponse = (error: AppError, requestId?: string): ErrorResponse => {
  return ErrorResponseSchema.parse({
    error: {
      code: error.code,
      message: error.message,
      ...(requestId ? { requestId } : {}),
    },
  });
};

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json(toErrorResponse(error, req.requestId));
    return;
  }

  if (isBodyParserError(error)) {
    const badRequest = new BadRequestError("Invalid JSON request body", "BAD_REQUEST");
    res.status(400).json(toErrorResponse(badRequest, req.requestId));
    return;
  }

  if (error instanceof ZodError) {
    const badRequest = new BadRequestError("Request validation failed", "VALIDATION_FAILED");
    res.status(400).json(toErrorResponse(badRequest, req.requestId));
    return;
  }

  logger.error({ err: error, requestId: req.requestId }, "Unhandled request error");

  const internalError = new AppError("Internal server error", 500, "INTERNAL_SERVER_ERROR");
  res.status(500).json(toErrorResponse(internalError, req.requestId));
};
