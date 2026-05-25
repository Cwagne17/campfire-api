import { describe, expect, it, vi } from "vitest";

import { CognitoDriver } from "../src/drivers/cognito.driver";
import { ParkRole } from "../src/types/auth";

describe("CognitoDriver", () => {
  it("normalizes Cognito groups into ParkRole values", async () => {
    const driver = new CognitoDriver({
      verify: vi.fn().mockResolvedValue({
        sub: "park-staff-1",
        username: "casey.ranger",
        "cognito:groups": [ParkRole.RANGER, "unmapped_group"],
      }),
    });

    const actor = await driver.verifyToken("token");

    expect(actor).toMatchObject({
      id: "park-staff-1",
      username: "casey.ranger",
      groups: [ParkRole.RANGER, "unmapped_group"],
      roles: [ParkRole.RANGER],
    });
  });
});
