import {
  CommunicationChannel,
  CommunicationProvider,
} from '../contracts';

import {
  CommunicationProviderNotFoundError,
} from './provider-registry.error';

export class CommunicationProviderRegistry {
  private readonly providers = new Map<
    CommunicationChannel,
    CommunicationProvider
  >();

  register(provider: CommunicationProvider): void {
    this.providers.set(provider.channel, provider);
  }

  has(channel: CommunicationChannel): boolean {
    return this.providers.has(channel);
  }

  get(
    channel: CommunicationChannel,
  ): CommunicationProvider | undefined {
    return this.providers.get(channel);
  }

  require(channel: CommunicationChannel): CommunicationProvider {
    const provider = this.get(channel);

    if (!provider) {
      throw new CommunicationProviderNotFoundError(channel);
    }

    return provider;
  }

  list(): CommunicationProvider[] {
    return Array.from(this.providers.values());
  }

  unregister(channel: CommunicationChannel): boolean {
    return this.providers.delete(channel);
  }

  clear(): void {
    this.providers.clear();
  }
}
