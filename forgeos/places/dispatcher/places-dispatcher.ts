import {
  NoopPlacesLogger,
  PlacesLogger,
} from '../ports';

import {
  PlacesProviderRegistry,
} from '../registry';

import {
  validatePlaceDetailsRequest,
  validatePlaceNearbyRequest,
  validatePlaceSearchRequest,
} from '../validation';

import {
  PlacesProviderOperationUnavailableError,
} from './places-dispatcher.error';

import {
  PlacesDetailsDispatchInput,
  PlacesNearbyDispatchInput,
  PlacesSearchDispatchInput,
} from './places-dispatcher.types';

export interface PlacesDispatcherDependencies {
  registry:
    PlacesProviderRegistry;

  logger?:
    PlacesLogger;
}

export class PlacesDispatcher {
  private readonly registry:
    PlacesProviderRegistry;

  private readonly logger:
    PlacesLogger;

  constructor(
    dependencies:
      PlacesDispatcherDependencies,
  ) {
    this.registry =
      dependencies.registry;

    this.logger =
      dependencies.logger ??
      new NoopPlacesLogger();
  }

  async search(
    input:
      PlacesSearchDispatchInput,
  ) {
    validatePlaceSearchRequest(
      input.request,
    );

    const provider =
      this.registry.require(
        input.providerName,
      );

    if (
      !provider.capabilities
        .includes(
          'PLACE_SEARCH',
        ) ||
      !provider.search
    ) {
      throw new PlacesProviderOperationUnavailableError(
        provider.name,
        'PLACE_SEARCH',
      );
    }

    this.logger.debug(
      'Places search dispatched',
      {
        providerName:
          provider.name,

        correlationId:
          input.correlationId,
      },
    );

    return provider.search(
      input.request,
    );
  }

  async nearby(
    input:
      PlacesNearbyDispatchInput,
  ) {
    validatePlaceNearbyRequest(
      input.request,
    );

    const provider =
      this.registry.require(
        input.providerName,
      );

    if (
      !provider.capabilities
        .includes(
          'NEARBY_SEARCH',
        ) ||
      !provider.nearby
    ) {
      throw new PlacesProviderOperationUnavailableError(
        provider.name,
        'NEARBY_SEARCH',
      );
    }

    this.logger.debug(
      'Places nearby search dispatched',
      {
        providerName:
          provider.name,

        correlationId:
          input.correlationId,
      },
    );

    return provider.nearby(
      input.request,
    );
  }

  async details(
    input:
      PlacesDetailsDispatchInput,
  ) {
    validatePlaceDetailsRequest(
      input.request,
    );

    const provider =
      this.registry.require(
        input.providerName,
      );

    if (
      !provider.capabilities
        .includes(
          'PLACE_DETAILS',
        ) ||
      !provider.details
    ) {
      throw new PlacesProviderOperationUnavailableError(
        provider.name,
        'PLACE_DETAILS',
      );
    }

    this.logger.debug(
      'Places details dispatched',
      {
        providerName:
          provider.name,

        correlationId:
          input.correlationId,
      },
    );

    return provider.details(
      input.request,
    );
  }
}
