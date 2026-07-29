import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  PropertyOSMapsLoggerAdapter,
} from './adapters/forgeos';

import {
  MapsController,
} from './controllers';

import {
  MapsRuntimeService,
} from './runtime';

import {
  MapsService,
} from './services';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    MapsController,
  ],

  providers: [
    PropertyOSMapsLoggerAdapter,
    MapsRuntimeService,
    MapsService,
  ],

  exports: [
    MapsRuntimeService,
    MapsService,
  ],
})
export class MapsModule {}
