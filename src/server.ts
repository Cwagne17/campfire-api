import mongoose from "mongoose";

import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const startServer = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Campfire API listening");
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, "Shutting down Campfire API");

    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
};

void startServer().catch((error) => {
  logger.error({ err: error }, "Failed to start Campfire API");
  process.exit(1);
});
