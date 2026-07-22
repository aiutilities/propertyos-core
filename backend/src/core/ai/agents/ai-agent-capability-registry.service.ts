import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentCapability,
} from '../types/ai-agent-capability.types';


@Injectable()
export class AiAgentCapabilityRegistryService {

  private readonly capabilities:
    AiAgentCapability[] = [];


  register(
    capability: AiAgentCapability,
  ): AiAgentCapability {

    this.capabilities.push(
      capability,
    );

    return capability;
  }


  get(
    id: string,
  ): AiAgentCapability | undefined {

    return this.capabilities.find(
      capability =>
        capability.id === id,
    );
  }


  list(): AiAgentCapability[] {

    return [
      ...this.capabilities,
    ];
  }


  isAllowed(
    id: string,
  ): boolean {

    const capability =
      this.get(id);

    return Boolean(
      capability &&
      capability.enabled,
    );
  }
}
