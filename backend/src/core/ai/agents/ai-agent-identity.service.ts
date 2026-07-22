import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentIdentity,
} from '../types/ai-agent.types';


@Injectable()
export class AiAgentIdentityService {


  create(
    identity: AiAgentIdentity,
  ): AiAgentIdentity {

    return {
      ...identity,

      createdAt:
        identity.createdAt ??
        new Date().toISOString(),
    };
  }


  canExecute(
    agent: AiAgentIdentity,
    capability: string,
  ): boolean {

    return (
      agent.status === 'ACTIVE' &&
      agent.capabilities.includes(
        capability,
      )
    );
  }


  hasPermission(
    agent: AiAgentIdentity,
    permission: string,
  ): boolean {

    return agent.permissions.includes(
      permission,
    );
  }
}
