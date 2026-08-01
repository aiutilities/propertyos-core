import {
  IsUUID,
} from 'class-validator';

export class CompleteCycleCountDto {
  @IsUUID()
  completedByPersonId!: string;
}
