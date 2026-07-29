import {
  GeocodeRequest,
  GeocodeResult,
  MapProviderCapability,
  NearbySearchRequest,
  NearbySearchResult,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
  RouteRequest,
  RouteResult,
} from '../contracts';

import {
  MapsDispatcher,
  MapsDispatchResult,
} from '../dispatcher';

import {
  MapsLogger,
  NoopMapsLogger,
} from '../ports';

import {
  MapsProviderSelection,
} from '../selection';

import {
  InMemoryMapsProviderHealthStore,
  MapsProviderHealthStore,
} from './maps-provider-health';

import {
  MapsFallbackFailure,
  MapsFallbackResult,
  MapsProviderAttempt,
} from './maps-fallback.types';

export interface MapsFallbackEngineDependencies {
  dispatcher:
    MapsDispatcher;

  selection:
    MapsProviderSelection;

  healthStore?:
    MapsProviderHealthStore;

  logger?:
    MapsLogger;

  now?:
    () => string;
}

export interface MapsFallbackContext {
  correlationId?:
    string;

  metadata?:
    Record<string, unknown>;
}

export class MapsFallbackEngine {
  private readonly dispatcher:
    MapsDispatcher;

  private readonly selection:
    MapsProviderSelection;

  private readonly healthStore:
    MapsProviderHealthStore;

  private readonly logger:
    MapsLogger;

  private readonly now:
    () => string;

  constructor(
    dependencies:
      MapsFallbackEngineDependencies,
  ) {
    this.dispatcher =
      dependencies.dispatcher;

    this.selection =
      dependencies.selection;

    this.healthStore =
      dependencies.healthStore ??
      new InMemoryMapsProviderHealthStore();

    this.logger =
      dependencies.logger ??
      new NoopMapsLogger();

    this.now =
      dependencies.now ??
      (
        () =>
          new Date()
            .toISOString()
      );
  }

  async geocode(
    request:
      GeocodeRequest,

    context:
      MapsFallbackContext = {},
  ): Promise<
    MapsFallbackResult<
      GeocodeResult
    >
  > {
    return this.execute(
      'GEOCODING',
      (
        providerName,
      ) =>
        this.dispatcher
          .geocode({
            providerName,
            request,
            ...context,
          }),
    );
  }

  async reverseGeocode(
    request:
      ReverseGeocodeRequest,

    context:
      MapsFallbackContext = {},
  ): Promise<
    MapsFallbackResult<
      ReverseGeocodeResult
    >
  > {
    return this.execute(
      'REVERSE_GEOCODING',
      (
        providerName,
      ) =>
        this.dispatcher
          .reverseGeocode({
            providerName,
            request,
            ...context,
          }),
    );
  }

  async route(
    request:
      RouteRequest,

    context:
      MapsFallbackContext = {},
  ): Promise<
    MapsFallbackResult<
      RouteResult
    >
  > {
    return this.execute(
      'ROUTING',
      (
        providerName,
      ) =>
        this.dispatcher
          .route({
            providerName,
            request,
            ...context,
          }),
    );
  }

  async nearbySearch(
    request:
      NearbySearchRequest,

    context:
      MapsFallbackContext = {},
  ): Promise<
    MapsFallbackResult<
      NearbySearchResult
    >
  > {
    return this.execute(
      'NEARBY_SEARCH',
      (
        providerName,
      ) =>
        this.dispatcher
          .nearbySearch({
            providerName,
            request,
            ...context,
          }),
    );
  }

  private async execute<
    TResult,
  >(
    capability:
      MapProviderCapability,

    executor:
      (
        providerName:
          string,
      ) => Promise<
        MapsDispatchResult<TResult>
      >,
  ): Promise<
    MapsFallbackResult<TResult>
  > {
    const selection =
      this.selection
        .select(
          capability,
        );

    const attempts:
      MapsProviderAttempt[] = [];

    let finalFailure:
      MapsFallbackFailure | undefined;

    for (
      const providerName of
        selection.providers
    ) {
      this.logger.debug(
        'Maps fallback provider attempt started',
        {
          capability,
          providerName,
        },
      );

      const result =
        await executor(
          providerName,
        );

      if (
        result.success
      ) {
        this.healthStore
          .recordSuccess(
            providerName,
            this.now(),
          );

        attempts.push({
          providerName,
          success:
            true,
        });

        return {
          success:
            true,

          providerName,

          result:
            result.result,

          attempts,
        };
      }

      this.healthStore
        .recordFailure(
          providerName,
          result.errorCode,
          this.now(),
        );

      attempts.push({
        providerName,
        success:
          false,

        errorCode:
          result.errorCode,

        errorMessage:
          result.errorMessage,

        retryable:
          result.retryable,
      });

      finalFailure = {
        success:
          false,

        errorCode:
          result.errorCode,

        errorMessage:
          result.errorMessage,

        retryable:
          result.retryable,

        attempts,
      };

      if (
        !result.retryable
      ) {
        break;
      }
    }

    return (
      finalFailure ?? {
        success:
          false,

        errorCode:
          'MAPS_PROVIDER_SELECTION_EMPTY',

        errorMessage:
          'Maps provider selection produced no provider attempts',

        retryable:
          false,

        attempts,
      }
    );
  }
}
