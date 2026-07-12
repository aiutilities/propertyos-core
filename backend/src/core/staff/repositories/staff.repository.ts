import {
  Staff,
  StaffAttendance,
  StaffDetails,
  StaffFilters,
  StaffMetrics,
  StaffStatus,
  StaffStatusUpdate,
} from "../types/staff.types";

export const STAFF_REPOSITORY = Symbol("STAFF_REPOSITORY");

export interface StaffRepository {
  create(staff: Staff): Promise<Staff>;

  findById(id: string): Promise<Staff | null>;

  findDetailsById(id: string): Promise<StaffDetails | null>;

  findByNormalizedEmployeeCode(
    propertyId: string,
    normalizedEmployeeCode: string,
  ): Promise<Staff | null>;

  findByIdCardNumber(
    propertyId: string,
    idCardNumber: string,
  ): Promise<Staff | null>;

  findByQrCode(qrCode: string): Promise<Staff | null>;

  findByRfidTag(rfidTag: string): Promise<Staff | null>;

  list(filters?: StaffFilters): Promise<Staff[]>;

  update(id: string, input: Partial<Staff>): Promise<Staff | null>;

  updateStatus(
    id: string,
    status: StaffStatus,
    input?: StaffStatusUpdate,
  ): Promise<Staff | null>;

  recordAttendance(attendance: StaffAttendance): Promise<StaffAttendance>;

  listAttendance(staffId: string): Promise<StaffAttendance[]>;

  getMetrics(propertyId?: string): Promise<StaffMetrics>;
}
