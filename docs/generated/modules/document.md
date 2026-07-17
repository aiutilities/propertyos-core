<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Document

> Module ID: `document`

## Overview

| Field | Value |
|---|---|
| Class | `DocumentModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `6.2` |
| Blast radius | `0` |
| Dependency surface | `4` |
| Source | `backend/src/core/document/document.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 3 |
| Controllers | 1 |
| Routes | 7 |
| Direct dependencies | 3 |
| Direct dependents | 0 |
| Transitive dependencies | 4 |
| Transitive dependents | 0 |

## Direct Dependencies

- `database:postgres`
- `eventbus`
- `search`

## Direct Dependents

_None_

## Transitive Impact

A change to `document` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `DocumentController` | `/` | 7 | Bearer | `backend/src/core/document/controllers/document.controller.ts:10` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/document-templates` | `listTemplates` |  | `backend/src/core/document/controllers/document.controller.ts:19` |
| `POST` | `/document-templates` | `createTemplate` |  | `backend/src/core/document/controllers/document.controller.ts:14` |
| `GET` | `/documents` | `listDocuments` |  | `backend/src/core/document/controllers/document.controller.ts:29` |
| `GET` | `/documents/:id` | `getDocument` |  | `backend/src/core/document/controllers/document.controller.ts:34` |
| `GET` | `/documents/:id/versions` | `listVersions` |  | `backend/src/core/document/controllers/document.controller.ts:47` |
| `POST` | `/documents/:id/versions` | `createVersion` |  | `backend/src/core/document/controllers/document.controller.ts:39` |
| `POST` | `/documents/generate` | `generate` |  | `backend/src/core/document/controllers/document.controller.ts:24` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `DocumentController` | `backend/src/core/document/controllers/document.controller.ts` |
| search-provider | `DocumentSearchProviderService` | `backend/src/core/document/document-search-provider.service.ts` |
| service | `DocumentService` | `backend/src/core/document/services/document.service.ts` |
