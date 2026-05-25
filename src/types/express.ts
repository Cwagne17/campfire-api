import type { AuthenticatedUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      actor?: AuthenticatedUser;
    }
  }
}

export {};
