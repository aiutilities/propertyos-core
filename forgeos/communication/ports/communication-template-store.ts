import {
  CommunicationChannel,
  CommunicationTemplateDefinition,
} from '../contracts';

export interface FindCommunicationTemplatesInput {
  event?: string;
  key?: string;
  channel?: CommunicationChannel;
  version?: string;
  locale?: string;
}

export interface CommunicationTemplateStore {
  register(
    template: CommunicationTemplateDefinition,
  ): void;

  registerMany(
    templates: readonly CommunicationTemplateDefinition[],
  ): void;

  find(
    input?: FindCommunicationTemplatesInput,
  ): readonly CommunicationTemplateDefinition[];
}
