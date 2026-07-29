import {
  PlaceDetailsRequest,
  PlaceDetailsResult,
  PlacesProvider,
} from '../../contracts';

import {
  resolveWikidataConfiguration,
} from './wikidata.configuration';

import {
  classifyWikidataStatus,
  WikidataProviderError,
} from './wikidata.errors';

import {
  isWikidataEntityResponse,
  mapWikidataEntity,
} from './wikidata.mapper';

import {
  WikidataConfigurationInput,
} from './wikidata.types';

export interface WikidataProviderDependencies {
  configuration?:
    WikidataConfigurationInput;

  fetchImplementation?:
    typeof fetch;
}

export class WikidataProvider
  implements PlacesProvider
{
  readonly name =
    'wikidata';

  readonly capabilities = [
    'PLACE_DETAILS',
  ] as const;

  private readonly configuration;

  private readonly fetchImplementation:
    typeof fetch;

  constructor(
    dependencies:
      WikidataProviderDependencies = {},
  ) {
    this.configuration =
      resolveWikidataConfiguration(
        dependencies.configuration,
      );

    if (
      this.configuration.status ===
        'BLOCKED'
    ) {
      throw new Error(
        `WIKIDATA_CONFIGURATION_BLOCKED: ${this.configuration.errors.join('; ')}`,
      );
    }

    this.fetchImplementation =
      dependencies.fetchImplementation ??
      fetch;
  }

  async details(
    request:
      PlaceDetailsRequest,
  ): Promise<
    PlaceDetailsResult
  > {
    const placeId =
      request.placeId
        .trim()
        .toUpperCase();

    if (
      !/^Q[1-9][0-9]*$/.test(
        placeId,
      )
    ) {
      throw new WikidataProviderError(
        'WIKIDATA_ENTITY_ID_INVALID',
        'Wikidata placeId must be a valid Q identifier',
        false,
      );
    }

    const url =
      new URL(
        `${this.configuration.endpoint}/${placeId}.json`,
      );

    const payload =
      await this.request(
        url,
      );

    if (
      !isWikidataEntityResponse(
        payload,
      )
    ) {
      throw new WikidataProviderError(
        'INVALID_PROVIDER_RESPONSE',
        'Wikidata response must contain an entities object',
        false,
      );
    }

    const entity =
      payload.entities[
        placeId
      ];

    if (
      !entity ||
      entity.id !==
        placeId
    ) {
      return {
        providerName:
          this.name,

        place:
          undefined,

        metadata: {
          source:
            'wikidata',

          entityId:
            placeId,

          found:
            false,
        },
      };
    }

    const place =
      mapWikidataEntity(
        entity,
        request.language ??
          this.configuration
            .defaultLanguage,
        this.name,
      );

    return {
      providerName:
        this.name,

      place,

      metadata: {
        source:
          'wikidata',

        entityId:
          placeId,

        found:
          Boolean(place),
      },
    };
  }

  private async request(
    url:
      URL,
  ): Promise<unknown> {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),

        this.configuration
          .timeoutMilliseconds,
      );

    try {
      const response =
        await this.fetchImplementation(
          url,
          {
            method:
              'GET',

            headers: {
              Accept:
                'application/json',

              'User-Agent':
                this.configuration
                  .userAgent,
            },

            signal:
              controller.signal,
          },
        );

      if (!response.ok) {
        throw classifyWikidataStatus(
          response.status,
        );
      }

      try {
        return await response.json();
      } catch {
        throw new WikidataProviderError(
          'INVALID_PROVIDER_RESPONSE',
          'Wikidata returned invalid JSON',
          false,
          response.status,
        );
      }
    } catch (error) {
      if (
        error instanceof
          WikidataProviderError
      ) {
        throw error;
      }

      if (
        typeof error ===
          'object' &&
        error !== null &&
        (
          error as {
            name?:
              unknown;
          }
        ).name ===
          'AbortError'
      ) {
        throw new WikidataProviderError(
          'WIKIDATA_TIMEOUT',
          'Wikidata request timed out',
          true,
        );
      }

      throw new WikidataProviderError(
        'WIKIDATA_NETWORK_ERROR',
        error instanceof
          Error
          ? error.message
          : 'Wikidata network request failed',
        true,
      );
    } finally {
      clearTimeout(
        timeout,
      );
    }
  }
}
