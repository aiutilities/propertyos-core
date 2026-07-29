import {
  CommunicationChannel,
  CommunicationTemplateDefinition,
} from '../contracts';

import {
  CommunicationTemplateNotFoundError,
} from './template-registry.error';

function buildTemplateIdentity(
  template: CommunicationTemplateDefinition,
): string {
  return [
    template.key,
    template.channel,
    template.version,
    template.locale ?? 'default',
  ].join(':');
}

export interface ResolveTemplateRequest {
  key: string;
  channel: CommunicationChannel;
  version?: string;
  locale?: string;
}

export class CommunicationTemplateRegistry {
  private readonly templates = new Map<
    string,
    CommunicationTemplateDefinition
  >();

  register(template: CommunicationTemplateDefinition): void {
    this.templates.set(
      buildTemplateIdentity(template),
      template,
    );
  }

  registerMany(
    templates: readonly CommunicationTemplateDefinition[],
  ): void {
    for (const template of templates) {
      this.register(template);
    }
  }

  resolve(
    request: ResolveTemplateRequest,
  ): CommunicationTemplateDefinition {
    const candidates = this.list().filter((template) => {
      if (template.key !== request.key) {
        return false;
      }

      if (template.channel !== request.channel) {
        return false;
      }

      if (
        request.version &&
        template.version !== request.version
      ) {
        return false;
      }

      return true;
    });

    const exactLocale = request.locale
      ? candidates.find(
          (template) =>
            template.locale === request.locale,
        )
      : undefined;

    const defaultLocale = candidates.find(
      (template) => !template.locale,
    );

    const selected =
      exactLocale ??
      defaultLocale ??
      candidates[0];

    if (!selected) {
      throw new CommunicationTemplateNotFoundError(
        request.key,
        request.channel,
        request.version,
        request.locale,
      );
    }

    return selected;
  }

  list(): CommunicationTemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  remove(
    template: CommunicationTemplateDefinition,
  ): boolean {
    return this.templates.delete(
      buildTemplateIdentity(template),
    );
  }

  clear(): void {
    this.templates.clear();
  }
}
