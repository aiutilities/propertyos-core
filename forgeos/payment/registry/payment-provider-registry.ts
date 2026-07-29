import {
  PaymentProvider,
} from '../contracts';

import {
  PaymentProviderNotFoundError,
} from './payment-provider-registry.error';

function normalizeProviderName(
  providerName: string,
): string {
  return providerName
    .trim()
    .toLowerCase();
}

export class PaymentProviderRegistry {
  private readonly providers =
    new Map<
      string,
      PaymentProvider
    >();

  register(
    provider:
      PaymentProvider,
  ): void {
    const providerName =
      normalizeProviderName(
        provider.name,
      );

    if (!providerName) {
      throw new Error(
        'PAYMENT_PROVIDER_NAME_REQUIRED',
      );
    }

    this.providers.set(
      providerName,
      provider,
    );
  }

  get(
    providerName: string,
  ): PaymentProvider | undefined {
    return this.providers.get(
      normalizeProviderName(
        providerName,
      ),
    );
  }

  require(
    providerName: string,
  ): PaymentProvider {
    const provider =
      this.get(providerName);

    if (!provider) {
      throw new PaymentProviderNotFoundError(
        providerName,
      );
    }

    return provider;
  }

  has(
    providerName: string,
  ): boolean {
    return this.providers.has(
      normalizeProviderName(
        providerName,
      ),
    );
  }

  unregister(
    providerName: string,
  ): boolean {
    return this.providers.delete(
      normalizeProviderName(
        providerName,
      ),
    );
  }

  list():
    PaymentProvider[] {
    return Array.from(
      this.providers.values(),
    );
  }

  clear(): void {
    this.providers.clear();
  }
}
