export class OverpassProviderError
  extends Error
{
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
    readonly statusCode?: number,
  ) {
    super(message);

    this.name =
      'OverpassProviderError';
  }
}

export function classifyOverpassStatus(
  statusCode: number,
): OverpassProviderError {
  if (
    statusCode === 408 ||
    statusCode === 429 ||
    statusCode === 504 ||
    statusCode >= 500
  ) {
    return new OverpassProviderError(
      'OVERPASS_PROVIDER_UNAVAILABLE',
      `Overpass returned HTTP ${statusCode}`,
      true,
      statusCode,
    );
  }

  return new OverpassProviderError(
    'OVERPASS_REQUEST_REJECTED',
    `Overpass returned HTTP ${statusCode}`,
    false,
    statusCode,
  );
}
