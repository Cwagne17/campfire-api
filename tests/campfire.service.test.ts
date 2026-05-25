import { Types } from "mongoose";
import { describe, expect, it, vi, type Mocked } from "vitest";

import type { ICampfireDatastore } from "../src/datastores/campfire.datastore";
import { CampfireLocation, type CampfireRecord } from "../src/models/campfire.model";
import { CampfireService } from "../src/modules/campfires/campfire.service";

const campfireId = "6654f3c7f6c9a3d0dfb3b4b1";
const now = new Date("2026-05-25T12:00:00.000Z");

const createRecord = (overrides: Partial<CampfireRecord> = {}): CampfireRecord =>
  ({
    _id: new Types.ObjectId(campfireId),
    name: "North Ridge Fire",
    location: CampfireLocation.YOSEMITE,
    logCount: 3,
    status: "unlit",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }) as CampfireRecord;

const createDatastoreMock = (): Mocked<ICampfireDatastore> => ({
  create: vi.fn(),
  findMany: vi.fn(),
  findById: vi.fn(),
  updateById: vi.fn(),
  deleteById: vi.fn(),
});

describe("CampfireService", () => {
  it("uses the datastore interface and maps persistence records into API responses", async () => {
    const datastore = createDatastoreMock();
    datastore.findById.mockResolvedValue(createRecord());
    const service = new CampfireService(datastore);

    const result = await service.getCampfire(campfireId);

    expect(datastore.findById).toHaveBeenCalledWith(campfireId);
    expect(result).toEqual({
      id: campfireId,
      name: "North Ridge Fire",
      location: CampfireLocation.YOSEMITE,
      logCount: 3,
      status: "unlit",
      createdAt: "2026-05-25T12:00:00.000Z",
      updatedAt: "2026-05-25T12:00:00.000Z",
    });
    expect("_id" in result).toBe(false);
  });

  it("rejects creating a burning campfire with 0 logs", async () => {
    const service = new CampfireService(createDatastoreMock());

    await expect(
      service.createCampfire({
        name: "Trailhead Fire",
        location: CampfireLocation.GLACIER,
        logCount: 0,
        status: "burning",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CAMPFIRE_CONFLICT",
    });
  });

  it("rejects igniting a campfire with 0 logs", async () => {
    const datastore = createDatastoreMock();
    datastore.findById.mockResolvedValue(createRecord({ logCount: 0 }));
    const service = new CampfireService(datastore);

    await expect(service.igniteCampfire(campfireId)).rejects.toMatchObject({
      statusCode: 409,
      code: "CAMPFIRE_CONFLICT",
    });
    expect(datastore.updateById).not.toHaveBeenCalled();
  });

  it("passes location filters to the datastore", async () => {
    const datastore = createDatastoreMock();
    datastore.findMany.mockResolvedValue({
      records: [createRecord({ location: CampfireLocation.ZION })],
      total: 1,
    });
    const service = new CampfireService(datastore);

    const result = await service.listCampfires({
      page: 1,
      limit: 20,
      location: CampfireLocation.ZION,
    });

    expect(datastore.findMany).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      location: CampfireLocation.ZION,
    });
    expect(result.data[0]?.location).toBe(CampfireLocation.ZION);
  });

  it("rejects adding logs to an extinguished campfire", async () => {
    const datastore = createDatastoreMock();
    datastore.findById.mockResolvedValue(createRecord({ status: "extinguished" }));
    const service = new CampfireService(datastore);

    await expect(service.addLogs(campfireId, { count: 1 })).rejects.toMatchObject({
      statusCode: 409,
      code: "CAMPFIRE_CONFLICT",
    });
    expect(datastore.updateById).not.toHaveBeenCalled();
  });

  it("rejects adding logs beyond the maximum log count", async () => {
    const datastore = createDatastoreMock();
    datastore.findById.mockResolvedValue(createRecord({ logCount: 10 }));
    const service = new CampfireService(datastore);

    await expect(service.addLogs(campfireId, { count: 1 })).rejects.toMatchObject({
      statusCode: 409,
      code: "CAMPFIRE_CONFLICT",
    });
    expect(datastore.updateById).not.toHaveBeenCalled();
  });

  it("rejects removing logs below 0", async () => {
    const datastore = createDatastoreMock();
    datastore.findById.mockResolvedValue(createRecord({ logCount: 1 }));
    const service = new CampfireService(datastore);

    await expect(service.removeLogs(campfireId, { count: 2 })).rejects.toMatchObject({
      statusCode: 409,
      code: "CAMPFIRE_CONFLICT",
    });
    expect(datastore.updateById).not.toHaveBeenCalled();
  });

  it("sets status to unlit when removing the final logs", async () => {
    const datastore = createDatastoreMock();
    datastore.findById.mockResolvedValue(createRecord({ logCount: 2, status: "burning" }));
    datastore.updateById.mockResolvedValue(createRecord({ logCount: 0, status: "unlit" }));
    const service = new CampfireService(datastore);

    const result = await service.removeLogs(campfireId, { count: 2 });

    expect(datastore.updateById).toHaveBeenCalledWith(campfireId, {
      logCount: 0,
      status: "unlit",
    });
    expect(result.status).toBe("unlit");
    expect(result.logCount).toBe(0);
  });
});
