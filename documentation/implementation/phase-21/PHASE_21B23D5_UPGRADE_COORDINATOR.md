# Phase 21B23D5 — Upgrade Coordinator

## Status

COMPLETE

## Objective

Coordinate an installed plugin version transition across filesystem state,
runtime activation state, registry state, health validation and rollback.

## Implementation

`tools/knowledge_engine/marketplace_upgrade_coordinator.py`

## Implemented

- installed-version and target-version validation;
- default-deny downgrade policy;
- explicit downgrade authorization;
- source manifest identity and version validation;
- active-plugin deactivation boundary;
- exact backup of the previous installed version;
- D1 transactional replacement of installed files;
- upgraded-plugin activation;
- upgraded-plugin health validation;
- atomic runtime-registry update;
- restoration of previous files and registry on failure;
- reactivation of the previous version after rollback;
- durable JSONL upgrade journal;
- injected failure tests around installation and registry commit.

## Safety properties

- equal-version reinstall is rejected;
- downgrade is denied unless explicitly allowed;
- registry must already contain the installed plugin;
- source ID and version must match the request;
- previous files are backed up before replacement;
- failed upgrade never leaves the new version registered;
- rollback restores the previous version and prior active state.

## Next phase

Phase 21B23D6 — Safe Uninstall
