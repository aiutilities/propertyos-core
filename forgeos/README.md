# ForgeOS

ForgeOS is the reusable, industry-neutral platform being extracted from
PropertyOS.

PropertyOS is currently the first product consuming ForgeOS capabilities.

## Dependency direction

Allowed:

PropertyOS -> ForgeOS

Forbidden:

ForgeOS -> PropertyOS

ForgeOS must never import PropertyOS business modules.

## Initial packages

- @forgeos/communication-contracts
- @forgeos/communication-engine

## Extraction strategy

ForgeOS will remain inside the PropertyOS repository until the Communication
Engine and Form Experience Framework are proven through real PropertyOS usage.

The forgeos directory will then be extracted into its own Git repository while
preserving Git history.
