import {
  IsString,
  IsUUID,
} from 'class-validator';

export class CancelMaterialIssueDto {
  @IsUUID()
  cancelledByPersonId!: string;

  @IsString()
  cancellationReason!: string;
}
