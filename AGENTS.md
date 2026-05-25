# AI Agent Guidance

This repository is a professional demo API. Keep it clean, instructional, and close to the established architecture.

## Imports And Middleware

- Do not use `.js` extensions in TypeScript source imports.
- Put Express middleware in `src/middleware`.
- Use `auth(...roles)`, `validate(...)`, and `asyncHandler(...)` consistently in routehandlers.
- Keep `asyncHandler` in `src/middleware/async-handler.middleware.ts`.

## Preserve Layer Boundaries

- Routehandlers own Express routing and HTTP request/response handling.
- Services own application and business logic.
- Datastores own Mongoose queries.
- Models own Mongoose schema, model, enum values, and persistence record types.
- Module `*.types.ts` files own Zod request, response, params, query schemas, inferred API types, and OpenAPI metadata.

Do not import Mongoose models directly into routehandlers or services unless there is an explicit architectural reason. Prefer datastore methods for persistence access.

## Validation And Contracts

- Do not bypass Zod request validation.
- Do not bypass response validation before sending JSON.
- Add or update schemas before adding routes.
- Keep Zod schemas as the source of truth for request validation, response validation, and OpenAPI schema generation.
- Keep API contracts stable unless intentionally changing versions.

## Auth And Request Types

- Keep `ParkRole` as the source of truth for RBAC role names.
- Cognito groups should map to `ParkRole` enum values.
- Do not keep unused global Express `Request` augmentation.
- If adding fields to Express `Request`, add them intentionally and document which middleware sets them.
- `requestIdMiddleware` sets `req.requestId`.
- `auth(...)` sets `req.actor`.

## OpenAPI

- Use `zod-openapi`, not `@asteasolutions/zod-to-openapi`.
- Do not hand-edit generated OpenAPI JSON.
- Do not add static OpenAPI YAML.
- Document expected runtime errors explicitly in OpenAPI metadata.
- Use the shared `ErrorResponse` shape for errors.

## Factory Pattern

Keep the static `build()` factory pattern, but preserve constructor-based dependency injection for tests.

Good:

```ts
new CampfireService(mockDatastore);
CampfireService.build();
```

Avoid making `build()` the only way to construct a class.

## Tests

Add tests when adding new endpoints. Cover request validation, business rules, response validation, documented error shape, and OpenAPI path coverage when relevant.

## Security And Tone

- Never commit secrets.
- Keep `.env` local and use `.env.example` for safe defaults.
- Keep naming professional and avoid overly silly route names, error names, or domain complexity.
