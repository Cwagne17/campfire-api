import { model, Schema, type InferSchemaType, type Types } from "mongoose";

export const CAMPFIRE_STATUSES = ["unlit", "burning", "extinguished"] as const;
export type CampfireStatus = (typeof CAMPFIRE_STATUSES)[number];

export enum CampfireLocation {
  YOSEMITE = "yosemite",
  YELLOWSTONE = "yellowstone",
  GLACIER = "glacier",
  ZION = "zion",
  ACADIA = "acadia",
  OLYMPIC = "olympic",
}

export const CampfireLocationDisplayName: Record<CampfireLocation, string> = {
  [CampfireLocation.YOSEMITE]: "Yosemite National Park",
  [CampfireLocation.YELLOWSTONE]: "Yellowstone National Park",
  [CampfireLocation.GLACIER]: "Glacier National Park",
  [CampfireLocation.ZION]: "Zion National Park",
  [CampfireLocation.ACADIA]: "Acadia National Park",
  [CampfireLocation.OLYMPIC]: "Olympic National Park",
};

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
      enum: Object.values(CampfireLocation),
      required: true,
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

campfireSchema.index({ location: 1, status: 1, createdAt: -1 });

export type CampfireSchemaType = InferSchemaType<typeof campfireSchema>;
export type CampfireRecord = Omit<CampfireSchemaType, "location" | "status"> & {
  _id: Types.ObjectId;
  location: CampfireLocation;
  status: CampfireStatus;
  createdAt: Date;
  updatedAt: Date;
};

export const CampfireModel = model<CampfireSchemaType>("Campfire", campfireSchema);
