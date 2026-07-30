import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  PlacesController,
} from './controllers';

import {
  PlacesRuntimeService,
} from './runtime';

import {
  PlacesService,
} from './services';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    PlacesController,
  ],

  providers: [
    PlacesRuntimeService,
    PlacesService,
  ],

  exports: [
    PlacesRuntimeService,
    PlacesService,
  ],
})
export class PlacesModule {}
