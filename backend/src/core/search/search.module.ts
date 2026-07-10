import { Module } from '@nestjs/common';

import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { SearchController } from './controllers/search.controller';
import { SearchProviderRegistry } from './registries/search-provider.registry';
import { SearchService } from './services/search.service';

@Module({
  imports: [EventBusModule, IdentityModule],
  controllers: [SearchController],
  providers: [SearchService, SearchProviderRegistry],
  exports: [SearchService, SearchProviderRegistry],
})
export class SearchModule {}
