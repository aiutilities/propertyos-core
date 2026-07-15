# Procurement Frontend Release Audit

## Scope

This release covers the complete PropertyOS procurement purchase-to-pay lifecycle:

1. Purchase Requests
2. Requests for Quotation
3. Vendor Quotations
4. Quotation Comparison
5. Purchase Orders
6. Goods Receipts
7. Invoice Matching
8. Payment Requests
9. Executive Dashboard

## Automated release gates

Run the following commands from the repository:

    cd frontend
    npm run audit:procurement
    npm run typecheck
    npm run build

    cd ../backend
    npm run typecheck
    npm test -- --runInBand tests/integration/procurement.integration-spec.ts

## Release criteria

- Static Procurement audit passes.
- Frontend TypeScript validation passes.
- Frontend production build passes.
- Backend TypeScript validation passes.
- All Procurement integration tests pass.
- Git working tree is clean.
