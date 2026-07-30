import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  PlaceDetailsRequest,
  PlaceNearbyRequest,
  PlaceSearchRequest,
} from '@forgeos/places';

import {
  PlacesRuntimeService,
} from '../runtime';

export interface PlacesRequestContext {
  correlationId?:
    string;

  actorId?:
    string;
}

@Injectable()
export class PlacesService {
  constructor(
    private readonly runtime:
      PlacesRuntimeService,
  ) {}

  async search(
    request:
      PlaceSearchRequest,

    _context:
      PlacesRequestContext = {},
  ) {
    try {
      return await this.runtime
        .runtime
        .searchProvider
        .search(
          request,
        );
    } catch (error) {
      this.throwProviderError(
        error,
        'PLACES_SEARCH_FAILED',
      );
    }
  }

  async nearby(
    request:
      PlaceNearbyRequest,

    _context:
      PlacesRequestContext = {},
  ) {
    try {
      return await this.runtime
        .runtime
        .nearbyProvider
        .nearby(
          request,
        );
    } catch (error) {
      this.throwProviderError(
        error,
        'PLACES_NEARBY_FAILED',
      );
    }
  }

  async details(
    request:
      PlaceDetailsRequest,

    _context:
      PlacesRequestContext = {},
  ) {
    try {
      return await this.runtime
        .runtime
        .detailsProvider
        .details(
          request,
        );
    } catch (error) {
      this.throwProviderError(
        error,
        'PLACES_DETAILS_FAILED',
      );
    }
  }

  health() {
    return {
      enabled:
        true,

      providers: {
        search:
          this.runtime
            .runtime
            .searchProvider
            .name,

        nearby:
          this.runtime
            .runtime
            .nearbyProvider
            .name,

        details:
          this.runtime
            .runtime
            .detailsProvider
            .name,
      },
    };
  }

  private throwProviderError(
    error:
      unknown,

    fallbackCode:
      string,
  ): never {
    const candidate =
      error as {
        code?:
          unknown;

        message?:
          unknown;

        retryable?:
          unknown;
      };

    const payload = {
      code:
        typeof candidate?.code ===
          'string'
          ? candidate.code
          : fallbackCode,

      message:
        typeof candidate?.message ===
          'string'
          ? candidate.message
          : 'Places provider request failed',

      retryable:
        candidate?.retryable ===
          true,
    };

    if (
      payload.retryable
    ) {
      throw new ServiceUnavailableException(
        payload,
      );
    }

    throw new BadRequestException(
      payload,
    );
  }
}
