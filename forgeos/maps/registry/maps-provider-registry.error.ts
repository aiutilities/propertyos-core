export class MapsProviderNotFoundError
  extends Error
{
  readonly code =
    'MAPS_PROVIDER_NOT_FOUND';

  constructor(
    readonly providerName:
      string,
  ) {
    super(
      `Maps provider not found: ${providerName}`,
    );

    this.name =
      'MapsProviderNotFoundError';
  }
}

export class MapsProviderCapabilityNotSupportedError
  extends Error
{
  readonly code =
    'MAPS_PROVIDER_CAPABILITY_NOT_SUPPORTED';

  constructor(
    readonly providerName:
      string,

    readonly capability:
      string,
  ) {
    super(
      `Maps provider ${providerName} does not support ${capability}`,
    );

    this.name =
      'MapsProviderCapabilityNotSupportedError';
  }
}
