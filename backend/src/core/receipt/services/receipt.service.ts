import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async create(dto: CreateReceiptDto): Promise<Receipt> {
    return this.receiptRepository.create(dto);
  }

  async findAll(): Promise<Receipt[]> {
    return this.receiptRepository.findAll();
  }

  async findById(id: string): Promise<Receipt> {
    const receipt = await this.receiptRepository.findById(id);

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }
}
