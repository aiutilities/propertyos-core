import {
  Module,
} from '@nestjs/common';

import {
  PostgresModule,
} from '../../database/postgres/postgres.module';
import {
  AuthModule,
} from '../auth/auth.module';
import {
  PluginModule,
} from '../plugin/plugin.module';
import {
  MarketplacePublisherController,
} from './controllers/marketplace-publisher.controller';
import {
  MarketplaceInstallController,
} from './install/controllers/marketplace-install.controller';
import {
  MarketplaceUpgradeController,
} from './upgrade/controllers/marketplace-upgrade.controller';
import {
  MarketplaceRollbackController,
} from './rollback/controllers/marketplace-rollback.controller';
import {
  MarketplaceResolutionController,
} from './resolution/controllers/marketplace-resolution.controller';
import {
  MarketplaceUninstallController,
} from './uninstall/controllers/marketplace-uninstall.controller';
import {
  MarketplaceController,
} from './controllers/marketplace.controller';
import {
  MarketplacePublisherRepository,
} from './repositories/marketplace-publisher.repository';
import {
  MarketplaceRepository,
} from './repositories/marketplace.repository';
import {
  PostgresMarketplacePublisherRepository,
} from './repositories/postgres-marketplace-publisher.repository';
import {
  PostgresMarketplaceRepository,
} from './repositories/postgres-marketplace.repository';
import {
  MarketplaceCatalogService,
} from './services/marketplace-catalog.service';
import {
  MarketplaceInstallService,
} from './install/services/marketplace-install.service';
import {
  MarketplaceUpgradeService,
} from './upgrade/services/marketplace-upgrade.service';
import {
  MarketplaceRollbackService,
} from './rollback/services/marketplace-rollback.service';
import {
  MarketplaceResolutionPlannerService,
} from './resolution/services/marketplace-resolution-planner.service';
import {
  MarketplaceUninstallService,
} from './uninstall/services/marketplace-uninstall.service';
import {
  MarketplacePublisherService,
} from './services/marketplace-publisher.service';
import {
  MarketplaceVersionController,
} from './version/controllers/marketplace-version.controller';
import {
  MarketplaceVersionRepository,
} from './version/repositories/marketplace-version.repository';
import {
  PostgresMarketplaceVersionRepository,
} from './version/repositories/postgres-marketplace-version.repository';
import {
  MarketplaceVersionService,
} from './version/services/marketplace-version.service';

@Module({
  imports: [
    PostgresModule,
    AuthModule,
    PluginModule,
  ],
  controllers: [
    MarketplacePublisherController,
    MarketplaceInstallController,
    MarketplaceUpgradeController,
    MarketplaceRollbackController,
    MarketplaceResolutionController,
    MarketplaceUninstallController,
    MarketplaceVersionController,
    MarketplaceController,
  ],
  providers: [
    MarketplaceCatalogService,
    MarketplaceInstallService,
    MarketplaceUpgradeService,
    MarketplaceRollbackService,
    MarketplaceResolutionPlannerService,
    MarketplaceUninstallService,
    MarketplacePublisherService,
    MarketplaceVersionService,
    {
      provide:
        MarketplaceRepository,
      useClass:
        PostgresMarketplaceRepository,
    },
    {
      provide:
        MarketplacePublisherRepository,
      useClass:
        PostgresMarketplacePublisherRepository,
    },
    {
      provide:
        MarketplaceVersionRepository,
      useClass:
        PostgresMarketplaceVersionRepository,
    },
  ],
})
export class MarketplaceModule {}
