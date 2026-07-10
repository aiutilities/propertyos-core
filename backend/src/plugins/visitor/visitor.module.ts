import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../../core/identity/identity.module';
import { EventBusModule } from '../../core/eventbus/eventbus.module';
import { SchedulerModule } from '../../core/scheduler';
import { SearchModule } from '../../core/search';

import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';
import { VISITOR_REPOSITORY } from './repositories/visitor-repository.interface';
import { PostgresVisitorRepository } from './repositories/postgres-visitor.repository';
import { VisitorSearchProviderService } from './visitor-search-provider.service';

@Module({
  imports: [PostgresModule, IdentityModule, EventBusModule, SchedulerModule, SearchModule],
  controllers: [VisitorController],
  providers: [
    VisitorService,
    VisitorSearchProviderService,
    {
      provide: VISITOR_REPOSITORY,
      useClass: PostgresVisitorRepository,
    },
  ],
  exports: [VisitorService],
})
export class VisitorModule {}
