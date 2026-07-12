import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { WorkflowService } from '../../workflow/services/workflow.service';
import {
  MAINTENANCE_WORKFLOW_CODE,
} from '../maintenance.constants';
import {
  MAINTENANCE_WORKFLOW_DEFINITION,
} from '../maintenance-workflow.definition';

@Injectable()
export class MaintenanceWorkflowBootstrapService
  implements OnApplicationBootstrap
{
  constructor(
    private readonly workflowService: WorkflowService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.workflowService.getDefinitionByCode(
        MAINTENANCE_WORKFLOW_CODE,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      await this.workflowService.createDefinition(
        MAINTENANCE_WORKFLOW_DEFINITION,
      );
    }
  }
}
