# Phase 21 Product-Audit Runtime Foundation

## Status

Validated on 31 July 2026.

## Runtime Contract

| Component | Address |
|---|---|
| Frontend | `http://localhost:3002` |
| API | `http://localhost:3001/api/v1` |
| PostgreSQL host port | `5433` |

## Validated Routes

- `/`
- `/login`
- `/dashboard`
- `/properties`
- `/properties/new`
- `/api/v1/health`

All validated routes returned HTTP 200.

The authentication endpoint returned HTTP 401 for deliberately invalid
credentials, confirming that the route exists and rejects invalid access.

## API Runtime

The audit API uses the validated image:

`propertyos-api:phase15c2f-1e3f57d2`

The container exposes internal port 3000 as host port 3001.

The following persistent volumes are retained:

- `backend_propertyos_plugin_data:/app/plugins/.installed`
- `backend_propertyos_upload_data:/app/uploads`

## CORS Contract

The frontend origin must be allowed by the API:

`http://localhost:3002`

The validated runtime value is:

`CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002`

## Frontend API Contract

The frontend must be started with:

`NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1`

## Important Persistence Note

The current CORS correction is attached to the recreated local API container.

The repository defaults still require a later, separately governed correction
before this runtime contract can be considered reproducible after container
recreation.

Do not recreate the API container during the founder visual audit without
first preserving this runtime contract.

## Database Safety

No database migration was executed while restoring the audit runtime.

The API was started with:

`node dist/main.js`

The migration runner was not invoked.

## Known Non-Blocking Warning

NestJS reports a legacy wildcard-route warning for `/api/v1/*`.

This is technical debt related to route syntax. It is not evidence of database
migration execution and does not block the visual audit.
