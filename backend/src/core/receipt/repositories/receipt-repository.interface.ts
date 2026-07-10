import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../platform';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { Receipt } from '../types';

export const RECEIPT_REPOSITORY = 'RECEIPT_REPOSITORY';

export interface ReceiptRepository {
  create(dto: CreateReceiptDto): Promise<Receipt>;

  findAll(): Promise<Receipt[]>;

  listPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Receipt>>;

  findById(id: string): Promise<Receipt | null>;
}
