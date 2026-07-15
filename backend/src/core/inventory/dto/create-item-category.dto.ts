export class CreateItemCategoryDto {
  parentCategoryId?: string;
  code!: string;
  name!: string;
  description?: string;
  createdByPersonId!: string;
}
