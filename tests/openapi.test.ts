import { describe, expect, it } from "vitest";

import { CampfireLocation } from "../src/models/campfire.model";
import { openApiDocument } from "../src/openapi";

describe("openApiDocument", () => {
  it("generates an OpenAPI 3.1 document with campfire paths", () => {
    expect(openApiDocument.openapi).toBe("3.1.0");

    const paths = Object.keys(openApiDocument.paths ?? {});

    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/campfires",
        "/api/campfires/{campfireId}",
        "/api/campfires/{campfireId}/logs",
        "/api/campfires/{campfireId}/ignite",
        "/api/campfires/{campfireId}/extinguish",
      ]),
    );
  });

  it("documents common error responses on campfire operations", () => {
    const createCampfire = openApiDocument.paths?.["/api/campfires"]?.post;

    expect(createCampfire?.responses).toHaveProperty("400");
    expect(createCampfire?.responses).toHaveProperty("401");
    expect(createCampfire?.responses).toHaveProperty("403");
    expect(createCampfire?.responses).toHaveProperty("409");
    expect(createCampfire?.responses).toHaveProperty("500");
  });

  it("documents bearer authentication for protected campfire routes", () => {
    const createCampfire = openApiDocument.paths?.["/api/campfires"]?.post;

    expect(openApiDocument.components?.securitySchemes?.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
    expect(createCampfire?.security).toEqual([{ bearerAuth: [] }]);
  });

  it("includes the standardized campfire location enum", () => {
    const locationValues = Object.values(CampfireLocation);
    const documentJson = JSON.stringify(openApiDocument);

    for (const location of locationValues) {
      expect(documentJson).toContain(location);
    }
  });
});
