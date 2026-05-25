import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from "vitest";

import { setAuthDriverForTesting } from "../src/middleware/auth.middleware";
import { errorMiddleware } from "../src/middleware/error.middleware";
import { CampfireLocation } from "../src/models/campfire.model";
import { CampfireRouteHandler } from "../src/modules/campfires/campfire.routehandler";
import type { ICampfireService } from "../src/modules/campfires/campfire.service";
import type { CampfireResponse } from "../src/modules/campfires/campfire.types";
import { ParkRole } from "../src/types/auth";

const campfireId = "6654f3c7f6c9a3d0dfb3b4b1";

const validCampfireResponse: CampfireResponse = {
  id: campfireId,
  name: "North Ridge Fire",
  location: CampfireLocation.YOSEMITE,
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
        location: CampfireLocation.YOSEMITE,
        logCount: 3,
        status: "unlit",
      })
      .expect(201);

    expect(response.body).toEqual(validCampfireResponse);
    expect(service.createCampfire).toHaveBeenCalledWith({
      name: "North Ridge Fire",
      location: CampfireLocation.YOSEMITE,
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
        location: CampfireLocation.YOSEMITE,
        logCount: -1,
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.error.requestId).toBe("test-request-id");
    expect(service.createCampfire).not.toHaveBeenCalled();
  });

  it("rejects an invalid campfire location before calling the service", async () => {
    const service = createServiceMock();

    const response = await request(buildTestApp(service))
      .post("/api/campfires")
      .set(authHeader)
      .send({
        name: "North Ridge Fire",
        location: "pine-hollow",
        logCount: 3,
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(service.createCampfire).not.toHaveBeenCalled();
  });

  it("passes validated location filters to the service", async () => {
    const service = createServiceMock();
    service.listCampfires.mockResolvedValue({
      data: [validCampfireResponse],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const response = await request(buildTestApp(service))
      .get(`/api/campfires?location=${CampfireLocation.YOSEMITE}`)
      .set(authHeader)
      .expect(200);

    expect(response.body.data[0].location).toBe(CampfireLocation.YOSEMITE);
    expect(service.listCampfires).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      location: CampfireLocation.YOSEMITE,
    });
  });

  it("updates a campfire location after validation succeeds", async () => {
    const service = createServiceMock();
    const updatedCampfire = {
      ...validCampfireResponse,
      location: CampfireLocation.OLYMPIC,
    };
    service.updateCampfire.mockResolvedValue(updatedCampfire);

    const response = await request(buildTestApp(service))
      .patch(`/api/campfires/${campfireId}`)
      .set(authHeader)
      .send({ location: CampfireLocation.OLYMPIC })
      .expect(200);

    expect(response.body.location).toBe(CampfireLocation.OLYMPIC);
    expect(service.updateCampfire).toHaveBeenCalledWith(campfireId, {
      location: CampfireLocation.OLYMPIC,
    });
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
