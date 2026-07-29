export class MapsProviderOperationUnavailableError
  extends Error
{
  readonly code =
    'MAPS_PROVIDER_OPERATION_UNAVAILABLE';

  constructor(
    readonly providerName:
      string,

    readonly operation:
      string,
  ) {
    super(
      `Maps provider ${providerName} does not implement ${operation}`,
    );

    this.name =
      'MapsProviderOperationUnavailableError';
  }
}
