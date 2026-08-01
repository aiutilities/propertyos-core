# Phase 21B24G — Update Discovery

## Status

COMPLETE

## Objective

Compare installed plugin versions against a verified marketplace repository
index and produce a deterministic upgrade plan suitable for the Phase 21B23D5
upgrade coordinator.

## Implementation

`tools/knowledge_engine/marketplace_update_discovery.py`

## Implemented

- installed plugin inventory validation;
- repository plugin lookup;
- semantic version comparison;
- patch, minor and major classification;
- host API compatibility filtering;
- yanked release exclusion by default;
- explicit yanked release inclusion;
- patch/minor/major policy gates;
- highest eligible release selection;
- no-downgrade guarantee;
- required release metadata validation;
- deterministic update and issue ordering.

## Upgrade-plan output

Each candidate includes:

- installed version;
- target version;
- update kind;
- publisher ID;
- manifest URL;
- archive URL;
- archive SHA-256;
- publisher signature;
- host API compatibility range.

## Safety properties

- no equal-version or downgrade action is proposed;
- incompatible releases are excluded;
- yanked releases are excluded unless explicitly permitted;
- malformed release metadata is not promoted into the plan;
- duplicate installed or repository plugin IDs are rejected.

## Next phase

Phase 21B24H — Offline Cache and Mirrors
