import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { MetricsModule } from '../metrics/metrics.module';
import { PluginModule } from '../plugin/plugin.module';
import { SearchModule } from '../search';

import { WorkflowController } from './controllers/workflow.controller';
import { PostgresWorkflowRepository } from './repositories/postgres-workflow.repository';
import { WORKFLOW_REPOSITORY } from './repositories/workflow-repository.interface';
import { WorkflowService } from './services/workflow.service';
import { WorkflowExecutionMetricsService } from './services/workflow-execution-metrics.service';
import { WorkflowBootstrapService } from './bootstrap/workflow-bootstrap.service';
import { WorkflowEventSubscriber } from './workflow-event.subscriber';
import { WorkflowSearchProviderService } from './workflow-search-provider.service';

@Module({
  imports: [
    DatabaseModule,
    PluginModule,
    EventBusModule,
    IdentityModule,
    MetricsModule,
    SearchModule,
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowExecutionMetricsService,
    WorkflowService,
    WorkflowBootstrapService,
    WorkflowEventSubscriber,
    WorkflowSearchProviderService,
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: PostgresWorkflowRepository,
    },
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
