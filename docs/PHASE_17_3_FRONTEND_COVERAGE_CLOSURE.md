# Phase 17.3 Frontend Coverage Closure

## Repository checkpoint

- Branch: `feature/phase-16f-marketplace-upgrade-runtime`
- Baseline HEAD: `490b4d5`
- Scope: controller-backed launch-facing frontend coverage
- Backend changes: none
- API contract changes: none
- Database changes: none
- ForgeOS changes: none

## Acceptance result

All controller-backed, launch-facing backend modules have confirmed frontend coverage or an accepted alias within an existing frontend surface.

| Backend module | Controllers | Covered | Evidence |
|---|---:|---:|---|
| access-control | 1 | Yes | `/access, useAccessControl, AccessDashboard` |
| admin | 1 | Yes | `/dashboard, AdminShell` |
| agreement | 1 | Yes | `/leases, Agreement, Lease` |
| ai | 2 | Yes | `/operations, AI` |
| audit | 1 | Yes | `/operations, Audit` |
| auth | 1 | Yes | `/login, ProtectedRoute` |
| communications | 1 | Yes | `/communications, Communications` |
| configuration | 1 | Yes | `Configuration` |
| credential | 1 | Yes | `/access, Credential` |
| distribution | 1 | Yes | `/communications, Distribution` |
| document | 1 | Yes | `/docs, Document` |
| facility | 1 | Yes | `/facilities, Facility` |
| forms | 1 | Yes | `/forms, useForms` |
| helpdesk | 1 | Yes | `/helpdesk, Helpdesk` |
| identity | 1 | Yes | `/staff, /tenants, Identity` |
| inventory | 8 | Yes | `/inventory, Inventory` |
| invoice | 1 | Yes | `/invoices, Invoice` |
| maintenance | 1 | Yes | `/maintenance, Maintenance` |
| maps | 1 | Yes | `/maps, useMaps` |
| marketplace | 8 | Yes | `/plugins/marketplace, Marketplace` |
| notification | 1 | Yes | `/notifications, Notification` |
| payment | 3 | Yes | `/rent-ledgers, Payment` |
| places | 1 | Yes | `/places, usePlaces` |
| plugin | 7 | Yes | `/plugins, Plugin` |
| procurement | 8 | Yes | `/procurement, Procurement` |
| property | 1 | Yes | `/properties, Property` |
| receipt | 1 | Yes | `/receipts, Receipt` |
| rent | 1 | Yes | `/rent-ledgers, Rent` |
| report | 1 | Yes | `/reports, Report` |
| reservation | 1 | Yes | `/reservations, Reservation` |
| scheduler | 1 | Yes | `/scheduler, Scheduler` |
| search | 1 | Yes | `/search, Search` |
| staff | 1 | Yes | `/staff, Staff` |
| tenant | 1 | Yes | `/tenants, Tenant` |
| theme | 2 | Yes | `/themes, Theme` |
| vehicle | 1 | Yes | `/vehicles, Vehicle` |
| vendor | 1 | Yes | `/vendors, Vendor` |
| workflow | 1 | Yes | `/workflows, Workflow` |

## Major Phase 17.3 deliveries

- Inventory dashboard and complete operational lifecycle coverage
- Inventory items and master data
- Stores and bins
- Stock balances, ledger and movement history
- Stock adjustments
- Stock reservations
- Stock transfers
- Material issues and returns
- Cycle counts
- Maps workspace
- Forms lifecycle management
- Places search and discovery workspace

## Inventory routes

- `/inventory`
- `/inventory/adjustments`
- `/inventory/adjustments/[id]`
- `/inventory/adjustments/new`
- `/inventory/brands`
- `/inventory/categories`
- `/inventory/cycle-counts`
- `/inventory/cycle-counts/[id]`
- `/inventory/cycle-counts/new`
- `/inventory/items`
- `/inventory/items/[id]`
- `/inventory/items/new`
- `/inventory/ledger`
- `/inventory/material-issues`
- `/inventory/material-issues/[id]`
- `/inventory/material-issues/new`
- `/inventory/material-returns`
- `/inventory/material-returns/[id]`
- `/inventory/material-returns/new`
- `/inventory/reservations`
- `/inventory/reservations/[id]`
- `/inventory/reservations/new`
- `/inventory/stock`
- `/inventory/stores`
- `/inventory/transfers`
- `/inventory/transfers/[id]`
- `/inventory/transfers/new`
- `/inventory/units`

## Final closure conditions

- Alias-aware controller coverage audit reports no gaps.
- All newly delivered routes remain protected.
- Frontend typecheck passed during implementation checkpoints.
- Pilot frontend contract tests passed during implementation checkpoints.
- Production builds passed during implementation checkpoints.
- No backend, database, API or ForgeOS contract was changed.

Phase 17.3 is closed.
