import { CampfireDatastore, type ICampfireDatastore } from "../../datastores/campfire.datastore";
import type { CampfireRecord } from "../../models/campfire.model";
import { ConflictError, NotFoundError } from "../../types/errors";
import {
  CampfireListResponseSchema,
  CampfireResponseSchema,
  DeleteCampfireResponseSchema,
  type CampfireListResponse,
  type CampfireResponse,
  type CreateCampfireRequest,
  type DeleteCampfireResponse,
  type ListCampfiresQuery,
  type LogMutationRequest,
  type UpdateCampfireRequest,
} from "./campfire.types";

export interface ICampfireService {
  createCampfire(input: CreateCampfireRequest): Promise<CampfireResponse>;
  listCampfires(query: ListCampfiresQuery): Promise<CampfireListResponse>;
  getCampfire(campfireId: string): Promise<CampfireResponse>;
  updateCampfire(campfireId: string, input: UpdateCampfireRequest): Promise<CampfireResponse>;
  deleteCampfire(campfireId: string): Promise<DeleteCampfireResponse>;
  addLogs(campfireId: string, input: LogMutationRequest): Promise<CampfireResponse>;
  removeLogs(campfireId: string, input: LogMutationRequest): Promise<CampfireResponse>;
  igniteCampfire(campfireId: string): Promise<CampfireResponse>;
  extinguishCampfire(campfireId: string): Promise<CampfireResponse>;
}

export class CampfireService implements ICampfireService {
  constructor(private readonly campfireDatastore: ICampfireDatastore) {}

  public static build(): ICampfireService {
    return new CampfireService(CampfireDatastore.build());
  }

  async createCampfire(input: CreateCampfireRequest): Promise<CampfireResponse> {
    if (input.status === "burning" && input.logCount === 0) {
      throw new ConflictError("A campfire cannot be ignited with 0 logs", "CAMPFIRE_CONFLICT");
    }

    const campfire = await this.campfireDatastore.create(input);
    return CampfireResponseSchema.parse(this.toCampfireResponse(campfire));
  }

  async listCampfires(query: ListCampfiresQuery): Promise<CampfireListResponse> {
    const result = await this.campfireDatastore.findMany(query);
    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

    return CampfireListResponseSchema.parse({
      data: result.records.map((campfire) => this.toCampfireResponse(campfire)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages,
      },
    });
  }

  async getCampfire(campfireId: string): Promise<CampfireResponse> {
    const campfire = await this.requireCampfire(campfireId);
    return CampfireResponseSchema.parse(this.toCampfireResponse(campfire));
  }

  async updateCampfire(
    campfireId: string,
    input: UpdateCampfireRequest,
  ): Promise<CampfireResponse> {
    const campfire = await this.requireCampfire(campfireId);

    if (input.status === "burning" && campfire.logCount === 0) {
      throw new ConflictError("A campfire cannot be ignited with 0 logs", "CAMPFIRE_CONFLICT");
    }

    const updated = await this.campfireDatastore.updateById(campfireId, input);

    if (!updated) {
      throw new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND");
    }

    return CampfireResponseSchema.parse(this.toCampfireResponse(updated));
  }

  async deleteCampfire(campfireId: string): Promise<DeleteCampfireResponse> {
    const deleted = await this.campfireDatastore.deleteById(campfireId);

    if (!deleted) {
      throw new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND");
    }

    return DeleteCampfireResponseSchema.parse({
      id: deleted._id.toString(),
      deleted: true,
    });
  }

  async addLogs(campfireId: string, input: LogMutationRequest): Promise<CampfireResponse> {
    const campfire = await this.requireCampfire(campfireId);

    if (campfire.status === "extinguished") {
      throw new ConflictError(
        "Logs cannot be added to an extinguished campfire",
        "CAMPFIRE_CONFLICT",
      );
    }

    const nextLogCount = campfire.logCount + input.count;
    this.ensureLogCountWithinBounds(nextLogCount);

    const updated = await this.campfireDatastore.updateById(campfireId, {
      logCount: nextLogCount,
    });

    if (!updated) {
      throw new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND");
    }

    return CampfireResponseSchema.parse(this.toCampfireResponse(updated));
  }

  async removeLogs(campfireId: string, input: LogMutationRequest): Promise<CampfireResponse> {
    const campfire = await this.requireCampfire(campfireId);
    const nextLogCount = campfire.logCount - input.count;

    if (nextLogCount < 0) {
      throw new ConflictError("Removing logs cannot reduce logCount below 0", "CAMPFIRE_CONFLICT");
    }

    const updated = await this.campfireDatastore.updateById(campfireId, {
      logCount: nextLogCount,
      ...(nextLogCount === 0 ? { status: "unlit" } : {}),
    });

    if (!updated) {
      throw new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND");
    }

    return CampfireResponseSchema.parse(this.toCampfireResponse(updated));
  }

  async igniteCampfire(campfireId: string): Promise<CampfireResponse> {
    const campfire = await this.requireCampfire(campfireId);

    if (campfire.logCount === 0) {
      throw new ConflictError("A campfire cannot be ignited with 0 logs", "CAMPFIRE_CONFLICT");
    }

    const updated = await this.campfireDatastore.updateById(campfireId, {
      status: "burning",
    });

    if (!updated) {
      throw new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND");
    }

    return CampfireResponseSchema.parse(this.toCampfireResponse(updated));
  }

  async extinguishCampfire(campfireId: string): Promise<CampfireResponse> {
    await this.requireCampfire(campfireId);

    const updated = await this.campfireDatastore.updateById(campfireId, {
      status: "extinguished",
    });

    if (!updated) {
      throw new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND");
    }

    return CampfireResponseSchema.parse(this.toCampfireResponse(updated));
  }

  private async requireCampfire(campfireId: string): Promise<CampfireRecord> {
    const campfire = await this.campfireDatastore.findById(campfireId);

    if (!campfire) {
      throw new NotFoundError("Campfire not found", "CAMPFIRE_NOT_FOUND");
    }

    return campfire;
  }

  private ensureLogCountWithinBounds(logCount: number): void {
    if (logCount > 10) {
      throw new ConflictError("logCount cannot exceed 10", "CAMPFIRE_CONFLICT");
    }
  }

  private toCampfireResponse(campfire: CampfireRecord): CampfireResponse {
    return {
      id: campfire._id.toString(),
      name: campfire.name,
      location: campfire.location,
      logCount: campfire.logCount,
      status: campfire.status,
      createdAt: campfire.createdAt.toISOString(),
      updatedAt: campfire.updatedAt.toISOString(),
    };
  }
}
