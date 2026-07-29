import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  MapsLogger,
} from '@forgeos/maps';

@Injectable()
export class PropertyOSMapsLoggerAdapter
  implements MapsLogger
{
  private readonly logger =
    new Logger(
      'ForgeOSMaps',
    );

  debug(
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.debug(
      metadata
        ? `${message} ${JSON.stringify(metadata)}`
        : message,
    );
  }

  info(
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.log(
      metadata
        ? `${message} ${JSON.stringify(metadata)}`
        : message,
    );
  }

  warn(
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.warn(
      metadata
        ? `${message} ${JSON.stringify(metadata)}`
        : message,
    );
  }

  error(
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.error(
      metadata
        ? `${message} ${JSON.stringify(metadata)}`
        : message,
    );
  }
}
