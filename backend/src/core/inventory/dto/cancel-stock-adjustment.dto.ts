import { IsString, IsUUID } from 'class-validator';

export class CancelStockAdjustmentDto {

  @IsUUID()
  cancelledByPersonId!: string;

  @IsString()
  cancellationReason!: string;
}
