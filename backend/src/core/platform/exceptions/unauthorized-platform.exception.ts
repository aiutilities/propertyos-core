import { PlatformException } from './platform.exception';

export class UnauthorizedPlatformException extends PlatformException {
  constructor(message = 'Unauthorized platform operation') {
    super(message, 'PLATFORM_UNAUTHORIZED');
    this.name = 'UnauthorizedPlatformException';
  }
}
