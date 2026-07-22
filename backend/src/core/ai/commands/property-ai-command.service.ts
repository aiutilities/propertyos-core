import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyOperationsAiOrchestratorService,
} from '../orchestration/property-operations-ai-orchestrator.service';

import {
  PropertyAiCommandRequest,
  PropertyAiCommandResult,
} from '../types/property-ai-command.types';


@Injectable()
export class PropertyAiCommandService {


  constructor(
    private readonly orchestrator:
      PropertyOperationsAiOrchestratorService,
  ) {}


  execute(
    request:
      PropertyAiCommandRequest,
  ):
    PropertyAiCommandResult {


    const result =
      this.orchestrator.execute({

        propertyId:
          request.propertyId,

        capability:
          request.command,

        reason:
          request.reason,

      });


    return {

      propertyId:
        result.propertyId,

      command:
        request.command,

      decision:
        result.decision,

      confidence:
        result.confidence,

      proposals:
        result.proposals,

    };

  }

}
