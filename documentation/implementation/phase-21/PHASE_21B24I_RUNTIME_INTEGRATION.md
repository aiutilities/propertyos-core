# Phase 21B24I — Runtime Integration

## Status

COMPLETE

## Objective

Connect the certified marketplace repository subsystem to the certified
marketplace runtime upgrade subsystem.

## Implementation

`tools/knowledge_engine/marketplace_runtime_integration.py`

## End-to-end flow

1. verify the repository index signature;
2. validate the repository contract;
3. discover the highest eligible update;
4. enforce host API and update policies;
5. securely download the publisher-signed archive;
6. verify archive SHA-256 and publisher signature;
7. extract through a host-provided extraction boundary;
8. validate extracted plugin ID, version and entrypoint;
9. execute the Phase 21B23D5 upgrade coordinator;
10. commit the runtime registry and installed version.

## Trust boundaries

- repository authenticity is checked before discovery;
- publisher authenticity is checked before archive handoff;
- archive integrity is checked before extraction;
- extracted identity is checked before runtime upgrade;
- runtime activation and rollback remain owned by the certified D5 coordinator.

## Injected host boundaries

The integration coordinator accepts:

- a network fetcher;
- an archive extractor;
- runtime deactivate, activate and health hooks.

This keeps transport and process execution outside the deterministic core.

## Next phase

Phase 21B24J — Final Repository Certification
