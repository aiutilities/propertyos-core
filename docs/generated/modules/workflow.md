<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Workflow

> Module ID: `workflow`

## Overview

| Field | Value |
|---|---|
| Class | `WorkflowModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `medium` |
| Risk score | `28.45` |
| Blast radius | `4` |
| Dependency surface | `8` |
| Source | `backend/src/core/workflow/workflow.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 4 |
| Controllers | 1 |
| Routes | 11 |
| Direct dependencies | 5 |
| Direct dependents | 4 |
| Transitive dependencies | 8 |
| Transitive dependents | 4 |

## Direct Dependencies

- `database:database`
- `eventbus`
- `identity`
- `plugin`
- `search`

## Direct Dependents

- `facility`
- `health`
- `maintenance`
- `reservation`

## Transitive Impact

A change to `workflow` can potentially affect **4** modules transitively.

- `facility`
- `health`
- `maintenance`
- `reservation`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `WorkflowController` | `/workflows` | 11 | Bearer | `backend/src/core/workflow/controllers/workflow.controller.ts:17` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/workflows/definitions` | `listDefinitions` | `Permissions.WORKFLOW_READ` | `backend/src/core/workflow/controllers/workflow.controller.ts:35` |
| `POST` | `/workflows/definitions` | `createDefinition` | `Permissions.WORKFLOW_CREATE` | `backend/src/core/workflow/controllers/workflow.controller.ts:22` |
| `GET` | `/workflows/definitions/:id` | `getDefinition` | `Permissions.WORKFLOW_READ` | `backend/src/core/workflow/controllers/workflow.controller.ts:61` |
| `GET` | `/workflows/definitions/code/:code` | `getDefinitionByCode` | `Permissions.WORKFLOW_READ` | `backend/src/core/workflow/controllers/workflow.controller.ts:48` |
| `POST` | `/workflows/instances` | `startWorkflow` | `Permissions.WORKFLOW_CREATE` | `backend/src/core/workflow/controllers/workflow.controller.ts:133` |
| `GET` | `/workflows/instances/:id` | `getInstance` | `Permissions.WORKFLOW_READ` | `backend/src/core/workflow/controllers/workflow.controller.ts:146` |
| `POST` | `/workflows/instances/:id/transitions` | `transitionWorkflow` | `Permissions.WORKFLOW_CREATE` | `backend/src/core/workflow/controllers/workflow.controller.ts:159` |
| `POST` | `/workflows/instances/by-code` | `startWorkflowByCode` | `Permissions.WORKFLOW_CREATE` | `backend/src/core/workflow/controllers/workflow.controller.ts:88` |
| `GET` | `/workflows/instances/by-entity/:entityType/:entityId` | `getInstanceByEntity` | `Permissions.WORKFLOW_READ` | `backend/src/core/workflow/controllers/workflow.controller.ts:114` |
| `POST` | `/workflows/instances/by-entity/transitions` | `transitionWorkflowByEntity` | `Permissions.WORKFLOW_CREATE` | `backend/src/core/workflow/controllers/workflow.controller.ts:101` |
| `GET` | `/workflows/metrics` | `getMetrics` | `Permissions.WORKFLOW_READ` | `backend/src/core/workflow/controllers/workflow.controller.ts:75` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `WorkflowBootstrapService` | `backend/src/core/workflow/bootstrap/workflow-bootstrap.service.ts` |
| controller | `WorkflowController` | `backend/src/core/workflow/controllers/workflow.controller.ts` |
| search-provider | `WorkflowSearchProviderService` | `backend/src/core/workflow/workflow-search-provider.service.ts` |
| service | `WorkflowService` | `backend/src/core/workflow/services/workflow.service.ts` |
