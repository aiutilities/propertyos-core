export class UpdateBrandDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedByPersonId!: string;
  remarks?: string;
}
