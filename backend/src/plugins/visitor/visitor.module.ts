import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../../core/identity/identity.module';
import { EventBusModule } from '../../core/eventbus/eventbus.module';

import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';
import { VISITOR_REPOSITORY } from './repositories/visitor-repository.interface';
import { PostgresVisitorRepository } from './repositories/postgres-visitor.repository';

@Module({
  imports: [PostgresModule, IdentityModule, EventBusModule],
  controllers: [VisitorController],
  providers: [
    VisitorService,
    {
      provide: VISITOR_REPOSITORY,
      useClass: PostgresVisitorRepository,
    },
  ],
  exports: [VisitorService],
})
export class VisitorModule {}
