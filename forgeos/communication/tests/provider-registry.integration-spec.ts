import {
  CommunicationProvider,
  ProviderDeliveryRequest,
  ProviderDeliveryResult,
} from '../contracts';

import {
  CommunicationProviderRegistry,
} from '../registry/provider-registry';

import {
  CommunicationProviderNotFoundError,
} from '../registry/provider-registry.error';

function createProvider(
  name: string,
  channel: 'WHATSAPP' | 'EMAIL',
): CommunicationProvider {
  return {
    name,
    channel,

    validateConfiguration(): void {
      return;
    },

    async send(
      _request: ProviderDeliveryRequest,
    ): Promise<ProviderDeliveryResult> {
      return {
        success: true,
        providerName: name,
      };
    },
  };
}

describe('CommunicationProviderRegistry', () => {
  it('registers and resolves a provider by channel', () => {
    const registry = new CommunicationProviderRegistry();
    const provider = createProvider('meta-whatsapp', 'WHATSAPP');

    registry.register(provider);

    expect(registry.has('WHATSAPP')).toBe(true);
    expect(registry.get('WHATSAPP')).toBe(provider);
    expect(registry.require('WHATSAPP')).toBe(provider);
  });

  it('replaces a provider registered for the same channel', () => {
    const registry = new CommunicationProviderRegistry();
    const first = createProvider('first-whatsapp', 'WHATSAPP');
    const second = createProvider('second-whatsapp', 'WHATSAPP');

    registry.register(first);
    registry.register(second);

    expect(registry.list()).toEqual([second]);
  });

  it('throws a typed error when a required provider is missing', () => {
    const registry = new CommunicationProviderRegistry();

    expect(() => registry.require('EMAIL')).toThrow(
      CommunicationProviderNotFoundError,
    );
  });

  it('unregisters and clears providers', () => {
    const registry = new CommunicationProviderRegistry();

    registry.register(createProvider('meta-whatsapp', 'WHATSAPP'));
    registry.register(createProvider('mailersend', 'EMAIL'));

    expect(registry.unregister('WHATSAPP')).toBe(true);
    expect(registry.has('WHATSAPP')).toBe(false);

    registry.clear();

    expect(registry.list()).toEqual([]);
  });
});
