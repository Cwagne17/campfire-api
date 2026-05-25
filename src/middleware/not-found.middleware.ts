import type { RequestHandler } from "express";

import { NotFoundError } from "../types/errors";

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`, "ROUTE_NOT_FOUND"));
};
