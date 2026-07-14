import {
  CreateProcurementGoodsReceiptItemDto,
} from './create-procurement-goods-receipt.dto';

export class UpdateProcurementGoodsReceiptDto {
  receiptDate?: string;

  deliveryReference?: string;
  invoiceReference?: string;

  receivedByPersonId?: string;

  remarks?: string;

  items?: CreateProcurementGoodsReceiptItemDto[];

  updatedByPersonId!: string;
}
