export type AiAgentMemoryType =
  | 'SESSION'
  | 'EXPERIENCE'
  | 'KNOWLEDGE';


export interface AiAgentMemory {

  id: string;

  agentId: string;

  memoryType: AiAgentMemoryType;

  key: string;

  value: string;

  createdAt: string;
}
