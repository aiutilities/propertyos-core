import {
  CommunicationTemplateDefinition,
} from '../contracts';

import {
  CommunicationTemplateValidationError,
} from '../templates/template-registry.error';

import {
  CommunicationTemplateRenderer,
} from '../templates/template-renderer';

describe('CommunicationTemplateRenderer', () => {
  const renderer = new CommunicationTemplateRenderer();

  const template: CommunicationTemplateDefinition = {
    key: 'visitor.invited',
    version: '1.0.0',
    channel: 'EMAIL',
    subject: 'Visitor pass for {{visitor.name}}',
    body:
      'Hello {{visitor.name}}, your PIN is {{credential.pin}}.',
    requiredVariables: [
      'visitor.name',
      'credential.pin',
    ],
  };

  it('renders nested variables in subject and body', () => {
    const result = renderer.render(template, {
      visitor: {
        name: 'Arun',
      },
      credential: {
        pin: '246810',
      },
    });

    expect(result.subject).toBe(
      'Visitor pass for Arun',
    );

    expect(result.body).toBe(
      'Hello Arun, your PIN is 246810.',
    );
  });

  it('preserves provider template information', () => {
    const result = renderer.render(
      {
        ...template,
        providerTemplateId: 'visitor_invite_v1',
        metadata: {
          category: 'visitor',
        },
      },
      {
        visitor: {
          name: 'Arun',
        },
        credential: {
          pin: '246810',
        },
      },
    );

    expect(result.providerTemplateId).toBe(
      'visitor_invite_v1',
    );

    expect(result.metadata).toEqual({
      category: 'visitor',
    });
  });

  it('throws when required variables are missing', () => {
    expect(() =>
      renderer.render(template, {
        visitor: {
          name: 'Arun',
        },
      }),
    ).toThrow(CommunicationTemplateValidationError);
  });

  it('renders optional missing variables as empty text', () => {
    const result = renderer.render(
      {
        key: 'visitor.optional',
        version: '1.0.0',
        channel: 'WHATSAPP',
        body: 'Vehicle: {{vehicleNumber}}',
      },
      {},
    );

    expect(result.body).toBe('Vehicle: ');
  });
});
