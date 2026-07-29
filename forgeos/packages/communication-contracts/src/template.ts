import { CommunicationChannel } from './channel';

export interface CommunicationTemplateDefinition {
  key: string;
  version: string;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  requiredVariables?: readonly string[];
  providerTemplateId?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
}

export interface RenderedCommunicationTemplate {
  key: string;
  version: string;
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  providerTemplateId?: string;
  metadata?: Record<string, unknown>;
}
