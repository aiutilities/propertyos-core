import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentMemory,
  AiAgentMemoryType,
} from '../types/ai-agent-memory.types';


@Injectable()
export class AiAgentMemoryService {

  private readonly memories:
    AiAgentMemory[] = [];


  store(
    memory: AiAgentMemory,
  ): AiAgentMemory {

    this.memories.push(
      memory,
    );

    return memory;
  }


  find(
    agentId: string,
    key: string,
  ): AiAgentMemory | undefined {

    return this.memories.find(
      memory =>
        memory.agentId === agentId &&
        memory.key === key,
    );
  }


  list(
    agentId: string,
    type?: AiAgentMemoryType,
  ): AiAgentMemory[] {

    return this.memories.filter(
      memory =>
        memory.agentId === agentId &&
        (
          !type ||
          memory.memoryType === type
        ),
    );
  }


  clear(
    agentId: string,
  ): void {

    const remaining =
      this.memories.filter(
        memory =>
          memory.agentId !== agentId,
      );

    this.memories.length = 0;

    this.memories.push(
      ...remaining,
    );
  }
}
