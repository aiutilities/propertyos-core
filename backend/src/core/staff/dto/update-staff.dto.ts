import { StaffType } from "../types/staff.types";

export class UpdateStaffDto {
  personId?: string;
  staffType?: StaffType;
  zoneId?: string;
  employerName?: string;
  department?: string;
  designation?: string;
  shiftName?: string;
  idCardNumber?: string;
  qrCode?: string;
  rfidTag?: string;
  notes?: string;
  changedByPersonId!: string;
  remarks?: string;
}
