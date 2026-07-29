import {
  CommunicationTemplateDefinition,
  RenderedCommunicationTemplate,
} from '../contracts';

import {
  CommunicationTemplateValidationError,
} from './template-registry.error';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

function resolveVariable(
  variables: Record<string, unknown>,
  path: string,
): unknown {
  const segments = path.split('.');

  let current: unknown = variables;

  for (const segment of segments) {
    if (
      typeof current !== 'object' ||
      current === null ||
      !(segment in current)
    ) {
      return undefined;
    }

    current = (
      current as Record<string, unknown>
    )[segment];
  }

  return current;
}

function renderText(
  value: string,
  variables: Record<string, unknown>,
): string {
  return value.replace(
    VARIABLE_PATTERN,
    (_match, variablePath: string) => {
      const resolved = resolveVariable(
        variables,
        variablePath,
      );

      if (
        resolved === undefined ||
        resolved === null
      ) {
        return '';
      }

      return String(resolved);
    },
  );
}

export class CommunicationTemplateRenderer {
  render(
    template: CommunicationTemplateDefinition,
    variables: Record<string, unknown> = {},
  ): RenderedCommunicationTemplate {
    const missingVariables = (
      template.requiredVariables ?? []
    ).filter((variableName) => {
      const value = resolveVariable(
        variables,
        variableName,
      );

      return value === undefined || value === null;
    });

    if (missingVariables.length > 0) {
      throw new CommunicationTemplateValidationError(
        template.key,
        missingVariables,
      );
    }

    return {
      key: template.key,
      version: template.version,
      channel: template.channel,
      subject: template.subject
        ? renderText(template.subject, variables)
        : undefined,
      body: renderText(template.body, variables),
      providerTemplateId:
        template.providerTemplateId,
      metadata: template.metadata,
    };
  }
}
