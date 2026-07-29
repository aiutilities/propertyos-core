# ForgeOS Platform Boundary

## Decision

ForgeOS will initially be developed inside the PropertyOS repository under the
top-level forgeos directory.

## Mandatory dependency rule

PropertyOS may depend on ForgeOS.

ForgeOS must not depend on PropertyOS.

## ForgeOS concepts

ForgeOS may understand generic concepts such as:

- communication request
- recipient
- channel
- provider
- template
- attachment
- retry
- fallback
- delivery status
- audit metadata

## PropertyOS concepts

ForgeOS must not understand product-specific concepts such as:

- visitor
- tenant
- lease
- maintenance request
- reservation
- purchase order

PropertyOS must translate its business events into generic ForgeOS contracts.

## Incremental migration

The existing PropertyOS notification and communication modules will remain
operational while their reusable capabilities are moved behind ForgeOS
contracts.

They must not be deleted or relocated in one large change.
