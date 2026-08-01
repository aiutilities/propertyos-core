import * as hostContracts from './core-contracts';

export const CORE_CONTRACTS_HOST_RUNTIME_KEY =
  Symbol.for(
    '@propertyos/core-contracts/host-runtime',
  );

export const CORE_CONTRACTS_HOST_API_VERSION =
  '0.1.0';

export type CoreContractsHostRuntime =
  Readonly<Record<string, unknown>>;

type HostRuntimeScope = typeof globalThis & {
  [CORE_CONTRACTS_HOST_RUNTIME_KEY]?:
    CoreContractsHostRuntime;
};

export interface CoreContractsHostRuntimeRegistration {
  key: symbol;
  hostApiVersion: string;
  runtime: CoreContractsHostRuntime;
  registered: boolean;
}

export function registerCoreContractsHostRuntime():
  CoreContractsHostRuntimeRegistration {
  const scope = globalThis as HostRuntimeScope;
  const existing =
    scope[CORE_CONTRACTS_HOST_RUNTIME_KEY];

  if (existing) {
    if (existing !== hostContracts) {
      throw new Error(
        'PropertyOS core-contract host runtime is ' +
          'already registered by a different provider.',
      );
    }

    return {
      key: CORE_CONTRACTS_HOST_RUNTIME_KEY,
      hostApiVersion:
        CORE_CONTRACTS_HOST_API_VERSION,
      runtime: existing,
      registered: false,
    };
  }

  Object.defineProperty(
    scope,
    CORE_CONTRACTS_HOST_RUNTIME_KEY,
    {
      configurable: true,
      enumerable: false,
      value: hostContracts,
      writable: false,
    },
  );

  return {
    key: CORE_CONTRACTS_HOST_RUNTIME_KEY,
    hostApiVersion:
      CORE_CONTRACTS_HOST_API_VERSION,
    runtime: hostContracts,
    registered: true,
  };
}

export function resolveCoreContractsHostRuntime():
  CoreContractsHostRuntime | undefined {
  const scope = globalThis as HostRuntimeScope;

  return scope[
    CORE_CONTRACTS_HOST_RUNTIME_KEY
  ];
}
