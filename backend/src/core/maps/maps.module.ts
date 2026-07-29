import {
  Module,
} from '@nestjs/common';

import {
  PropertyOSMapsLoggerAdapter,
} from './adapters/forgeos';

import {
  MapsRuntimeService,
} from './runtime';

@Module({
  providers: [
    PropertyOSMapsLoggerAdapter,
    MapsRuntimeService,
  ],

  exports: [
    MapsRuntimeService,
  ],
})
export class MapsModule {}
