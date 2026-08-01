export class UpdateInventoryStoreDto {
  name?: string;
  description?: string;
  zoneId?: string;
  spaceId?: string;
  managerPersonId?: string;
  updatedByPersonId!: string;
  remarks?: string;
}
