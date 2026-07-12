import { MaintenancePriority } from '../types/maintenance.types';

export class CreateMaintenanceTicketDto {
  title!: string;
  description!: string;
  categoryId!: string;
  propertyId!: string;
  spaceId?: string;
  reporterPersonId!: string;
  priority: MaintenancePriority = MaintenancePriority.MEDIUM;
}
