import {
  IsUUID,
} from 'class-validator';

export class PostCycleCountDto {
  @IsUUID()
  postedByPersonId!: string;
}
