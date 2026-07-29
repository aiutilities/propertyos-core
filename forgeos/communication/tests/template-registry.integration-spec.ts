import {
  CommunicationTemplateDefinition,
} from '../contracts';

import {
  CommunicationTemplateRegistry,
} from '../templates/template-registry';

import {
  CommunicationTemplateNotFoundError,
} from '../templates/template-registry.error';

function template(
  overrides: Partial<CommunicationTemplateDefinition> = {},
): CommunicationTemplateDefinition {
  return {
    key: 'visitor.invited',
    version: '1.0.0',
    channel: 'WHATSAPP',
    body: 'Hello {{visitorName}}',
    ...overrides,
  };
}

describe('CommunicationTemplateRegistry', () => {
  it('registers and resolves a template', () => {
    const registry = new CommunicationTemplateRegistry();
    const definition = template();

    registry.register(definition);

    expect(
      registry.resolve({
        key: 'visitor.invited',
        channel: 'WHATSAPP',
      }),
    ).toBe(definition);
  });

  it('resolves an explicitly requested version', () => {
    const registry = new CommunicationTemplateRegistry();

    registry.registerMany([
      template({
        version: '1.0.0',
      }),
      template({
        version: '2.0.0',
        body: 'Welcome {{visitorName}}',
      }),
    ]);

    expect(
      registry.resolve({
        key: 'visitor.invited',
        channel: 'WHATSAPP',
        version: '2.0.0',
      }).version,
    ).toBe('2.0.0');
  });

  it('prefers an exact locale match', () => {
    const registry = new CommunicationTemplateRegistry();

    registry.registerMany([
      template(),
      template({
        locale: 'ta-IN',
        body: 'வணக்கம் {{visitorName}}',
      }),
    ]);

    expect(
      registry.resolve({
        key: 'visitor.invited',
        channel: 'WHATSAPP',
        locale: 'ta-IN',
      }).locale,
    ).toBe('ta-IN');
  });

  it('falls back to a default locale', () => {
    const registry = new CommunicationTemplateRegistry();
    const defaultTemplate = template();

    registry.register(defaultTemplate);

    expect(
      registry.resolve({
        key: 'visitor.invited',
        channel: 'WHATSAPP',
        locale: 'en-IN',
      }),
    ).toBe(defaultTemplate);
  });

  it('throws a typed error when no template exists', () => {
    const registry = new CommunicationTemplateRegistry();

    expect(() =>
      registry.resolve({
        key: 'visitor.approved',
        channel: 'EMAIL',
      }),
    ).toThrow(CommunicationTemplateNotFoundError);
  });
});
