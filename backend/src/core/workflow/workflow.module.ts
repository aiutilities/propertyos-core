import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { WorkflowController } from './controllers/workflow.controller';
import { PostgresWorkflowRepository } from './repositories/postgres-workflow.repository';
import { WORKFLOW_REPOSITORY } from './repositories/workflow-repository.interface';
import { WorkflowService } from './services/workflow.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: PostgresWorkflowRepository,
    },
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
