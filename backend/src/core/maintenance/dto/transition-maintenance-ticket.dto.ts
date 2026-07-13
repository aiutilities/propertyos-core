import { MaintenanceStatus } from '../types/maintenance.types';

export class TransitionMaintenanceTicketDto {
  status!: MaintenanceStatus;
  changedByPersonId!: string;
  remarks?: string;
}
