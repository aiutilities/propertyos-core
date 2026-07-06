import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { PluginModule } from '../plugin/plugin.module';
import { WorkflowController } from './controllers/workflow.controller';
import { PostgresWorkflowRepository } from './repositories/postgres-workflow.repository';
import { WORKFLOW_REPOSITORY } from './repositories/workflow-repository.interface';
import { WorkflowService } from './services/workflow.service';
import { WorkflowBootstrapService } from './bootstrap/workflow-bootstrap.service';
import { WorkflowEventSubscriber } from './workflow-event.subscriber';

@Module({
  imports: [DatabaseModule, PluginModule, EventBusModule],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowBootstrapService,
    WorkflowEventSubscriber,
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: PostgresWorkflowRepository,
    },
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
