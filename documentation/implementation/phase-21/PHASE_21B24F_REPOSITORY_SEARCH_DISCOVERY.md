# Phase 21B24F — Repository Search and Discovery

## Status

COMPLETE

## Objective

Provide deterministic search and discovery over a verified PropertyOS
marketplace repository index.

## Implementation

`tools/knowledge_engine/marketplace_repository_search.py`

## Search fields

- plugin ID;
- display name;
- summary;
- publisher ID;
- release versions.

## Filters

- publisher ID;
- host API compatibility;
- yanked release inclusion;
- page number;
- page size.

## Ranking

Search hits are ranked deterministically using weighted exact, prefix and
substring matches.

Priority:

1. plugin ID;
2. display name;
3. publisher ID;
4. release versions;
5. summary.

Ties are resolved by display name and plugin ID.

## Compatibility

When a host API version is supplied, only plugins with at least one compatible
release are returned.

The result includes the exact compatible release versions.

## Yanked releases

Yanked releases are excluded by default.

They may be included only through an explicit query option.

## Pagination

Page size is restricted to 1–100.

Results expose total count, page count, page number and page size.

## Next phase

Phase 21B24G — Update Discovery
