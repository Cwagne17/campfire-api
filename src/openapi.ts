import {
  createDocument,
  type ZodOpenApiContentObject,
  type ZodOpenApiSchemaObject,
} from "zod-openapi";

import { ErrorResponseSchema } from "./types/errors";
import {
  CampfireListResponseSchema,
  CampfireParamsSchema,
  CampfireResponseSchema,
  CreateCampfireRequestSchema,
  DeleteCampfireResponseSchema,
  ListCampfiresQuerySchema,
  LogMutationRequestSchema,
  UpdateCampfireRequestSchema,
} from "./modules/campfires/campfire.types";

const jsonContent = (schema: ZodOpenApiSchemaObject): ZodOpenApiContentObject => ({
  "application/json": {
    schema,
  },
});

const errorResponse = (description: string) => ({
  description,
  content: jsonContent(ErrorResponseSchema),
});

const bearerAuthSecurity = [{ bearerAuth: [] }];

const commonErrorResponses = {
  "400": errorResponse("Request validation failed."),
  "401": errorResponse("Authentication is required or the bearer token is invalid."),
  "403": errorResponse("Authenticated park staff member does not have the required role."),
  "404": errorResponse("Resource was not found."),
  "409": errorResponse("Request conflicts with campfire business rules."),
  "500": errorResponse("Unexpected server error."),
};

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Campfire API",
    version: "1.0.0",
    description:
      "A professional demo TypeScript Express REST API for campfires, built from Zod schemas.",
  },
  tags: [
    {
      name: "Campfires",
      description: "Create, inspect, and manage campfires and their log counts.",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    "/api/campfires": {
      post: {
        summary: "Create a campfire",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestBody: {
          required: true,
          content: jsonContent(CreateCampfireRequestSchema),
        },
        responses: {
          "201": {
            description: "Campfire created.",
            content: jsonContent(CampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
      get: {
        summary: "List campfires",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          query: ListCampfiresQuerySchema,
        },
        responses: {
          "200": {
            description: "Paginated campfire list.",
            content: jsonContent(CampfireListResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
    },
    "/api/campfires/{campfireId}": {
      get: {
        summary: "Get one campfire",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          path: CampfireParamsSchema,
        },
        responses: {
          "200": {
            description: "Campfire found.",
            content: jsonContent(CampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
      patch: {
        summary: "Update campfire metadata or status",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          path: CampfireParamsSchema,
        },
        requestBody: {
          required: true,
          content: jsonContent(UpdateCampfireRequestSchema),
        },
        responses: {
          "200": {
            description: "Campfire updated.",
            content: jsonContent(CampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
      delete: {
        summary: "Delete a campfire",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          path: CampfireParamsSchema,
        },
        responses: {
          "200": {
            description: "Campfire deleted.",
            content: jsonContent(DeleteCampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
    },
    "/api/campfires/{campfireId}/logs": {
      post: {
        summary: "Add logs to a campfire",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          path: CampfireParamsSchema,
        },
        requestBody: {
          required: true,
          content: jsonContent(LogMutationRequestSchema),
        },
        responses: {
          "200": {
            description: "Logs added.",
            content: jsonContent(CampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
      delete: {
        summary: "Remove logs from a campfire",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          path: CampfireParamsSchema,
        },
        requestBody: {
          required: true,
          content: jsonContent(LogMutationRequestSchema),
        },
        responses: {
          "200": {
            description: "Logs removed.",
            content: jsonContent(CampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
    },
    "/api/campfires/{campfireId}/ignite": {
      post: {
        summary: "Ignite a campfire",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          path: CampfireParamsSchema,
        },
        responses: {
          "200": {
            description: "Campfire ignited.",
            content: jsonContent(CampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
    },
    "/api/campfires/{campfireId}/extinguish": {
      post: {
        summary: "Extinguish a campfire",
        tags: ["Campfires"],
        security: bearerAuthSecurity,
        requestParams: {
          path: CampfireParamsSchema,
        },
        responses: {
          "200": {
            description: "Campfire extinguished.",
            content: jsonContent(CampfireResponseSchema),
          },
          ...commonErrorResponses,
        },
      },
    },
  },
});
