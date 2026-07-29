import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  CachedMapsService,
  InMemoryMapsCacheStore,
  InMemoryMapsProviderHealthStore,
  MapsDispatcher,
  MapsFallbackEngine,
  MapsProviderRegistry,
  MapsProviderSelection,
} from '@forgeos/maps';

import {
  createPropertyOSNominatimProvider,
  createPropertyOSOsrmProvider,
  PropertyOSMapsLoggerAdapter,
} from '../adapters/forgeos';

import {
  resolvePropertyOSMapsRuntimeConfiguration,
} from './maps-runtime.configuration';

@Injectable()
export class MapsRuntimeService
  implements OnModuleInit
{
  private readonly registry =
    new MapsProviderRegistry();

  private readonly healthStore =
    new InMemoryMapsProviderHealthStore();

  private cacheStore?:
    InMemoryMapsCacheStore;

  private cachedService?:
    CachedMapsService;

  private selection?:
    MapsProviderSelection;

  private enabled =
    false;

  constructor(
    private readonly logger:
      PropertyOSMapsLoggerAdapter,
  ) {}

  onModuleInit(): void {
    const configuration =
      resolvePropertyOSMapsRuntimeConfiguration();

    if (
      configuration.errors
        .length > 0
    ) {
      throw new Error(
        `MAPS_RUNTIME_CONFIGURATION_BLOCKED: ${configuration.errors.join('; ')}`,
      );
    }

    this.enabled =
      configuration.enabled;

    if (!this.enabled) {
      this.logger.info(
        'PropertyOS Maps runtime initialized',
        {
          enabled:
            false,
        },
      );

      return;
    }

    this.registry.register(
      createPropertyOSNominatimProvider(),
    );

    this.registry.register(
      createPropertyOSOsrmProvider(),
    );

    this.selection =
      new MapsProviderSelection(
        {
          rules: [
            {
              capability:
                'GEOCODING',

              providers:
                configuration
                  .geocodeProviders,
            },
            {
              capability:
                'REVERSE_GEOCODING',

              providers:
                configuration
                  .reverseGeocodeProviders,
            },
            {
              capability:
                'ROUTING',

              providers:
                configuration
                  .routingProviders,
            },
          ],
        },
        this.registry,
      );

    const dispatcher =
      new MapsDispatcher({
        registry:
          this.registry,

        logger:
          this.logger,
      });

    const fallbackEngine =
      new MapsFallbackEngine({
        dispatcher,

        selection:
          this.selection,

        healthStore:
          this.healthStore,

        logger:
          this.logger,
      });

    this.cacheStore =
      new InMemoryMapsCacheStore({
        maximumEntries:
          configuration
            .cacheMaximumEntries,
      });

    this.cachedService =
      new CachedMapsService({
        engine:
          fallbackEngine,

        selection:
          this.selection,

        cache:
          this.cacheStore,

        logger:
          this.logger,
      });

    this.logger.info(
      'PropertyOS Maps runtime initialized',
      {
        enabled:
          true,

        providers:
          this.registry
            .list()
            .map(
              (provider) =>
                provider.name,
            ),
      },
    );
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getService():
    CachedMapsService {
    if (
      !this.enabled ||
      !this.cachedService
    ) {
      throw new Error(
        'MAPS_RUNTIME_NOT_ENABLED',
      );
    }

    return this.cachedService;
  }

  getProviderRegistry():
    MapsProviderRegistry {
    return this.registry;
  }

  getProviderSelection():
    MapsProviderSelection {
    if (!this.selection) {
      throw new Error(
        'MAPS_RUNTIME_NOT_ENABLED',
      );
    }

    return this.selection;
  }

  health() {
    return {
      enabled:
        this.enabled,

      providers:
        this.registry
          .list()
          .map(
            (provider) => ({
              name:
                provider.name,

              capabilities:
                provider
                  .capabilities,

              health:
                this.healthStore
                  .get(
                    provider.name,
                  ),
            }),
          ),

      cache:
        this.cacheStore
          ?.stats() ?? {
          entries:
            0,
          hits:
            0,
          misses:
            0,
          writes:
            0,
          evictions:
            0,
        },

      selection:
        this.selection
          ?.list() ??
        [],
    };
  }
}
