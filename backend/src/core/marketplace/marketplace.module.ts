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
    MarketplaceVersionController,
    MarketplaceController,
  ],
  providers: [
    MarketplaceCatalogService,
    MarketplaceInstallService,
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
