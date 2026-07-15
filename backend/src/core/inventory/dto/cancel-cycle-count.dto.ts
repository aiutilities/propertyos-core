import {
  IsString,
  IsUUID,
} from 'class-validator';

export class CancelCycleCountDto {
  @IsUUID()
  cancelledByPersonId!: string;

  @IsString()
  cancellationReason!: string;
}
