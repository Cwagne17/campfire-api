import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";

import { env } from "../config/env";
import { AppError } from "../types/errors";
import { ParkRole, type AuthenticatedUser } from "../types/auth";

interface CognitoVerifier {
  verify(token: string): Promise<CognitoAccessTokenPayload>;
}

export interface ICognitoDriver {
  verifyToken(token: string): Promise<AuthenticatedUser>;
}

export class CognitoDriver implements ICognitoDriver {
  constructor(private readonly verifier: CognitoVerifier) {}

  public static build(): ICognitoDriver {
    if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID || !env.AWS_REGION) {
      throw new AppError("Cognito authentication is not configured", 500, "AUTH_CONFIG_MISSING");
    }

    try {
      const verifier = CognitoJwtVerifier.create({
        userPoolId: env.COGNITO_USER_POOL_ID,
        tokenUse: "access",
        clientId: env.COGNITO_CLIENT_ID,
      });

      return new CognitoDriver(verifier);
    } catch {
      throw new AppError("Cognito authentication is not configured", 500, "AUTH_CONFIG_INVALID");
    }
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    const payload = await this.verifier.verify(token);
    const groups = this.getGroups(payload);

    return {
      id: payload.sub,
      username: payload.username,
      groups,
      roles: groups.flatMap((group) => this.toParkRole(group)),
      claims: payload,
    };
  }

  private getGroups(payload: CognitoAccessTokenPayload): string[] {
    return Array.isArray(payload["cognito:groups"]) ? payload["cognito:groups"] : [];
  }

  private toParkRole(group: string): ParkRole[] {
    return Object.values(ParkRole).includes(group as ParkRole) ? [group as ParkRole] : [];
  }
}
