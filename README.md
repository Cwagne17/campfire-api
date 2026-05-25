# Campfire API

Campfire API is a professional demo TypeScript Express REST API. It is not the real product; it is a compact sample that demonstrates our preferred backend architecture, validation approach, Swagger/OpenAPI generation, Mongoose datastore pattern, build factory pattern, and AI-agent guidance.

The demo domain is intentionally simple: a campfire has a log count, and a future Next.js demo app can visualize the fire size based on the number of logs.

## Stack

- Node.js, TypeScript, Express
- Mongoose with MongoDB
- Zod for request and response contracts
- zod-openapi for OpenAPI 3.1 generation
- swagger-ui-express for API docs
- dotenv for configuration
- pino for logging
- aws-jwt-verify for local Cognito JWT verification
- Vitest and Supertest for tests
- ESLint and Prettier for code quality

## Architecture Overview

The API keeps HTTP, business logic, persistence, and contracts in separate layers:

- `RouteHandler`: registers Express routes, applies request validation, calls the service, validates response payloads, and sends HTTP responses.
- `Service`: owns application and business rules, maps persistence records into API response objects, and throws typed application errors.
- `Datastore`: owns Mongoose queries only. It returns persistence records and does not know about Express or API response contracts.
- `Model`: owns the Mongoose schema, model, enum values, and database record types.
- `Types`: owns Zod API contracts and inferred TypeScript types for each module. Shared error and Express types live in `src/types`.

## Folder Structure

```text
src/
  app.ts
  server.ts
  config/
  datastores/
  drivers/
  middleware/
  models/
  modules/
    campfires/
  openapi.ts
  types/
tests/
```

## Factory And Injection Pattern

Classes keep the familiar static `build()` pattern:

```ts
CampfireService.build();
CampfireDatastore.build();
CampfireRouteHandler.build();
```

Constructors remain public and test-accessible. Unit tests can pass mock dependencies directly, while production code can use `build()` for standard wiring.

## Validation

Zod schemas in `src/modules/campfires/campfire.types.ts` are the source of truth for request bodies, params, query strings, response payloads, and OpenAPI schemas. Requests are validated before service calls. Responses are validated before they are sent to clients.

Routehandlers use explicit middleware names:

```ts
auth(ParkRole.LEAD_RANGER, ParkRole.PARK_ADMIN);
validate({ body: CreateCampfireRequestSchema });
asyncHandler(async (req, res) => {
  // Route work happens here.
});
```

`asyncHandler` exists so async route failures are passed to centralized error middleware. It lives in `src/middleware/async-handler.middleware.ts` because it is Express middleware behavior, not a generic utility.

Runtime errors are returned in one documented shape:

```json
{
  "error": {
    "code": "CAMPFIRE_NOT_FOUND",
    "message": "Campfire not found",
    "requestId": "optional-request-id"
  }
}
```

`requestIdMiddleware` assigns `req.requestId`, returns it as the `x-request-id` response header, includes it in error responses, and makes it available to error logs. Global Express request augmentation is only used for fields that middleware intentionally sets, such as `requestId` and authenticated `actor`. Avoid adding request fields speculatively.

## Authentication And RBAC

Campfire API includes a lightweight Cognito/RBAC demo for park staff. It validates Cognito JWTs locally with `aws-jwt-verify`; the verifier may fetch and cache JWKS keys, but the API does not call Cognito APIs on every request.

Configure Cognito with:

```env
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
AWS_REGION=
```

Cognito groups map directly to `ParkRole` enum values:

```ts
export enum ParkRole {
  RANGER = "ranger",
  LEAD_RANGER = "lead_ranger",
  PARK_ADMIN = "park_admin",
}
```

The auth middleware reads `Authorization: Bearer <token>`, verifies the token, maps `cognito:groups` into `ParkRole[]`, and attaches the normalized actor to `req.actor`.

- `auth()` allows any authenticated park staff member.
- `auth(...roles)` requires at least one matching `ParkRole`.

## OpenAPI

`src/openapi.ts` generates the OpenAPI document programmatically with `zod-openapi`. There is no hand-written YAML and no hand-edited generated JSON.

- Swagger UI: `GET /docs`
- Raw OpenAPI JSON: `GET /openapi.json`
- Print the document locally: `npm run openapi:generate`

Protected routes declare `bearerAuth` security metadata in OpenAPI, and common `401` and `403` error responses are documented explicitly.

## Local Development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy environment values:

   ```sh
   cp .env.example .env
   ```

3. Start MongoDB:

   ```sh
   docker compose up -d
   ```

4. Start the API:

   ```sh
   npm run dev
   ```

The API defaults to `http://localhost:3000`.

## Tests And Quality

```sh
npm test
npm run build
npm run lint
npm run format
```

## Campfire Endpoints

- `GET /api/campfires`: any authenticated park staff member
- `GET /api/campfires/:campfireId`: any authenticated park staff member
- `POST /api/campfires`: lead ranger or park admin
- `PATCH /api/campfires/:campfireId`: lead ranger or park admin
- `DELETE /api/campfires/:campfireId`: park admin
- `POST /api/campfires/:campfireId/logs`: ranger, lead ranger, or park admin
- `DELETE /api/campfires/:campfireId/logs`: ranger, lead ranger, or park admin
- `POST /api/campfires/:campfireId/ignite`: lead ranger or park admin
- `POST /api/campfires/:campfireId/extinguish`: lead ranger or park admin

## Adding A New Endpoint

1. Add or update the Zod request, response, params, and query schemas in the module `*.types.ts` file.
2. Add service behavior and business rules in the module service.
3. Add datastore methods only when new persistence queries are needed.
4. Register the route in the module routehandler with `auth(...)`, `validate(...)`, `asyncHandler(...)`, and response validation.
5. Document the route in `src/openapi.ts`, including expected error responses.
6. Add focused tests for validation, business rules, response shape, and OpenAPI coverage.

## Adding A New Module

Create a new folder under `src/modules/<module-name>` with a routehandler, service, and types file. Add a datastore only if the module needs persistence access. Keep Mongoose models in `src/models`, and wire the routehandler from `src/app.ts`.
