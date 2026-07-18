import { Type } from '@nestjs/common';
import { join } from 'path';

import { AgreementModule } from '../../agreement/agreement.module';
import { CommunicationsModule } from '../../communications/communications.module';
import { FacilityModule } from '../../facility/facility.module';
import { HelpdeskModule } from '../../helpdesk/helpdesk.module';
import { InventoryModule } from '../../inventory/inventory.module';
import { InvoiceModule } from '../../invoice';
import { MaintenanceModule } from '../../maintenance';
import { ProcurementModule } from '../../procurement';
import { ReceiptModule } from '../../receipt';
import { RentModule } from '../../rent/rent.module';
import { ReportModule } from '../../report';
import { ReservationModule } from '../../reservation';
import { StaffModule } from '../../staff';
import { TenantModule } from '../../tenant/tenant.module';
import { VehicleModule } from '../../vehicle';
import { VendorModule } from '../../vendor';

import { PluginRuntimeBootstrapPlannerService } from './plugin-runtime-bootstrap-planner.service';
import { PluginRuntimeModuleLoaderService } from './plugin-runtime-module-loader.service';
import { PluginRuntimePackageLinkerService } from './plugin-runtime-package-linker.service';

export const BUSINESS_PLUGIN_IDS = [
  'tenant',
  'agreement',
  'rent',
  'receipt',
  'invoice',
  'maintenance',
  'facility',
  'inventory',
  'vehicle',
  'staff',
  'report',
  'reservation',
  'helpdesk',
  'communications',
  'vendor',
  'procurement',
] as const;

export type BusinessPluginId =
  (typeof BUSINESS_PLUGIN_IDS)[number];

export type RuntimeBusinessModuleMap =
  Record<
    BusinessPluginId,
    Type<unknown>
  >;

export interface RuntimeBusinessModuleOptions {
  externalPluginIds?:
    readonly string[];
  runtimeRoot?: string;
}

const MONOLITH_BUSINESS_MODULES:
  RuntimeBusinessModuleMap = {
    tenant: TenantModule,
    agreement: AgreementModule,
    rent: RentModule,
    receipt: ReceiptModule,
    invoice: InvoiceModule,
    maintenance:
      MaintenanceModule,
    facility: FacilityModule,
    inventory: InventoryModule,
    vehicle: VehicleModule,
    staff: StaffModule,
    report: ReportModule,
    reservation:
      ReservationModule,
    helpdesk: HelpdeskModule,
    communications:
      CommunicationsModule,
    vendor: VendorModule,
    procurement:
      ProcurementModule,
  };

export function requestedExternalPluginIds(
  value =
    process.env
      .PROPERTYOS_EXTERNAL_PLUGINS ??
    '',
): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(
          (item) =>
            item
              .trim()
              .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ).sort();
}

export function defaultPluginRuntimeRoot():
  string {
  return (
    process.env
      .PROPERTYOS_PLUGIN_RUNTIME_ROOT ??
    join(
      process.cwd(),
      'plugins',
      '.installed',
    )
  );
}

export function resolveRuntimeBusinessModules(
  options:
    RuntimeBusinessModuleOptions = {},
): RuntimeBusinessModuleMap {
  const externalPluginIds =
    options.externalPluginIds ??
    requestedExternalPluginIds();

  if (
    externalPluginIds.length === 0
  ) {
    return {
      ...MONOLITH_BUSINESS_MODULES,
    };
  }

  const unknown =
    externalPluginIds.filter(
      (pluginId) =>
        !BUSINESS_PLUGIN_IDS.includes(
          pluginId as
            BusinessPluginId,
        ),
    );

  if (unknown.length > 0) {
    throw new Error(
      `Unknown external business plugins: ` +
        `${unknown.join(', ')}`,
    );
  }

  const runtimeRoot =
    options.runtimeRoot ??
      defaultPluginRuntimeRoot();

  new PluginRuntimePackageLinkerService()
    .prepare(
      runtimeRoot,
      externalPluginIds,
    );

  const planner =
    new PluginRuntimeBootstrapPlannerService(
      new PluginRuntimeModuleLoaderService(),
    );

  const plan = planner.plan(
    externalPluginIds,
    runtimeRoot,
  );

  if (!plan.readyToBootstrap) {
    const failures =
      plan.candidates
        .filter(
          (candidate) =>
            candidate.status !==
              'READY',
        )
        .map(
          (candidate) =>
            `${candidate.pluginId}: ` +
            `${candidate.reasons.join('; ')}`,
        );

    throw new Error(
      `External plugin bootstrap plan is not ready: ` +
        `${failures.join(' | ')}`,
    );
  }

  const resolved:
    RuntimeBusinessModuleMap = {
      ...MONOLITH_BUSINESS_MODULES,
    };

  for (
    const candidate
    of plan.candidates
  ) {
    if (!candidate.runtime) {
      throw new Error(
        `External runtime module was not loaded: ` +
          `${candidate.pluginId}`,
      );
    }

    resolved[
      candidate.pluginId as
        BusinessPluginId
    ] =
      candidate.runtime.moduleClass;
  }

  return resolved;
}
