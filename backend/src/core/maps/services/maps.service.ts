import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  GeocodeRequest,
  MapsFallbackResult,
  ReverseGeocodeRequest,
  RouteRequest,
} from '@forgeos/maps';

import {
  MapsRuntimeService,
} from '../runtime';

export interface MapsRequestContext {
  correlationId?:
    string;

  actorId?:
    string;
}

@Injectable()
export class MapsService {
  constructor(
    private readonly runtime:
      MapsRuntimeService,
  ) {}

  async geocode(
    request:
      GeocodeRequest,

    context:
      MapsRequestContext = {},
  ) {
    const service =
      this.requireRuntime();

    const response =
      await service.geocode(
        request,
        this.toFallbackContext(
          context,
        ),
      );

    return this.unwrap(
      response.result,
      response.metadata,
    );
  }

  async reverseGeocode(
    request:
      ReverseGeocodeRequest,

    context:
      MapsRequestContext = {},
  ) {
    const service =
      this.requireRuntime();

    const response =
      await service
        .reverseGeocode(
          request,
          this.toFallbackContext(
            context,
          ),
        );

    return this.unwrap(
      response.result,
      response.metadata,
    );
  }

  async route(
    request:
      RouteRequest,

    context:
      MapsRequestContext = {},
  ) {
    const service =
      this.requireRuntime();

    const response =
      await service.route(
        request,
        this.toFallbackContext(
          context,
        ),
      );

    return this.unwrap(
      response.result,
      response.metadata,
    );
  }

  health() {
    return this.runtime.health();
  }

  private requireRuntime() {
    if (
      !this.runtime.isEnabled()
    ) {
      throw new ServiceUnavailableException({
        code:
          'MAPS_RUNTIME_NOT_ENABLED',

        message:
          'Maps runtime is not enabled',
      });
    }

    try {
      return this.runtime
        .getService();
    } catch {
      throw new ServiceUnavailableException({
        code:
          'MAPS_RUNTIME_NOT_AVAILABLE',

        message:
          'Maps runtime is not available',
      });
    }
  }

  private unwrap<
    TResult,
  >(
    result:
      MapsFallbackResult<TResult>,

    cacheMetadata:
      unknown,
  ) {
    if (
      result.success
    ) {
      return {
        providerName:
          result.providerName,

        result:
          result.result,

        attempts:
          result.attempts,

        cache:
          cacheMetadata,
      };
    }

    const failure =
      result as Extract<
        MapsFallbackResult<TResult>,
        {
          success:
            false;
        }
      >;

    const payload = {
      code:
        failure.errorCode,

      message:
        failure.errorMessage,

      retryable:
        failure.retryable,

      attempts:
        failure.attempts,
    };

    if (
      failure.retryable
    ) {
      throw new ServiceUnavailableException(
        payload,
      );
    }

    throw new BadRequestException(
      payload,
    );
  }

  private toFallbackContext(
    context:
      MapsRequestContext,
  ) {
    return {
      correlationId:
        context.correlationId,

      metadata: {
        actorId:
          context.actorId,
      },
    };
  }
}
