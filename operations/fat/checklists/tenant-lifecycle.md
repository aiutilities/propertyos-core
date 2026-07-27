# PropertyOS FAT — Tenant Lifecycle

## Preconditions

- [ ] Isolated property and space exist.
- [ ] Authorized FAT test data may be written.
- [ ] Test administrator is authenticated.

## Acceptance Checks

- [ ] Tenant creation succeeds.
- [ ] Tenant details can be retrieved.
- [ ] Tenant details can be updated.
- [ ] Agreement or lease can be created.
- [ ] Tenant can be assigned to the intended space.
- [ ] Rent or billing foundation behaves correctly.
- [ ] Receipt or payment evidence can be generated where supported.
- [ ] Tenant status transition behaves correctly.
- [ ] Invalid lifecycle transitions are rejected.
- [ ] Tenant exit or closure behaves correctly.

## Evidence

- [ ] Tenant and agreement identifiers are recorded.
- [ ] Financial evidence contains no real customer data.
- [ ] Invalid transition evidence is preserved.
- [ ] Founder result is recorded.

## Safety Boundary

Use synthetic tenants and synthetic financial data only.
