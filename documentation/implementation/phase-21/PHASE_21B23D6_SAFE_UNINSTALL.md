# Phase 21B23D6 — Safe Uninstall

## Status

COMPLETE

## Objective

Safely remove an installed plugin while protecting reverse dependencies,
runtime registry consistency, active runtime state, plugin files and plugin
data.

## Implementation

`tools/knowledge_engine/marketplace_uninstall_coordinator.py`

## Implemented

- installed-plugin and registry validation;
- reverse-dependency protection;
- active-plugin deactivation;
- optional plugin-data preservation;
- atomic movement of installed files to transaction backup;
- atomic runtime-registry removal;
- rollback restoration of files and registry;
- previous-version reactivation after rollback;
- health validation of the restored plugin;
- durable JSONL uninstall journal;
- deterministic failure results.

## Default-deny rules

Uninstall is rejected when:

- the plugin is not installed;
- the plugin is missing from the runtime registry;
- the installed manifest is missing;
- any currently installed plugin depends on the target plugin.

## Data policy

Plugin data is preserved by default under the uninstall transaction workspace.

The caller may explicitly disable preservation.

## Safety properties

- no dependent plugin is silently broken;
- failed registry removal restores installed files;
- failed uninstall restores the prior registry;
- previously active plugins are reactivated after rollback;
- successful uninstall removes the runtime registry entry;
- all actions are journaled.

## Next phase

Phase 21B23D7 — Final Marketplace Runtime Certification
