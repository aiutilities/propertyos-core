export class CreateBrandDto {
  code!: string;
  name!: string;
  description?: string;
  createdByPersonId!: string;
}
