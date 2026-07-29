export class WikidataProviderError
  extends Error
{
  constructor(
    readonly code:
      string,

    message:
      string,

    readonly retryable:
      boolean,

    readonly statusCode?:
      number,
  ) {
    super(
      message,
    );

    this.name =
      'WikidataProviderError';
  }
}

export function classifyWikidataStatus(
  statusCode:
    number,
): WikidataProviderError {
  if (
    statusCode === 408 ||
    statusCode === 429 ||
    statusCode >= 500
  ) {
    return new WikidataProviderError(
      'WIKIDATA_PROVIDER_UNAVAILABLE',
      `Wikidata returned HTTP ${statusCode}`,
      true,
      statusCode,
    );
  }

  if (
    statusCode === 404
  ) {
    return new WikidataProviderError(
      'WIKIDATA_ENTITY_NOT_FOUND',
      'Wikidata entity was not found',
      false,
      statusCode,
    );
  }

  return new WikidataProviderError(
    'WIKIDATA_REQUEST_REJECTED',
    `Wikidata returned HTTP ${statusCode}`,
    false,
    statusCode,
  );
}
