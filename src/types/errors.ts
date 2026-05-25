import "zod-openapi";
import { z } from "zod";

export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().meta({
        description: "Stable application error code.",
        example: "CAMPFIRE_NOT_FOUND",
      }),
      message: z.string().meta({
        description: "Human-readable error message.",
        example: "Campfire not found",
      }),
      requestId: z.string().optional().meta({
        description: "Optional request identifier for support and log correlation.",
        example: "8f43b0f0-1a6f-4f0d-b2f1-ff2c8bfe3c6b",
      }),
    }),
  })
  .meta({
    id: "ErrorResponse",
    description: "Standard error response returned by the API.",
  });

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export class AppError extends Error {
  public readonly isOperational = true;

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code = "FORBIDDEN") {
    super(message, 403, code);
  }
}
