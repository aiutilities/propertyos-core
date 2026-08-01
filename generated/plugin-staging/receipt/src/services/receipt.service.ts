import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventBusService } from '@propertyos/core-contracts';
import { PaginatedResponseDto, PaginationQueryDto } from '@propertyos/core-contracts';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import {
  RECEIPT_REPOSITORY,
  ReceiptRepository,
} from '../repositories/receipt-repository.interface';
import { Receipt } from '../types';

@Injectable()
export class ReceiptService {
  constructor(
    @Inject(RECEIPT_REPOSITORY)
    private readonly receiptRepository: ReceiptRepository,
    private readonly eventBusService: EventBusService,
  ) {}

  async create(dto: CreateReceiptDto): Promise<Receipt> {
    const receipt = await this.receiptRepository.create(dto);

    await this.eventBusService.publish(
      'NOTIFICATION_REQUESTED',
      'receipt.service',
      {
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Receipt issued',
        message: `Receipt issued successfully: ${receipt.receiptNumber}`,
        metadata: {
          domainEventType: 'RECEIPT_ISSUED',
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
          tenantId: receipt.tenantId,
          rentLedgerId: receipt.rentLedgerId,
          amount: receipt.amount,
        },
      },
    );

    return receipt;
  }

  async findAll(): Promise<Receipt[]> {
    return this.receiptRepository.findAll();
  }

  async listPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Receipt>> {
    return this.receiptRepository.listPaginated(query);
  }

  async findById(id: string): Promise<Receipt> {
    const receipt = await this.receiptRepository.findById(id);

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }
}
