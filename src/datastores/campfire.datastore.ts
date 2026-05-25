import { Types } from "mongoose";

import {
  CampfireModel,
  type CampfireLocation,
  type CampfireRecord,
  type CampfireStatus,
} from "../models/campfire.model";

export interface CreateCampfireRecordInput {
  name: string;
  location: CampfireLocation;
  logCount: number;
  status: CampfireStatus;
}

export interface UpdateCampfireRecordInput {
  name?: string;
  location?: CampfireLocation;
  logCount?: number;
  status?: CampfireStatus;
}

export interface ListCampfireRecordsInput {
  page: number;
  limit: number;
  status?: CampfireStatus;
  location?: CampfireLocation;
}

export interface ListCampfireRecordsResult {
  records: CampfireRecord[];
  total: number;
}

export interface ICampfireDatastore {
  create(input: CreateCampfireRecordInput): Promise<CampfireRecord>;
  findMany(input: ListCampfireRecordsInput): Promise<ListCampfireRecordsResult>;
  findById(campfireId: string): Promise<CampfireRecord | null>;
  updateById(campfireId: string, input: UpdateCampfireRecordInput): Promise<CampfireRecord | null>;
  deleteById(campfireId: string): Promise<CampfireRecord | null>;
}

export class CampfireDatastore implements ICampfireDatastore {
  public static build(): ICampfireDatastore {
    return new CampfireDatastore();
  }

  async create(input: CreateCampfireRecordInput): Promise<CampfireRecord> {
    const campfire = await CampfireModel.create(input);
    return campfire.toObject() as CampfireRecord;
  }

  async findMany(input: ListCampfireRecordsInput): Promise<ListCampfireRecordsResult> {
    const filter = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.location ? { location: input.location } : {}),
    };
    const skip = (input.page - 1) * input.limit;

    const [records, total] = await Promise.all([
      CampfireModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(input.limit)
        .lean<CampfireRecord[]>()
        .exec(),
      CampfireModel.countDocuments(filter).exec(),
    ]);

    return { records, total };
  }

  async findById(campfireId: string): Promise<CampfireRecord | null> {
    if (!Types.ObjectId.isValid(campfireId)) {
      return null;
    }

    return CampfireModel.findById(campfireId).lean<CampfireRecord>().exec();
  }

  async updateById(
    campfireId: string,
    input: UpdateCampfireRecordInput,
  ): Promise<CampfireRecord | null> {
    if (!Types.ObjectId.isValid(campfireId)) {
      return null;
    }

    return CampfireModel.findByIdAndUpdate(
      campfireId,
      { $set: input },
      { new: true, runValidators: true },
    )
      .lean<CampfireRecord>()
      .exec();
  }

  async deleteById(campfireId: string): Promise<CampfireRecord | null> {
    if (!Types.ObjectId.isValid(campfireId)) {
      return null;
    }

    return CampfireModel.findByIdAndDelete(campfireId).lean<CampfireRecord>().exec();
  }
}
