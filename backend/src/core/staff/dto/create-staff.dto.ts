import { StaffType } from "../types/staff.types";

export class CreateStaffDto {
  employeeCode!: string;
  personId!: string;
  staffType!: StaffType;
  propertyId!: string;
  zoneId?: string;
  employerName?: string;
  department?: string;
  designation?: string;
  shiftName?: string;
  idCardNumber?: string;
  qrCode?: string;
  rfidTag?: string;
  notes?: string;
}
