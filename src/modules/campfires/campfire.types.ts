import "zod-openapi";
import { z } from "zod";

import { CAMPFIRE_STATUSES, CampfireLocation } from "../../models/campfire.model";

export const CampfireStatusSchema = z.enum(CAMPFIRE_STATUSES).meta({
  id: "CampfireStatus",
  description: "Current lifecycle state of the campfire.",
  example: "unlit",
});

export const CampfireIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "campfireId must be a valid MongoDB ObjectId")
  .meta({
    description: "Campfire identifier.",
    example: "6654f3c7f6c9a3d0dfb3b4b1",
    param: {
      id: "CampfireId",
    },
  });

const NameSchema = z.string().trim().min(1).max(100).meta({
  description: "Display name for the campfire.",
  example: "North Ridge Fire",
});

export const CampfireLocationSchema = z.enum(CampfireLocation).meta({
  id: "CampfireLocation",
  description:
    "Standardized national park location for the campfire. Frontends can map this value to a display name.",
  example: CampfireLocation.YOSEMITE,
});

const LogCountSchema = z.number().int().min(0).max(10).meta({
  description: "Number of logs in the campfire. Used by clients to visualize fire size.",
  example: 3,
});

export const CampfireParamsSchema = z
  .object({
    campfireId: CampfireIdSchema,
  })
  .meta({ id: "CampfireParams" });

export const CreateCampfireRequestSchema = z
  .object({
    name: NameSchema,
    location: CampfireLocationSchema,
    logCount: LogCountSchema.default(0),
    status: CampfireStatusSchema.default("unlit"),
  })
  .strict()
  .meta({
    id: "CreateCampfireRequest",
    description: "Request body for creating a campfire.",
  });

export const ListCampfiresQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1).meta({
      description: "Page number for paginated results.",
      example: 1,
    }),
    limit: z.coerce.number().int().min(1).max(100).default(20).meta({
      description: "Number of campfires to return per page.",
      example: 20,
    }),
    status: CampfireStatusSchema.optional(),
    location: CampfireLocationSchema.optional(),
  })
  .strict()
  .meta({
    id: "ListCampfiresQuery",
    description: "Query string for listing campfires.",
  });

export const UpdateCampfireRequestSchema = z
  .object({
    name: NameSchema.optional(),
    location: CampfireLocationSchema.optional(),
    status: CampfireStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  })
  .meta({
    id: "UpdateCampfireRequest",
    description: "Request body for updating campfire metadata or status.",
  });

export const LogMutationRequestSchema = z
  .object({
    count: z.number().int().min(1).max(10).meta({
      description: "Number of logs to add or remove.",
      example: 1,
    }),
  })
  .strict()
  .meta({
    id: "LogMutationRequest",
    description: "Request body for adding or removing logs.",
  });

export const CampfireResponseSchema = z
  .object({
    id: z.string().meta({
      description: "Campfire identifier.",
      example: "6654f3c7f6c9a3d0dfb3b4b1",
    }),
    name: NameSchema,
    location: CampfireLocationSchema,
    logCount: LogCountSchema,
    status: CampfireStatusSchema,
    createdAt: z.iso.datetime().meta({
      description: "ISO timestamp when the campfire was created.",
      example: "2026-05-25T12:00:00.000Z",
    }),
    updatedAt: z.iso.datetime().meta({
      description: "ISO timestamp when the campfire was last updated.",
      example: "2026-05-25T12:05:00.000Z",
    }),
  })
  .meta({
    id: "Campfire",
    description: "Campfire API response object.",
  });

export const CampfireListResponseSchema = z
  .object({
    data: z.array(CampfireResponseSchema),
    pagination: z.object({
      page: z.number().int().min(1).meta({ example: 1 }),
      limit: z.number().int().min(1).meta({ example: 20 }),
      total: z.number().int().min(0).meta({ example: 42 }),
      totalPages: z.number().int().min(0).meta({ example: 3 }),
    }),
  })
  .meta({
    id: "CampfireList",
    description: "Paginated list of campfires.",
  });

export const DeleteCampfireResponseSchema = z
  .object({
    id: z.string().meta({
      description: "Deleted campfire identifier.",
      example: "6654f3c7f6c9a3d0dfb3b4b1",
    }),
    deleted: z.literal(true).meta({
      description: "Confirms the campfire was deleted.",
      example: true,
    }),
  })
  .meta({
    id: "DeleteCampfireResponse",
    description: "Response returned after deleting a campfire.",
  });

export type CampfireParams = z.infer<typeof CampfireParamsSchema>;
export type CreateCampfireRequest = z.infer<typeof CreateCampfireRequestSchema>;
export type ListCampfiresQuery = z.infer<typeof ListCampfiresQuerySchema>;
export type UpdateCampfireRequest = z.infer<typeof UpdateCampfireRequestSchema>;
export type LogMutationRequest = z.infer<typeof LogMutationRequestSchema>;
export type CampfireResponse = z.infer<typeof CampfireResponseSchema>;
export type CampfireListResponse = z.infer<typeof CampfireListResponseSchema>;
export type DeleteCampfireResponse = z.infer<typeof DeleteCampfireResponseSchema>;
