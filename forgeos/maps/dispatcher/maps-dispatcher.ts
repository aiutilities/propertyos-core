import {
  GeocodeResult,
  NearbySearchResult,
  ReverseGeocodeResult,
  RouteResult,
} from '../contracts';

import {
  MapsLogger,
  NoopMapsLogger,
} from '../ports';

import {
  MapsProviderRegistry,
} from '../registry';

import {
  validateGeocodeRequest,
  validateNearbySearchRequest,
  validateReverseGeocodeRequest,
  validateRouteRequest,
} from '../validation';

import {
  MapsProviderOperationUnavailableError,
} from './maps-dispatcher.error';

import {
  DispatchGeocodeInput,
  DispatchNearbySearchInput,
  DispatchReverseGeocodeInput,
  DispatchRouteInput,
  GeocodeDispatchResult,
  MapsDispatchFailure,
  NearbySearchDispatchResult,
  ReverseGeocodeDispatchResult,
  RouteDispatchResult,
} from './maps-dispatcher.types';

export interface MapsDispatcherDependencies {
  registry:
    MapsProviderRegistry;

  logger?:
    MapsLogger;
}

export class MapsDispatcher {
  private readonly registry:
    MapsProviderRegistry;

  private readonly logger:
    MapsLogger;

  constructor(
    dependencies:
      MapsDispatcherDependencies,
  ) {
    this.registry =
      dependencies.registry;

    this.logger =
      dependencies.logger ??
      new NoopMapsLogger();
  }

  async geocode(
    input:
      DispatchGeocodeInput,
  ): Promise<
    GeocodeDispatchResult
  > {
    validateGeocodeRequest(
      input.request,
    );

    const provider =
      this.registry
        .requireCapability(
          input.providerName,
          'GEOCODING',
        );

    if (!provider.geocode) {
      throw new MapsProviderOperationUnavailableError(
        provider.name,
        'geocode',
      );
    }

    return this.execute<
      GeocodeResult
    >(
      provider.name,
      'geocode',
      input.correlationId,
      input.metadata,
      () =>
        provider.geocode!(
          input.request,
        ),
    );
  }

  async reverseGeocode(
    input:
      DispatchReverseGeocodeInput,
  ): Promise<
    ReverseGeocodeDispatchResult
  > {
    validateReverseGeocodeRequest(
      input.request,
    );

    const provider =
      this.registry
        .requireCapability(
          input.providerName,
          'REVERSE_GEOCODING',
        );

    if (
      !provider
        .reverseGeocode
    ) {
      throw new MapsProviderOperationUnavailableError(
        provider.name,
        'reverseGeocode',
      );
    }

    return this.execute<
      ReverseGeocodeResult
    >(
      provider.name,
      'reverseGeocode',
      input.correlationId,
      input.metadata,
      () =>
        provider
          .reverseGeocode!(
            input.request,
          ),
    );
  }

  async route(
    input:
      DispatchRouteInput,
  ): Promise<
    RouteDispatchResult
  > {
    validateRouteRequest(
      input.request,
    );

    const provider =
      this.registry
        .requireCapability(
          input.providerName,
          'ROUTING',
        );

    if (!provider.route) {
      throw new MapsProviderOperationUnavailableError(
        provider.name,
        'route',
      );
    }

    return this.execute<
      RouteResult
    >(
      provider.name,
      'route',
      input.correlationId,
      input.metadata,
      () =>
        provider.route!(
          input.request,
        ),
    );
  }

  async nearbySearch(
    input:
      DispatchNearbySearchInput,
  ): Promise<
    NearbySearchDispatchResult
  > {
    validateNearbySearchRequest(
      input.request,
    );

    const provider =
      this.registry
        .requireCapability(
          input.providerName,
          'NEARBY_SEARCH',
        );

    if (
      !provider
        .nearbySearch
    ) {
      throw new MapsProviderOperationUnavailableError(
        provider.name,
        'nearbySearch',
      );
    }

    return this.execute<
      NearbySearchResult
    >(
      provider.name,
      'nearbySearch',
      input.correlationId,
      input.metadata,
      () =>
        provider
          .nearbySearch!(
            input.request,
          ),
    );
  }

  private async execute<
    TResult,
  >(
    providerName:
      string,

    operation:
      string,

    correlationId:
      string | undefined,

    metadata:
      Record<
        string,
        unknown
      > | undefined,

    executor:
      () =>
        Promise<TResult>,
  ): Promise<
    | {
        success:
          true;

        providerName:
          string;

        result:
          TResult;
      }
    | MapsDispatchFailure
  > {
    this.logger.debug(
      'Maps operation started',
      {
        providerName,
        operation,
        correlationId,
        ...metadata,
      },
    );

    try {
      const result =
        await executor();

      this.logger.info(
        'Maps operation completed',
        {
          providerName,
          operation,
          correlationId,
        },
      );

      return {
        success:
          true,

        providerName,

        result,
      };
    } catch (error) {
      const failure =
        this.normalizeFailure(
          providerName,
          error,
        );

      this.logger.error(
        'Maps operation failed',
        {
          providerName,
          operation,
          correlationId,
          errorCode:
            failure.errorCode,
          retryable:
            failure.retryable,
        },
      );

      return failure;
    }
  }

  private normalizeFailure(
    providerName:
      string,

    error:
      unknown,
  ): MapsDispatchFailure {
    if (
      typeof error ===
        'object' &&
      error !== null
    ) {
      const candidate =
        error as {
          code?:
            unknown;

          message?:
            unknown;

          retryable?:
            unknown;
        };

      return {
        success:
          false,

        providerName,

        errorCode:
          typeof candidate.code ===
            'string'
            ? candidate.code
            : 'MAPS_PROVIDER_FAILED',

        errorMessage:
          typeof candidate.message ===
            'string'
            ? candidate.message
            : 'Maps provider operation failed',

        retryable:
          candidate.retryable ===
            true,
      };
    }

    return {
      success:
        false,

      providerName,

      errorCode:
        'MAPS_PROVIDER_FAILED',

      errorMessage:
        'Maps provider operation failed',

      retryable:
        false,
    };
  }
}
