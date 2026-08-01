import { IsUUID } from 'class-validator';

export class PostStockAdjustmentDto {

  @IsUUID()
  postedByPersonId!: string;
}
