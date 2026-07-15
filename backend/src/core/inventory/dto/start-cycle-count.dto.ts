import {
  IsUUID,
} from 'class-validator';

export class StartCycleCountDto {
  @IsUUID()
  startedByPersonId!: string;
}
