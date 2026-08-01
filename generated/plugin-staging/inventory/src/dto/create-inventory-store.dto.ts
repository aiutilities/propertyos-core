export class CreateInventoryStoreDto {
  storeCode!: string;
  name!: string;
  description?: string;
  propertyId!: string;
  zoneId?: string;
  spaceId?: string;
  managerPersonId?: string;
  createdByPersonId!: string;
}
