import { model, Schema, type InferSchemaType, type Types } from "mongoose";

export const CAMPFIRE_STATUSES = ["unlit", "burning", "extinguished"] as const;
export type CampfireStatus = (typeof CAMPFIRE_STATUSES)[number];

const campfireSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    logCount: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      default: 0,
    },
    status: {
      type: String,
      enum: CAMPFIRE_STATUSES,
      required: true,
      default: "unlit",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

campfireSchema.index({ status: 1, createdAt: -1 });

export type CampfireSchemaType = InferSchemaType<typeof campfireSchema>;
export type CampfireRecord = CampfireSchemaType & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CampfireModel = model<CampfireSchemaType>("Campfire", campfireSchema);
