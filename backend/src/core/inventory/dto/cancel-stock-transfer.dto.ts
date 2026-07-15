import {
  IsString,
  IsUUID,
} from 'class-validator';

export class CancelStockTransferDto {
  @IsUUID()
  cancelledByPersonId!: string;

  @IsString()
  cancellationReason!: string;
}
