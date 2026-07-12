import { StaffStatus } from "../types/staff.types";

export class UpdateStaffStatusDto {
  status!: StaffStatus;
  changedByPersonId!: string;
  reason?: string;
}
