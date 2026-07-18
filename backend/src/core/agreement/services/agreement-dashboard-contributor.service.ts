import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PluginDashboardContributor,
  PluginDashboardMetrics,
  PluginDashboardRegistry,
} from '../../plugin/registries/plugin-dashboard.registry';
import { AgreementService } from './agreement.service';

@Injectable()
export class AgreementDashboardContributorService
  implements
    PluginDashboardContributor,
    OnModuleInit
{
  constructor(
    private readonly registry:
      PluginDashboardRegistry,
    private readonly agreementService:
      AgreementService,
  ) {}

  onModuleInit(): void {
    this.registry.register(
      'agreement',
      [this],
    );
  }

  async contribute():
    Promise<PluginDashboardMetrics> {
    const agreements =
      await this.agreementService
        .listAgreements();

    return {
      activeLeases:
        agreements.filter(
          (agreement) =>
            agreement.status ===
            'ACTIVE',
        ).length,
    };
  }
}
