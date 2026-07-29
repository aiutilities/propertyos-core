export interface PlacesLogger {
  debug(
    message:
      string,

    metadata?:
      Record<string, unknown>,
  ): void;

  info(
    message:
      string,

    metadata?:
      Record<string, unknown>,
  ): void;

  warn(
    message:
      string,

    metadata?:
      Record<string, unknown>,
  ): void;

  error(
    message:
      string,

    metadata?:
      Record<string, unknown>,
  ): void;
}

export class NoopPlacesLogger
  implements PlacesLogger
{
  debug(): void {}

  info(): void {}

  warn(): void {}

  error(): void {}
}
