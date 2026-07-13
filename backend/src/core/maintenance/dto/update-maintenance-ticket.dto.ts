import { MaintenancePriority } from '../types/maintenance.types';

export class UpdateMaintenanceTicketDto {
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
  changedByPersonId!: string;
  remarks?: string;
}
