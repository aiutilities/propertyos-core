import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { PluginModule } from '../plugin/plugin.module';
import { WorkflowController } from './controllers/workflow.controller';
import { PostgresWorkflowRepository } from './repositories/postgres-workflow.repository';
import { WORKFLOW_REPOSITORY } from './repositories/workflow-repository.interface';
import { WorkflowService } from './services/workflow.service';
import { WorkflowBootstrapService } from './bootstrap/workflow-bootstrap.service';

@Module({
  imports: [DatabaseModule, PluginModule],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowBootstrapService,
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: PostgresWorkflowRepository,
    },
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
