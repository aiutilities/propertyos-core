# PropertyOS FAT — Inventory Lifecycle

## Preconditions

- [ ] Isolated environment is active.
- [ ] Test item and storage hierarchy exist.
- [ ] Authorized FAT inventory writes may occur.

## Acceptance Checks

- [ ] Inventory item creation succeeds.
- [ ] Store and bin configuration succeeds.
- [ ] Goods receipt posts stock correctly.
- [ ] Stock transfer posts correctly.
- [ ] Material issue posts correctly.
- [ ] Material return posts correctly.
- [ ] Stock adjustment posts correctly.
- [ ] Reservation and allocation behave correctly.
- [ ] Batch tracking behaves correctly.
- [ ] Insufficient-stock operation is rejected.
- [ ] Duplicate mutation protection behaves correctly.

## Evidence

- [ ] Stock ledger evidence is preserved.
- [ ] Before-and-after quantities are recorded.
- [ ] Rejected transaction evidence is preserved.
- [ ] Founder result is recorded.

## Safety Boundary

Only isolated synthetic inventory may be changed.
