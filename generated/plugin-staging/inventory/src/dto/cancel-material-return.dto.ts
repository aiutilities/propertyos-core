import {
  IsString,
  IsUUID,
} from 'class-validator';

export class CancelMaterialReturnDto {
  @IsUUID()
  cancelledByPersonId!: string;

  @IsString()
  cancellationReason!: string;
}
