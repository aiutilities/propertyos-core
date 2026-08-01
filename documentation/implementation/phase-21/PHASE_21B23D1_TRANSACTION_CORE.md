# Phase 21B23D1 — Transaction Core

## Status

COMPLETE

## Scope

This phase introduces the filesystem transaction foundation used by the
PropertyOS marketplace installer.

## Implemented

- isolated transaction workspace;
- preflight validation;
- safe payload-tree validation;
- required-file validation;
- deterministic staging;
- atomic promotion with `os.replace`;
- backup of an existing installation;
- automatic restoration after commit failure;
- cleanup of partial new installations;
- durable JSONL transaction journal;
- explicit transaction states;
- injected-failure tests;
- default denial of symbolic links.

## Deliberately deferred

The following remain separate phases:

- database migration transaction coordination;
- capability registry mutation;
- runtime activation;
- persistent installation-attempt database records;
- process-crash recovery;
- upgrade orchestration;
- uninstall orchestration.

## Mutation boundary

The implementation mutates only the caller-provided installation root and
transaction work root.

## Next phase

Phase 21B23D2 — Portfolio Transaction Coordinator
