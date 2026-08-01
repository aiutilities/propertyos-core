import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import {
  WorkflowService,
} from '@propertyos/core-contracts';
import {
  RESERVATION_WORKFLOW_CODE,
} from '../reservation.constants';
import {
  RESERVATION_WORKFLOW_DEFINITION,
} from '../reservation-workflow.definition';

@Injectable()
export class ReservationWorkflowBootstrapService
  implements OnApplicationBootstrap
{
  constructor(
    private readonly workflowService:
      WorkflowService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.workflowService
        .getDefinitionByCode(
          RESERVATION_WORKFLOW_CODE,
        );
    } catch (error) {
      if (
        !(error instanceof NotFoundException)
      ) {
        throw error;
      }

      await this.workflowService
        .createDefinition(
          RESERVATION_WORKFLOW_DEFINITION,
        );
    }
  }
}
