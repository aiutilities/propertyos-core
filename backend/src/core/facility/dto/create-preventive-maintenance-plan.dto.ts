import {
  PreventiveMaintenanceFrequency,
} from '../types/facility.types';

export class CreatePreventiveMaintenancePlanDto {
  name!: string;
  description?: string;
  frequency!: PreventiveMaintenanceFrequency;
  intervalDays?: number;
  nextDueAt!: string;
  assignedPersonId?: string;
  createdByPersonId!: string;
}
