export class PlacesRequestValidationError
  extends Error
{
  readonly code =
    'PLACES_REQUEST_INVALID';

  constructor(
    readonly errors:
      readonly string[],
  ) {
    super(
      `Places request is invalid: ${errors.join('; ')}`,
    );

    this.name =
      'PlacesRequestValidationError';
  }
}
