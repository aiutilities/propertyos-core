# PropertyOS Source Procurement Certification

## Repository

- Branch: `feature/phase-15c3-lease-specialist`
- HEAD before certification: `035282cd814cc86b892da0be099b26df6ea2d080`

## Certification scope

- Purchase Request
- RFQ
- Quotation
- Quotation Comparison

The certified Source Procurement lifecycle is:

`Purchase Request → Approval → RFQ → Vendor Invitation → Quotation → Evaluation → Comparison`

Purchase Order, Goods Receipt, Invoice Match and Payment Request remain outside this phase.

## Architecture

- Source Procurement is implemented inside `backend/src/core/procurement`.
- Vendor eligibility and participation are supplied by `backend/src/core/vendor`.
- Each transactional capability has its own controller, service and repository.
- Quotation Comparison is a calculated sourcing capability backed by quotation and RFQ data.

## Implementation files

- `backend/src/core/procurement/bootstrap/procurement-bootstrap.service.ts`
- `backend/src/core/procurement/controllers/purchase-request.controller.ts`
- `backend/src/core/procurement/controllers/procurement-rfq.controller.ts`
- `backend/src/core/procurement/controllers/procurement-quotation.controller.ts`
- `backend/src/core/procurement/controllers/procurement-quotation-comparison.controller.ts`
- `backend/src/core/procurement/dto/create-purchase-request.dto.ts`
- `backend/src/core/procurement/dto/update-purchase-request.dto.ts`
- `backend/src/core/procurement/dto/transition-purchase-request.dto.ts`
- `backend/src/core/procurement/dto/reject-purchase-request.dto.ts`
- `backend/src/core/procurement/dto/create-procurement-rfq.dto.ts`
- `backend/src/core/procurement/dto/update-procurement-rfq.dto.ts`
- `backend/src/core/procurement/dto/transition-procurement-rfq.dto.ts`
- `backend/src/core/procurement/dto/decline-procurement-rfq.dto.ts`
- `backend/src/core/procurement/dto/create-procurement-quotation.dto.ts`
- `backend/src/core/procurement/dto/update-procurement-quotation.dto.ts`
- `backend/src/core/procurement/dto/transition-procurement-quotation.dto.ts`
- `backend/src/core/procurement/quotation/quotation-comparison.types.ts`
- `backend/src/core/procurement/repositories/purchase-request.repository.ts`
- `backend/src/core/procurement/repositories/postgres-purchase-request.repository.ts`
- `backend/src/core/procurement/repositories/procurement-rfq.repository.ts`
- `backend/src/core/procurement/repositories/postgres-procurement-rfq.repository.ts`
- `backend/src/core/procurement/repositories/procurement-quotation.repository.ts`
- `backend/src/core/procurement/repositories/postgres-procurement-quotation.repository.ts`
- `backend/src/core/procurement/services/purchase-request.service.ts`
- `backend/src/core/procurement/services/procurement-rfq.service.ts`
- `backend/src/core/procurement/services/procurement-quotation.service.ts`
- `backend/src/core/procurement/services/procurement-quotation-comparison.service.ts`
- `backend/src/core/procurement/procurement.constants.ts`
- `backend/src/core/procurement/procurement.module.ts`
- `backend/src/core/procurement/types/procurement.types.ts`

## Vendor dependency files

- `backend/src/core/vendor/vendor.module.ts`
- `backend/src/core/vendor/controllers/vendor.controller.ts`
- `backend/src/core/vendor/services/vendor.service.ts`
- `backend/src/core/vendor/repositories/vendor.repository.ts`
- `backend/src/core/vendor/repositories/postgres-vendor.repository.ts`
- `backend/src/core/vendor/types/vendor.types.ts`

## Required migrations

- `backend/src/database/migrations/core/031-create-core-vendor-tables.sql`
- `backend/src/database/migrations/core/032-create-core-procurement-tables.sql`

## Frontend routes

- `frontend/src/app/procurement/requests/page.tsx`
- `frontend/src/app/procurement/requests/new/page.tsx`
- `frontend/src/app/procurement/requests/[id]/page.tsx`
- `frontend/src/app/procurement/rfqs/page.tsx`
- `frontend/src/app/procurement/rfqs/new/page.tsx`
- `frontend/src/app/procurement/rfqs/[id]/page.tsx`
- `frontend/src/app/procurement/quotations/page.tsx`
- `frontend/src/app/procurement/quotations/new/page.tsx`
- `frontend/src/app/procurement/quotations/[id]/page.tsx`
- `frontend/src/app/procurement/rfqs/[id]/comparison/page.tsx`
- `frontend/src/app/procurement/comparison/page.tsx`

## Frontend components

- `frontend/src/components/procurement/PurchaseRequestDashboard.tsx`
- `frontend/src/components/procurement/PurchaseRequestDetails.tsx`
- `frontend/src/components/procurement/PurchaseRequestForm.tsx`
- `frontend/src/components/procurement/PurchaseRequestMetrics.tsx`
- `frontend/src/components/procurement/PurchaseRequestStatusBadge.tsx`
- `frontend/src/components/procurement/PurchaseRequestTable.tsx`
- `frontend/src/components/procurement/RfqDashboard.tsx`
- `frontend/src/components/procurement/RfqDetails.tsx`
- `frontend/src/components/procurement/RfqForm.tsx`
- `frontend/src/components/procurement/RfqStatusBadge.tsx`
- `frontend/src/components/procurement/QuotationDashboard.tsx`
- `frontend/src/components/procurement/QuotationDetails.tsx`
- `frontend/src/components/procurement/QuotationForm.tsx`
- `frontend/src/components/procurement/QuotationStatusBadge.tsx`
- `frontend/src/components/procurement/QuotationComparisonMatrix.tsx`
- `frontend/src/components/procurement/QuotationComparisonSelector.tsx`

## Test evidence

- `backend/tests/integration/procurement.integration-spec.ts`
- `backend/tests/integration/vendor.integration-spec.ts`
- `backend/src/core/plugin/runtime/plugin-runtime-portfolio-route.integration-spec.ts`

## Verification

- Purchase Request persistence and API lifecycle: VERIFIED

- Purchase Request approval lifecycle: VERIFIED

- RFQ creation from approved Purchase Request: VERIFIED

- RFQ vendor invitation lifecycle: VERIFIED

- RFQ issue, close, cancel and expiry lifecycle: VERIFIED

- Quotation persistence and API lifecycle: VERIFIED

- Quotation RFQ and Vendor linkage: VERIFIED

- Quotation transition lifecycle: VERIFIED

- Quotation Comparison calculation: VERIFIED

- Vendor dependency lifecycle: VERIFIED

- Permission enforcement: VERIFIED

- Event publication: VERIFIED

- Audit integration: VERIFIED

- Frontend route coverage: VERIFIED

- Frontend component coverage: VERIFIED

- Targeted Source Procurement regression: PASSED

- Backend TypeScript build: PASSED

- Frontend validation: PASSED

- Unfinished-marker scan: PASSED

- Existing untracked KDD and knowledge files were excluded from certification scope.

## Certification decisions

- Purchase Request: **CERTIFIED**
- RFQ: **CERTIFIED**
- Quotation: **CERTIFIED**
- Comparison: **CERTIFIED**
