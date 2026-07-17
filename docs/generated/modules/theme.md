<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Theme

> Module ID: `theme`

## Overview

| Field | Value |
|---|---|
| Class | `ThemeModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `medium` |
| Risk score | `4.45` |
| Blast radius | `0` |
| Dependency surface | `2` |
| Source | `backend/src/core/theme/theme.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 5 |
| Controllers | 2 |
| Routes | 10 |
| Direct dependencies | 1 |
| Direct dependents | 0 |
| Transitive dependencies | 2 |
| Transitive dependents | 0 |

## Direct Dependencies

- `eventbus`

## Direct Dependents

_None_

## Transitive Impact

A change to `theme` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `ThemePackageController` | `/theme-packages` | 5 | Bearer | `backend/src/core/theme/package/controllers/theme-package.controller.ts:8` |
| `ThemeController` | `/themes` | 5 | Bearer | `backend/src/core/theme/controllers/theme.controller.ts:8` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `GET` | `/theme-packages` | `list` |  | `backend/src/core/theme/package/controllers/theme-package.controller.ts:17` |
| `POST` | `/theme-packages` | `register` |  | `backend/src/core/theme/package/controllers/theme-package.controller.ts:12` |
| `GET` | `/theme-packages/:id` | `get` |  | `backend/src/core/theme/package/controllers/theme-package.controller.ts:22` |
| `PATCH` | `/theme-packages/:id/archive` | `archive` |  | `backend/src/core/theme/package/controllers/theme-package.controller.ts:32` |
| `PATCH` | `/theme-packages/:id/install` | `install` |  | `backend/src/core/theme/package/controllers/theme-package.controller.ts:27` |
| `GET` | `/themes` | `list` |  | `backend/src/core/theme/controllers/theme.controller.ts:12` |
| `POST` | `/themes` | `install` |  | `backend/src/core/theme/controllers/theme.controller.ts:36` |
| `GET` | `/themes/:id` | `get` |  | `backend/src/core/theme/controllers/theme.controller.ts:28` |
| `POST` | `/themes/:id/activate` | `activate` |  | `backend/src/core/theme/controllers/theme.controller.ts:41` |
| `GET` | `/themes/active` | `active` |  | `backend/src/core/theme/controllers/theme.controller.ts:20` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `ThemeController` | `backend/src/core/theme/controllers/theme.controller.ts` |
| controller | `ThemePackageController` | `backend/src/core/theme/package/controllers/theme-package.controller.ts` |
| service | `ThemePackageArchiveService` | `backend/src/core/theme/package/archive/theme-package-archive.service.ts` |
| service | `ThemePackageService` | `backend/src/core/theme/package/services/theme-package.service.ts` |
| service | `ThemeService` | `backend/src/core/theme/services/theme.service.ts` |
