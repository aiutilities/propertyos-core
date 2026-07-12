import { StaffAttendanceType } from "../types/staff.types";

export class RecordStaffAttendanceDto {
  attendanceType!: StaffAttendanceType;
  gate?: string;
  recordedByPersonId!: string;
  occurredAt?: string;
  remarks?: string;
}
