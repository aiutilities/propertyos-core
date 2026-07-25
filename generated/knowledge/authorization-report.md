# Authorization Assurance Report

**Status:** PASS

## Summary

| Metric | Value |
|---|---:|
| Controllers | 63 |
| Endpoints | 461 |
| Public endpoints | 7 |
| Authenticated endpoints | 390 |
| Permission-protected endpoints | 64 |
| Permission coverage | 14.10% |
| Permission definitions | 55 |
| Permission references | 180 |
| Blocking violations | 0 |
| Unused permission definitions | 13 |

## Blocking Violations

No blocking authorization violations were detected.

## Governance Findings

Unused permission definitions do not fail the check.

- `ADMIN_MANAGE` → `admin.manage`
- `AGREEMENT_CREATE` → `agreement.create`
- `AGREEMENT_READ` → `agreement.read`
- `DOCUMENT_CREATE` → `document.create`
- `DOCUMENT_READ` → `document.read`
- `FORM_CREATE` → `form.create`
- `FORM_READ` → `form.read`
- `INVOICE_CREATE` → `invoice.create`
- `INVOICE_READ` → `invoice.read`
- `NOTIFICATION_CREATE` → `notification.create`
- `NOTIFICATION_READ` → `notification.read`
- `RENT_CREATE` → `rent.create`
- `RENT_READ` → `rent.read`

## Endpoint Classification

| Classification | Count |
|---|---:|
| Public | 7 |
| Authenticated | 390 |
| Permission protected | 64 |
