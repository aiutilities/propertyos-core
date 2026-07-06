import { PlatformException } from './platform.exception';

export class PlatformValidationException extends PlatformException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PLATFORM_VALIDATION_ERROR', details);
    this.name = 'PlatformValidationException';
  }
}
