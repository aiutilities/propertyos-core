export class UpdateItemCategoryDto {
  parentCategoryId?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedByPersonId!: string;
  remarks?: string;
}
