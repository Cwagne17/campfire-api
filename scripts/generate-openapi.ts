import { openApiDocument } from "../src/openapi";

process.stdout.write(`${JSON.stringify(openApiDocument, null, 2)}\n`);
