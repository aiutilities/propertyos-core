import { PlatformException } from './platform.exception';

export class PlatformConflictException extends PlatformException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PLATFORM_CONFLICT', details);
    this.name = 'PlatformConflictException';
  }
}
