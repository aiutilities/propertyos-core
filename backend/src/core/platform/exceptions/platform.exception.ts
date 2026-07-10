export class PlatformException extends Error {
  constructor(
    message: string,
    public readonly code = 'PLATFORM_ERROR',
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'PlatformException';
  }
}
