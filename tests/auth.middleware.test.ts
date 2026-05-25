import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { auth, setAuthDriverForTesting } from "../src/middleware/auth.middleware";
import { errorMiddleware } from "../src/middleware/error.middleware";
import { requestIdMiddleware } from "../src/middleware/request-id.middleware";
import { ParkRole } from "../src/types/auth";

const buildTestApp = (middleware = auth()) => {
  const app = express();

  app.use(requestIdMiddleware);
  app.get("/protected", middleware, (req, res) => {
    res.status(200).json({ actorId: req.actor?.id, roles: req.actor?.roles });
  });
  app.use(errorMiddleware);

  return app;
};

describe("auth middleware", () => {
  afterEach(() => {
    setAuthDriverForTesting(undefined);
  });

  it("allows any authenticated park staff member with auth()", async () => {
    setAuthDriverForTesting({
      verifyToken: vi.fn().mockResolvedValue({
        id: "park-staff-1",
        username: "casey.ranger",
        roles: [ParkRole.RANGER],
        groups: [ParkRole.RANGER],
        claims: {},
      }),
    });

    const response = await request(buildTestApp())
      .get("/protected")
      .set("Authorization", "Bearer test-token")
      .expect(200);

    expect(response.body).toEqual({
      actorId: "park-staff-1",
      roles: [ParkRole.RANGER],
    });
  });

  it("rejects requests without a bearer token", async () => {
    const response = await request(buildTestApp()).get("/protected").expect(401);

    expect(response.body.error.code).toBe("AUTH_REQUIRED");
    expect(response.body.error.requestId).toBeDefined();
  });

  it("rejects authenticated users without an allowed role", async () => {
    setAuthDriverForTesting({
      verifyToken: vi.fn().mockResolvedValue({
        id: "park-staff-2",
        username: "sam.ranger",
        roles: [ParkRole.RANGER],
        groups: [ParkRole.RANGER],
        claims: {},
      }),
    });

    const response = await request(buildTestApp(auth(ParkRole.PARK_ADMIN)))
      .get("/protected")
      .set("Authorization", "Bearer test-token")
      .expect(403);

    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });
});
