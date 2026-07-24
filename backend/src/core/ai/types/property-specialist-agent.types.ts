import {
  AiAgentIdentity,
} from './ai-agent.types';


export interface PropertySpecialistAgent {

  domain:
    string;

  agent:
    AiAgentIdentity;

  expertiseWeight?:
    number;

}
