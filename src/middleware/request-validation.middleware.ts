import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodType } from "zod";

import { BadRequestError } from "../types/errors";

interface RequestValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

const summarizeIssues = (error: ZodError): string => {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "request";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
};

const parseRequestPart = (
  schema: ZodType | undefined,
  value: unknown,
  assign: (parsed: unknown) => void,
): void => {
  if (!schema) {
    return;
  }

  assign(schema.parse(value));
};

export const validate = (schemas: RequestValidationSchemas): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      parseRequestPart(schemas.params, req.params, (parsed) => {
        req.params = parsed as Request["params"];
      });

      parseRequestPart(schemas.query, req.query, (parsed) => {
        req.query = parsed as Request["query"];
      });

      parseRequestPart(schemas.body, req.body, (parsed) => {
        req.body = parsed;
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new BadRequestError(
            `Request validation failed: ${summarizeIssues(error)}`,
            "VALIDATION_FAILED",
          ),
        );
        return;
      }

      next(error);
    }
  };
};
