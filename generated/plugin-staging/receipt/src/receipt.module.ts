import { Module } from '@nestjs/common';
import { PostgresModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';
import { ReceiptController } from './controllers/receipt.controller';
import { RECEIPT_REPOSITORY } from './repositories/receipt-repository.interface';
import { PostgresReceiptRepository } from './repositories/postgres-receipt.repository';
import { ReceiptService } from './services/receipt.service';
import { ReceiptDashboardContributorService } from './services/receipt-dashboard-contributor.service';

@Module({
  imports: [
    PostgresModule,
    IdentityModule,
    EventBusModule,
    PluginModule,
  ],
  controllers: [ReceiptController],
  providers: [
    ReceiptService,
    ReceiptDashboardContributorService,
    {
      provide: RECEIPT_REPOSITORY,
      useClass: PostgresReceiptRepository,
    },
  ],
  exports: [ReceiptService],
})
export class ReceiptModule {}
