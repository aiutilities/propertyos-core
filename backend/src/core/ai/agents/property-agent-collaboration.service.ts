import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentCollaborationService,
} from '../collaboration/ai-agent-collaboration.service';

import {
  PropertyAgentCollaboration,
} from '../types/property-agent-collaboration.types';


@Injectable()
export class PropertyAgentCollaborationService {


  constructor(
    private readonly collaboration:
      AiAgentCollaborationService,
  ) {}


  collaborate(
    input:
      PropertyAgentCollaboration,
  ) {


    const request =
      this.collaboration.create({

        collaborationId:
          `property-collaboration-${Date.now()}`,

        objective:
          input.objective,

        coordinatorAgentId:
          input.coordinatorAgentId,

        participatingAgents:
          input.specialistAgentIds,

        status:
          'CREATED',

        createdAt:
          new Date().toISOString(),

      });


    const active =
      this.collaboration.activate(
        request,
      );


    return this.collaboration.complete(
      active,
    );

  }

}
