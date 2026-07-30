import {
  Injectable,
} from '@nestjs/common';

import {
  createPlacesRuntimeConfiguration,
} from './places-runtime.configuration';

@Injectable()
export class PlacesRuntimeService {
  readonly runtime =
    createPlacesRuntimeConfiguration();
}
