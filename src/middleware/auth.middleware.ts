import type { RequestHandler } from "express";

import { CognitoDriver, type ICognitoDriver } from "../drivers/cognito.driver";
import { AppError, ForbiddenError, UnauthorizedError } from "../types/errors";
import { ParkRole } from "../types/auth";

let cachedDriver: ICognitoDriver | undefined;
let testDriver: ICognitoDriver | undefined;

const getCognitoDriver = (): ICognitoDriver => {
  if (testDriver) {
    return testDriver;
  }

  cachedDriver ??= CognitoDriver.build();
  return cachedDriver;
};

export const setAuthDriverForTesting = (driver?: ICognitoDriver): void => {
  testDriver = driver;
  cachedDriver = undefined;
};

const parseBearerToken = (authorizationHeader: string | undefined): string => {
  if (!authorizationHeader) {
    throw new UnauthorizedError("Authorization bearer token is required", "AUTH_REQUIRED");
  }

  const [scheme, token, ...rest] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token || rest.length > 0) {
    throw new UnauthorizedError("Authorization bearer token is required", "AUTH_REQUIRED");
  }

  return token;
};

const hasAllowedRole = (userRoles: ParkRole[], allowedRoles: ParkRole[]): boolean => {
  return allowedRoles.some((role) => userRoles.includes(role));
};

export const auth =
  (...allowedRoles: ParkRole[]): RequestHandler =>
  async (req, _res, next) => {
    try {
      const token = parseBearerToken(req.header("authorization"));
      const actor = await getCognitoDriver().verifyToken(token);

      if (allowedRoles.length > 0 && !hasAllowedRole(actor.roles, allowedRoles)) {
        throw new ForbiddenError(
          "Authenticated park staff member does not have access to this resource",
          "AUTH_FORBIDDEN",
        );
      }

      req.actor = actor;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }

      next(new UnauthorizedError("Invalid or expired authentication token", "AUTH_INVALID_TOKEN"));
    }
  };
