import {
  Module,
} from '@nestjs/common';

import {
  PlacesRuntimeService,
} from './runtime';

@Module({
  providers: [
    PlacesRuntimeService,
  ],

  exports: [
    PlacesRuntimeService,
  ],
})
export class PlacesModule {}
