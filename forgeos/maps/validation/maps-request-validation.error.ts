export class MapsRequestValidationError
  extends Error
{
  readonly code =
    'MAPS_REQUEST_VALIDATION_FAILED';

  constructor(
    readonly operation:
      string,

    readonly errors:
      readonly string[],
  ) {
    super(
      `Maps ${operation} request is invalid: ${errors.join('; ')}`,
    );

    this.name =
      'MapsRequestValidationError';
  }
}
