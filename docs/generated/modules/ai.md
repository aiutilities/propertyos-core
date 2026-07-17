<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Ai

> Module ID: `ai`

## Overview

| Field | Value |
|---|---|
| Class | `AiModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `low` |
| Risk score | `2.5` |
| Blast radius | `0` |
| Dependency surface | `2` |
| Source | `backend/src/core/ai/ai.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 2 |
| Controllers | 1 |
| Routes | 2 |
| Direct dependencies | 1 |
| Direct dependents | 0 |
| Transitive dependencies | 2 |
| Transitive dependents | 0 |

## Direct Dependencies

- `eventbus`

## Direct Dependents

_None_

## Transitive Impact

A change to `ai` can potentially affect **0** modules transitively.

_None_


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `AiController` | `/ai` | 2 | Bearer | `backend/src/core/ai/controllers/ai.controller.ts:8` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `POST` | `/ai/generate` | `generate` |  | `backend/src/core/ai/controllers/ai.controller.ts:17` |
| `GET` | `/ai/providers` | `listProviders` |  | `backend/src/core/ai/controllers/ai.controller.ts:12` |

## Components

| Kind | Class | Source |
|---|---|---|
| controller | `AiController` | `backend/src/core/ai/controllers/ai.controller.ts` |
| service | `AiService` | `backend/src/core/ai/services/ai.service.ts` |
