import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PluginDashboardContributor,
  PluginDashboardMetrics,
  PluginDashboardRegistry,
} from '../../plugin/registries/plugin-dashboard.registry';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantDashboardContributorService
  implements
    PluginDashboardContributor,
    OnModuleInit
{
  constructor(
    private readonly registry:
      PluginDashboardRegistry,
    private readonly tenantService:
      TenantService,
  ) {}

  onModuleInit(): void {
    this.registry.register(
      'tenant',
      [this],
    );
  }

  async contribute():
    Promise<PluginDashboardMetrics> {
    const [
      tenants,
      occupancy,
    ] = await Promise.all([
      this.tenantService
        .listTenants(),
      this.tenantService
        .getOccupancyCounts(),
    ]);

    return {
      tenants:
        tenants.length,
      activeTenants:
        occupancy.activeTenants,
      occupiedSpaces:
        occupancy.occupiedSpaces,
    };
  }
}
