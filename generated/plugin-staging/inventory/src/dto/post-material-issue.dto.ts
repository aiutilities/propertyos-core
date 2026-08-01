import {
  IsUUID,
} from 'class-validator';

export class PostMaterialIssueDto {
  @IsUUID()
  postedByPersonId!: string;
}
