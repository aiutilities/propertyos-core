# PropertyOS Staff and Vehicle Certification

## Repository

- Branch: `feature/phase-15c3-lease-specialist`
- HEAD before certification: `6adc095b41f169df4858ce333efbd059e39a9083`

## Capability model

Staff and Vehicle are operational registry capabilities with:

- authenticated management APIs
- permission-controlled administration
- resident-facing views
- security-facing lookup views
- search-provider integration
- persistence-backed lifecycle operations

The certified operational relationships are:

`Property → Staff Registry → Status → Attendance → Security Lookup`

`Property → Vehicle Registry → Status → Movement → Security Lookup`

## Staff implementation

- `backend/src/core/staff/bootstrap/staff-bootstrap.service.ts`
- `backend/src/core/staff/controllers/staff.controller.ts`
- `backend/src/core/staff/dto/create-staff.dto.ts`
- `backend/src/core/staff/dto/record-staff-attendance.dto.ts`
- `backend/src/core/staff/dto/update-staff-status.dto.ts`
- `backend/src/core/staff/dto/update-staff.dto.ts`
- `backend/src/core/staff/index.ts`
- `backend/src/core/staff/repositories/postgres-staff.repository.ts`
- `backend/src/core/staff/repositories/staff.repository.ts`
- `backend/src/core/staff/services/staff.service.ts`
- `backend/src/core/staff/staff-search-provider.service.ts`
- `backend/src/core/staff/staff.constants.ts`
- `backend/src/core/staff/staff.module.ts`
- `backend/src/core/staff/types/staff.types.ts`

## Vehicle implementation

- `backend/src/core/vehicle/bootstrap/vehicle-bootstrap.service.ts`
- `backend/src/core/vehicle/controllers/vehicle.controller.ts`
- `backend/src/core/vehicle/dto/create-vehicle.dto.ts`
- `backend/src/core/vehicle/dto/record-vehicle-movement.dto.ts`
- `backend/src/core/vehicle/dto/update-vehicle-status.dto.ts`
- `backend/src/core/vehicle/dto/update-vehicle.dto.ts`
- `backend/src/core/vehicle/index.ts`
- `backend/src/core/vehicle/repositories/postgres-vehicle.repository.ts`
- `backend/src/core/vehicle/repositories/vehicle.repository.ts`
- `backend/src/core/vehicle/services/vehicle.service.ts`
- `backend/src/core/vehicle/types/vehicle.types.ts`
- `backend/src/core/vehicle/vehicle-search-provider.service.ts`
- `backend/src/core/vehicle/vehicle.constants.ts`
- `backend/src/core/vehicle/vehicle.module.ts`

## Required migrations

- `backend/src/database/migrations/core/026-create-core-staff-tables.sql`
- `backend/src/database/migrations/core/025-create-core-vehicle-tables.sql`

## Frontend routes

- `frontend/src/app/staff/page.tsx`
- `frontend/src/app/staff/new/page.tsx`
- `frontend/src/app/staff/[id]/page.tsx`
- `frontend/src/app/resident/staff/page.tsx`
- `frontend/src/app/resident/staff/new/page.tsx`
- `frontend/src/app/security/staff/page.tsx`
- `frontend/src/app/vehicles/page.tsx`
- `frontend/src/app/vehicles/new/page.tsx`
- `frontend/src/app/vehicles/[id]/page.tsx`
- `frontend/src/app/resident/vehicles/page.tsx`
- `frontend/src/app/resident/vehicles/new/page.tsx`
- `frontend/src/app/security/vehicles/page.tsx`

## Frontend components

- `frontend/src/components/staff/StaffDashboard.tsx`
- `frontend/src/components/staff/StaffDetails.tsx`
- `frontend/src/components/staff/StaffForm.tsx`
- `frontend/src/components/staff/StaffTable.tsx`
- `frontend/src/components/staff/ResidentStaffDirectory.tsx`
- `frontend/src/components/staff/SecurityStaffLookup.tsx`
- `frontend/src/components/vehicle/VehicleDashboard.tsx`
- `frontend/src/components/vehicle/VehicleDetails.tsx`
- `frontend/src/components/vehicle/VehicleForm.tsx`
- `frontend/src/components/vehicle/VehicleTable.tsx`
- `frontend/src/components/vehicle/ResidentVehicleList.tsx`
- `frontend/src/components/vehicle/SecurityVehicleLookup.tsx`

## Test evidence

- `backend/src/core/plugin/runtime/plugin-runtime-portfolio-route.integration-spec.ts`
- `backend/tests/integration/staff.integration-spec.ts`
- `backend/tests/integration/vehicle.integration-spec.ts`

## Verification

- Related test files discovered: 3
- Staff-specific test files: 1
- Vehicle-specific test files: 1
- Cross-module test files: 1
- Staff persistence and API lifecycle: VERIFIED
- Staff status lifecycle: VERIFIED
- Staff attendance lifecycle: VERIFIED
- Staff resident-facing directory: VERIFIED
- Staff security-facing lookup: VERIFIED
- Vehicle persistence and API lifecycle: VERIFIED
- Vehicle status lifecycle: VERIFIED
- Vehicle movement lifecycle: VERIFIED
- Vehicle resident-facing registry: VERIFIED
- Vehicle security-facing lookup: VERIFIED
- Search-provider integration: VERIFIED
- Permission enforcement: VERIFIED
- Frontend route and component coverage: VERIFIED
- Targeted Operations regression: PASSED
- Backend TypeScript build: PASSED
- Frontend validation: PASSED
- Unfinished-marker scan: PASSED
- Existing untracked KDD and knowledge files were excluded from certification scope.

## Certification decisions

- Staff: **CERTIFIED**
- Vehicle: **CERTIFIED**

The PropertyOS Operations section is complete for the v3.0 release baseline.
