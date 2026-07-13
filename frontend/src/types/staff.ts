export type StaffType =
  | "SECURITY"
  | "HOUSEKEEPING"
  | "MAINTENANCE"
  | "ELECTRICIAN"
  | "PLUMBER"
  | "GARDENER"
  | "ADMIN"
  | "VENDOR"
  | "CONTRACTOR"
  | "OTHER";

export type StaffStatus =
  "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";

export type StaffAttendanceType = "CHECK_IN" | "CHECK_OUT";

export interface StaffAttendance {
  id: string;
  staffId: string;
  attendanceType: StaffAttendanceType;
  gate?: string;
  recordedByPersonId: string;
  occurredAt: string;
  remarks?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  employeeCode: string;
  normalizedEmployeeCode: string;
  personId: string;
  staffType: StaffType;
  propertyId: string;
  zoneId?: string;
  employerName?: string;
  department?: string;
  designation?: string;
  shiftName?: string;
  idCardNumber?: string;
  qrCode?: string;
  rfidTag?: string;
  status: StaffStatus;
  verifiedByPersonId?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  attendance?: StaffAttendance[];
}

export interface StaffMetrics {
  total: number;
  pending: number;
  active: number;
  inactive: number;
  suspended: number;
  security: number;
  housekeeping: number;
  maintenance: number;
  currentlyInside: number;
}

export interface StaffFilters {
  propertyId?: string;
  zoneId?: string;
  personId?: string;
  staffType?: StaffType | "";
  status?: StaffStatus | "";
  employeeCode?: string;
  search?: string;
}

export interface CreateStaffInput {
  employeeCode: string;
  personId: string;
  staffType: StaffType;
  propertyId: string;
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

export interface UpdateStaffInput {
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
  changedByPersonId: string;
  remarks?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
