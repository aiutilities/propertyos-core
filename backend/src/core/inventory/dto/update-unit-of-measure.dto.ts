export class UpdateUnitOfMeasureDto {
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
  isActive?: boolean;
  updatedByPersonId!: string;
  remarks?: string;
}
