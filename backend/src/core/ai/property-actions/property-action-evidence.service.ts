import {
  Injectable,
} from '@nestjs/common';

import {
  AiOrchestrationEvidenceService,
} from '../services/ai-orchestration-evidence.service';

import {
  PropertyActionEvidence,
} from '../types/property-action-evidence.types';


@Injectable()
export class PropertyActionEvidenceService {


  constructor(
    private readonly evidence:
      AiOrchestrationEvidenceService,
  ) {}


  async record(
    event:
      PropertyActionEvidence,
  ): Promise<void> {


    await this.evidence.recordPropertyAction(
      {
        entityType:
          'property-action',

        propertyId:
          event.propertyId,

        action:
          event.action,

        status:
          event.status,

        message:
          event.message,

      },
    );

  }

}
