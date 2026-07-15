import {
  IsUUID,
} from 'class-validator';

export class PostMaterialReturnDto {
  @IsUUID()
  postedByPersonId!: string;
}
