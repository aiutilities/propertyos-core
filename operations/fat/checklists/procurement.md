# PropertyOS FAT — Procurement Lifecycle

## Preconditions

- [ ] Isolated environment is active.
- [ ] Test property and users exist.
- [ ] Test vendor data may be created.

## Acceptance Checks

- [ ] Purchase request creation succeeds.
- [ ] Purchase request transition succeeds.
- [ ] RFQ creation succeeds.
- [ ] Quotation capture succeeds.
- [ ] Quotation comparison succeeds.
- [ ] Purchase order creation succeeds.
- [ ] Goods receipt creation succeeds.
- [ ] Invoice matching succeeds.
- [ ] Payment request creation succeeds.
- [ ] Invalid transition is rejected.
- [ ] Unauthorized transition is rejected.

## Evidence

- [ ] Procurement identifiers are recorded.
- [ ] State transitions are preserved.
- [ ] Rejected transition evidence is preserved.
- [ ] Founder result is recorded.

## Safety Boundary

No real vendor, invoice, payment, or banking data may be used.
