import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ROUTE_METADATA_KEY =
  'propertyos.auth.public';

export const Public = () =>
  SetMetadata(PUBLIC_ROUTE_METADATA_KEY, true);
