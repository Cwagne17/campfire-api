import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from "vitest";

import { setAuthDriverForTesting } from "../src/middleware/auth.middleware";
import { errorMiddleware } from "../src/middleware/error.middleware";
import { CampfireRouteHandler } from "../src/modules/campfires/campfire.routehandler";
import type { ICampfireService } from "../src/modules/campfires/campfire.service";
import type { CampfireResponse } from "../src/modules/campfires/campfire.types";
import { ParkRole } from "../src/types/auth";

const campfireId = "6654f3c7f6c9a3d0dfb3b4b1";

const validCampfireResponse: CampfireResponse = {
  id: campfireId,
  name: "North Ridge Fire",
  location: "Pine Hollow Campground",
  logCount: 3,
  status: "unlit",
  createdAt: "2026-05-25T12:00:00.000Z",
  updatedAt: "2026-05-25T12:00:00.000Z",
};

const authHeader = { Authorization: "Bearer test-token" };

const createServiceMock = (): Mocked<ICampfireService> => ({
  createCampfire: vi.fn(),
  listCampfires: vi.fn(),
  getCampfire: vi.fn(),
  updateCampfire: vi.fn(),
  deleteCampfire: vi.fn(),
  addLogs: vi.fn(),
  removeLogs: vi.fn(),
  igniteCampfire: vi.fn(),
  extinguishCampfire: vi.fn(),
});

const buildTestApp = (service: ICampfireService) => {
  const app = express();

  app.use((req, res, next) => {
    req.requestId = "test-request-id";
    res.setHeader("x-request-id", req.requestId);
    next();
  });

  app.use(express.json());
  app.use("/api", CampfireRouteHandler.build(service));
  app.use(errorMiddleware);

  return app;
};

describe("CampfireRouteHandler", () => {
  beforeEach(() => {
    setAuthDriverForTesting({
      verifyToken: vi.fn().mockResolvedValue({
        id: "park-staff-1",
        username: "casey.ranger",
        roles: [ParkRole.LEAD_RANGER],
        groups: [ParkRole.LEAD_RANGER],
        claims: {},
      }),
    });
  });

  afterEach(() => {
    setAuthDriverForTesting(undefined);
  });

  it("creates a campfire after request validation succeeds", async () => {
    const service = createServiceMock();
    service.createCampfire.mockResolvedValue(validCampfireResponse);

    const response = await request(buildTestApp(service))
      .post("/api/campfires")
      .set(authHeader)
      .send({
        name: "North Ridge Fire",
        location: "Pine Hollow Campground",
        logCount: 3,
        status: "unlit",
      })
      .expect(201);

    expect(response.body).toEqual(validCampfireResponse);
    expect(service.createCampfire).toHaveBeenCalledWith({
      name: "North Ridge Fire",
      location: "Pine Hollow Campground",
      logCount: 3,
      status: "unlit",
    });
  });

  it("rejects invalid request input before calling the service", async () => {
    const service = createServiceMock();

    const response = await request(buildTestApp(service))
      .post("/api/campfires")
      .set(authHeader)
      .send({
        name: "North Ridge Fire",
        location: "Pine Hollow Campground",
        logCount: -1,
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.error.requestId).toBe("test-request-id");
    expect(service.createCampfire).not.toHaveBeenCalled();
  });

  it("validates response shape before sending JSON", async () => {
    const service = createServiceMock();
    service.getCampfire.mockResolvedValue({
      id: campfireId,
      name: "North Ridge Fire",
      logCount: 3,
      status: "unlit",
      createdAt: "2026-05-25T12:00:00.000Z",
      updatedAt: "2026-05-25T12:00:00.000Z",
    } as unknown as CampfireResponse);

    const response = await request(buildTestApp(service))
      .get(`/api/campfires/${campfireId}`)
      .set(authHeader)
      .expect(500);

    expect(response.body).toEqual({
      error: {
        code: "RESPONSE_VALIDATION_FAILED",
        message: "Response validation failed",
        requestId: "test-request-id",
      },
    });
  });

  it("rejects role-gated routes before calling the service", async () => {
    setAuthDriverForTesting({
      verifyToken: vi.fn().mockResolvedValue({
        id: "park-staff-2",
        username: "sam.ranger",
        roles: [ParkRole.RANGER],
        groups: [ParkRole.RANGER],
        claims: {},
      }),
    });
    const service = createServiceMock();

    const response = await request(buildTestApp(service))
      .delete(`/api/campfires/${campfireId}`)
      .set(authHeader)
      .expect(403);

    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
    expect(service.deleteCampfire).not.toHaveBeenCalled();
  });
});
