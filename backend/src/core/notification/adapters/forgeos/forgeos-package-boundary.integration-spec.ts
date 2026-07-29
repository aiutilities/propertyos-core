import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  CommunicationProviderRegistry,
  CommunicationTemplateRegistry,
  CommunicationTemplateRenderer,
  NoopCommunicationLogger,
} from '@forgeos/communication';

describe('PropertyOS ForgeOS package boundary', () => {
  it('loads ForgeOS through its package name', () => {
    expect(
      CommunicationProviderRegistry,
    ).toBeDefined();

    expect(
      CommunicationTemplateRegistry,
    ).toBeDefined();

    expect(
      CommunicationTemplateRenderer,
    ).toBeDefined();
  });

  it('creates framework-neutral ForgeOS services', () => {
    const providers =
      new CommunicationProviderRegistry();

    const templates =
      new CommunicationTemplateRegistry();

    const renderer =
      new CommunicationTemplateRenderer();

    const logger =
      new NoopCommunicationLogger();

    expect(providers.list()).toEqual([]);
    expect(templates.list()).toEqual([]);

    expect(renderer).toBeInstanceOf(
      CommunicationTemplateRenderer,
    );

    expect(() => {
      logger.info?.(
        'ForgeOS package boundary verified',
      );
    }).not.toThrow();
  });

  it('renders a template through the installed package', () => {
    const renderer =
      new CommunicationTemplateRenderer();

    const result = renderer.render(
      {
        key: 'propertyos.package-boundary',
        version: '1.0.0',
        channel: 'EMAIL',
        subject: 'Hello {{name}}',
        body: 'ForgeOS is available to {{product}}.',
        requiredVariables: [
          'name',
          'product',
        ],
      },
      {
        name: 'Anand',
        product: 'PropertyOS',
      },
    );

    expect(result).toMatchObject({
      subject: 'Hello Anand',
      body: 'ForgeOS is available to PropertyOS.',
    });
  });
});
