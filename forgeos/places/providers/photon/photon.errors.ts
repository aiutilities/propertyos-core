export class PhotonProviderError
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
      'PhotonProviderError';
  }
}

export function classifyPhotonStatus(
  statusCode:
    number,
): PhotonProviderError {
  if (
    statusCode === 408 ||
    statusCode === 429 ||
    statusCode >= 500
  ) {
    return new PhotonProviderError(
      'PHOTON_PROVIDER_UNAVAILABLE',
      `Photon returned HTTP ${statusCode}`,
      true,
      statusCode,
    );
  }

  return new PhotonProviderError(
    'PHOTON_REQUEST_REJECTED',
    `Photon returned HTTP ${statusCode}`,
    false,
    statusCode,
  );
}
