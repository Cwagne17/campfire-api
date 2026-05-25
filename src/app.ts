import "./types/express";

import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";

import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { CampfireRouteHandler } from "./modules/campfires/campfire.routehandler";
import { openApiDocument } from "./openapi";

export const buildApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api", CampfireRouteHandler.build());

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export const app = buildApp();
