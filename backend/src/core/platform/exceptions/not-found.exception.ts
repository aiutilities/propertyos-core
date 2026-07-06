import { PlatformException } from './platform.exception';

export class PlatformNotFoundException extends PlatformException {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      'PLATFORM_NOT_FOUND',
      { resource, id },
    );
    this.name = 'PlatformNotFoundException';
  }
}
