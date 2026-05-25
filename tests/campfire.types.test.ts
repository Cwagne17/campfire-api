import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CampfireLocation } from "../src/models/campfire.model";
import {
  CreateCampfireRequestSchema,
  UpdateCampfireRequestSchema,
} from "../src/modules/campfires/campfire.types";

const listTypeScriptFiles = (directory: string): string[] => {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return listTypeScriptFiles(fullPath);
    }

    return fullPath.endsWith(".ts") ? [fullPath] : [];
  });
};

describe("campfire API schemas", () => {
  it("accepts standardized campfire locations", () => {
    const result = CreateCampfireRequestSchema.parse({
      name: "North Ridge Fire",
      location: CampfireLocation.YOSEMITE,
      logCount: 3,
    });

    expect(result.location).toBe(CampfireLocation.YOSEMITE);
  });

  it("rejects arbitrary campfire locations", () => {
    expect(() =>
      CreateCampfireRequestSchema.parse({
        name: "North Ridge Fire",
        location: "pine-hollow",
        logCount: 3,
      }),
    ).toThrow();
  });

  it("supports standardized location updates", () => {
    const result = UpdateCampfireRequestSchema.parse({
      location: CampfireLocation.OLYMPIC,
    });

    expect(result.location).toBe(CampfireLocation.OLYMPIC);
  });

  it("does not use deprecated z.string().datetime()", () => {
    const source = listTypeScriptFiles(path.join(process.cwd(), "src"))
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n");

    expect(source).not.toContain("z.string().datetime()");
  });
});
