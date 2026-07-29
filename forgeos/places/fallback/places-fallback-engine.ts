import {
  PlaceDetailsRequest,
  PlaceDetailsResult,
  PlaceNearbyRequest,
  PlaceNearbyResult,
  PlaceSearchRequest,
  PlaceSearchResult,
  PlacesProviderCapability,
} from '../contracts';

import {
  PlacesDispatcher,
} from '../dispatcher';

import {
  NoopPlacesLogger,
  PlacesLogger,
} from '../ports';

import {
  PlacesProviderSelection,
} from '../selection';

import {
  InMemoryPlacesProviderHealthStore,
  PlacesProviderHealthStore,
} from './places-provider-health';

import {
  PlacesFallbackContext,
  PlacesFallbackEngineOptions,
  PlacesFallbackResult,
  PlacesProviderAttempt,
} from './places-fallback.types';

export interface PlacesFallbackEngineDependencies {
  dispatcher:
    PlacesDispatcher;

  selection:
    PlacesProviderSelection;

  healthStore?:
    PlacesProviderHealthStore;

  logger?:
    PlacesLogger;

  options?:
    PlacesFallbackEngineOptions;

  now?:
    () => number;
}

interface ClassifiedFailure {
  code:
    string;

  message:
    string;

  retryable:
    boolean;
}

export class PlacesFallbackEngine {
  private readonly dispatcher:
    PlacesDispatcher;

  private readonly selection:
    PlacesProviderSelection;

  private readonly healthStore:
    PlacesProviderHealthStore;

  private readonly logger:
    PlacesLogger;

  private readonly now:
    () => number;

  private readonly cooldownMilliseconds:
    number;

  constructor(
    dependencies:
      PlacesFallbackEngineDependencies,
  ) {
    this.dispatcher =
      dependencies.dispatcher;

    this.selection =
      dependencies.selection;

    this.healthStore =
      dependencies.healthStore ??
      new InMemoryPlacesProviderHealthStore();

    this.logger =
      dependencies.logger ??
      new NoopPlacesLogger();

    this.now =
      dependencies.now ??
      Date.now;

    this.cooldownMilliseconds =
      dependencies.options
        ?.providerCooldownMilliseconds ??
      30_000;
  }

  async search(
    request:
      PlaceSearchRequest,

    context:
      PlacesFallbackContext = {},
  ): Promise<
    PlacesFallbackResult<
      PlaceSearchResult
    >
  > {
    return this.execute(
      'PLACE_SEARCH',

      context,

      (providerName) =>
        this.dispatcher.search({
          providerName,
          request,
          ...context,
        }),
    );
  }

  async nearby(
    request:
      PlaceNearbyRequest,

    context:
      PlacesFallbackContext = {},
  ): Promise<
    PlacesFallbackResult<
      PlaceNearbyResult
    >
  > {
    return this.execute(
      'NEARBY_SEARCH',

      context,

      (providerName) =>
        this.dispatcher.nearby({
          providerName,
          request,
          ...context,
        }),
    );
  }

  async details(
    request:
      PlaceDetailsRequest,

    context:
      PlacesFallbackContext = {},
  ): Promise<
    PlacesFallbackResult<
      PlaceDetailsResult
    >
  > {
    const selectedProviders =
      request.providerName
        ? [
            request.providerName,
          ]
        : undefined;

    return this.execute(
      'PLACE_DETAILS',

      context,

      (providerName) =>
        this.dispatcher.details({
          providerName,
          request,
          ...context,
        }),

      selectedProviders,
    );
  }

  private async execute<
    TResult,
  >(
    capability:
      PlacesProviderCapability,

    context:
      PlacesFallbackContext,

    executor:
      (
        providerName:
          string,
      ) => Promise<TResult>,

    explicitProviders?:
      readonly string[],
  ): Promise<
    PlacesFallbackResult<TResult>
  > {
    const providers =
      explicitProviders ??
      this.selection
        .select(
          capability,
        )
        .providers;

    const attempts:
      PlacesProviderAttempt[] = [];

    let lastFailure:
      ClassifiedFailure = {
        code:
          'PLACES_PROVIDER_UNAVAILABLE',

        message:
          'No Places provider completed the request',

        retryable:
          true,
      };

    for (
      const providerName of
        providers
    ) {
      const startedAt =
        this.now();

      if (
        !this.healthStore
          .isHealthy(
            providerName,
            startedAt,
          )
      ) {
        attempts.push({
          providerName,
          success:
            false,
          startedAt,
          completedAt:
            startedAt,
          durationMilliseconds:
            0,
          errorCode:
            'PLACES_PROVIDER_UNHEALTHY',
          errorMessage:
            'Provider is temporarily unhealthy',
          retryable:
            true,
        });

        continue;
      }

      try {
        const result =
          await executor(
            providerName,
          );

        const completedAt =
          this.now();

        this.healthStore
          .recordSuccess(
            providerName,
            completedAt,
          );

        attempts.push({
          providerName,
          success:
            true,
          startedAt,
          completedAt,
          durationMilliseconds:
            completedAt -
            startedAt,
        });

        return {
          success:
            true,

          providerName,

          result,

          attempts,
        };
      } catch (error) {
        const completedAt =
          this.now();

        const classified =
          this.classifyFailure(
            error,
          );

        lastFailure =
          classified;

        attempts.push({
          providerName,
          success:
            false,
          startedAt,
          completedAt,
          durationMilliseconds:
            completedAt -
            startedAt,
          errorCode:
            classified.code,
          errorMessage:
            classified.message,
          retryable:
            classified.retryable,
        });

        if (
          classified.retryable
        ) {
          this.healthStore
            .recordFailure(
              providerName,
              completedAt,
              this.cooldownMilliseconds,
            );

          this.logger.warn(
            'Places provider attempt failed',
            {
              providerName,
              capability,
              correlationId:
                context.correlationId,
              errorCode:
                classified.code,
            },
          );

          continue;
        }

        return {
          success:
            false,

          errorCode:
            classified.code,

          errorMessage:
            classified.message,

          retryable:
            false,

          attempts,
        };
      }
    }

    return {
      success:
        false,

      errorCode:
        lastFailure.code,

      errorMessage:
        lastFailure.message,

      retryable:
        lastFailure.retryable,

      attempts,
    };
  }

  private classifyFailure(
    error:
      unknown,
  ): ClassifiedFailure {
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
        code:
          typeof candidate.code ===
            'string'
            ? candidate.code
            : 'PLACES_PROVIDER_ERROR',

        message:
          typeof candidate.message ===
            'string'
            ? candidate.message
            : 'Places provider request failed',

        retryable:
          typeof candidate.retryable ===
            'boolean'
            ? candidate.retryable
            : false,
      };
    }

    return {
      code:
        'PLACES_PROVIDER_ERROR',

      message:
        'Places provider request failed',

      retryable:
        false,
    };
  }
}
