export interface MapsLogger {
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

export class NoopMapsLogger
  implements MapsLogger
{
  debug(
    _message:
      string,

    _metadata?:
      Record<string, unknown>,
  ): void {
    return;
  }

  info(
    _message:
      string,

    _metadata?:
      Record<string, unknown>,
  ): void {
    return;
  }

  warn(
    _message:
      string,

    _metadata?:
      Record<string, unknown>,
  ): void {
    return;
  }

  error(
    _message:
      string,

    _metadata?:
      Record<string, unknown>,
  ): void {
    return;
  }
}
