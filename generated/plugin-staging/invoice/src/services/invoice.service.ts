import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventBusService } from '@propertyos/core-contracts';
import { PaginatedResponseDto, PaginationQueryDto } from '@propertyos/core-contracts';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import {
  INVOICE_REPOSITORY,
  InvoiceRepository,
} from '../repositories/invoice-repository.interface';
import { Invoice } from '../types';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  async create(data: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(data.invoiceDate);

    const invoice = await this.invoiceRepository.create({
      ...data,
      invoiceNumber,
    });

    await this.eventBusService.publish(
      'NOTIFICATION_REQUESTED',
      'invoice.service',
      {
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Invoice issued',
        message: `Invoice issued successfully: ${invoice.invoiceNumber}`,
        metadata: {
          domainEventType: 'INVOICE_ISSUED',
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          tenantId: invoice.tenantId,
          agreementId: invoice.agreementId,
          amount: invoice.amount,
          status: invoice.status,
        },
      },
    );

    return invoice;
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.findAll();
  }

  async listPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Invoice>> {
    return this.invoiceRepository.listPaginated(query);
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private async generateInvoiceNumber(invoiceDate: string): Promise<string> {
    const compactDate = invoiceDate.replace(/-/g, '');
    let sequence = 1;

    while (true) {
      const invoiceNumber = `INV-${compactDate}-${String(sequence).padStart(3, '0')}`;
      const existing =
        await this.invoiceRepository.findByInvoiceNumber(invoiceNumber);

      if (!existing) {
        return invoiceNumber;
      }

      sequence += 1;
    }
  }
}
