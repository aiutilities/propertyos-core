import {
  Module,
} from '@nestjs/common';

import {
  PostgresModule,
} from '../../database/postgres/postgres.module';

@Module({
  imports: [
    PostgresModule,
  ],
})
export class InventoryModule {}
