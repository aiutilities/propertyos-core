import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres';
import { IdentityModule } from '../identity/identity.module';
import { ReceiptController } from './controllers/receipt.controller';
import { RECEIPT_REPOSITORY } from './repositories/receipt-repository.interface';
import { PostgresReceiptRepository } from './repositories/postgres-receipt.repository';
import { ReceiptService } from './services/receipt.service';

@Module({
  imports: [PostgresModule, IdentityModule],
  controllers: [ReceiptController],
  providers: [
    ReceiptService,
    {
      provide: RECEIPT_REPOSITORY,
      useClass: PostgresReceiptRepository,
    },
  ],
  exports: [ReceiptService],
})
export class ReceiptModule {}
