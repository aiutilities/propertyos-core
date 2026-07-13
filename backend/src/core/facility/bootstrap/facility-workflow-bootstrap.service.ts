import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { WorkflowService } from '../../workflow/services/workflow.service';
import {
  FACILITY_ASSET_WORKFLOW_CODE,
} from '../facility.constants';
import {
  FACILITY_ASSET_WORKFLOW_DEFINITION,
} from '../facility-workflow.definition';

@Injectable()
export class FacilityWorkflowBootstrapService
  implements OnApplicationBootstrap
{
  constructor(
    private readonly workflowService: WorkflowService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.workflowService.getDefinitionByCode(
        FACILITY_ASSET_WORKFLOW_CODE,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      await this.workflowService.createDefinition(
        FACILITY_ASSET_WORKFLOW_DEFINITION,
      );
    }
  }
}
