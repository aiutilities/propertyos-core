import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { InvoiceController } from './controllers/invoice.controller';
import { INVOICE_REPOSITORY } from './repositories/invoice-repository.interface';
import { PostgresInvoiceRepository } from './repositories/postgres-invoice.repository';
import { InvoiceService } from './services/invoice.service';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: PostgresInvoiceRepository,
    },
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
