import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { errorMiddleware } from "../src/middleware/error.middleware";
import { NotFoundError } from "../src/types/errors";
import { ErrorResponseSchema } from "../src/types/errors";

const buildTestApp = (routeError: Error) => {
  const app = express();

  app.use((req, _res, next) => {
    req.requestId = "test-request-id";
    next();
  });

  app.get("/error", (_req, _res, next) => {
    next(routeError);
  });

  app.use(errorMiddleware);

  return app;
};

describe("errorMiddleware", () => {
  it("returns the documented shape for typed application errors", async () => {
    const response = await request(
      buildTestApp(new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND")),
    )
      .get("/error")
      .expect(404);

    expect(ErrorResponseSchema.parse(response.body)).toEqual({
      error: {
        code: "CAMPFIRE_NOT_FOUND",
        message: "Campfire not found",
        requestId: "test-request-id",
      },
    });
  });

  it("returns the documented shape for unexpected errors", async () => {
    const response = await request(buildTestApp(new Error("database unavailable")))
      .get("/error")
      .expect(500);

    expect(ErrorResponseSchema.parse(response.body)).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        requestId: "test-request-id",
      },
    });
  });
});
