export class CreateUnitOfMeasureDto {
  code!: string;
  name!: string;
  symbol!: string;
  decimalPlaces = 2;
  createdByPersonId!: string;
}
