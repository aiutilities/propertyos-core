export enum StaffType {
  SECURITY = "SECURITY",
  HOUSEKEEPING = "HOUSEKEEPING",
  MAINTENANCE = "MAINTENANCE",
  ELECTRICIAN = "ELECTRICIAN",
  PLUMBER = "PLUMBER",
  GARDENER = "GARDENER",
  ADMIN = "ADMIN",
  VENDOR = "VENDOR",
  CONTRACTOR = "CONTRACTOR",
  OTHER = "OTHER",
}

export enum StaffStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

export enum StaffAttendanceType {
  CHECK_IN = "CHECK_IN",
  CHECK_OUT = "CHECK_OUT",
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
  verifiedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  attendanceType: StaffAttendanceType;
  gate?: string;
  recordedByPersonId: string;
  occurredAt: Date;
  remarks?: string;
  createdAt: Date;
}

export interface StaffDetails extends Staff {
  attendance: StaffAttendance[];
}

export interface StaffFilters {
  propertyId?: string;
  zoneId?: string;
  personId?: string;
  staffType?: StaffType;
  status?: StaffStatus;
  employeeCode?: string;
  search?: string;
}

export interface StaffStatusUpdate {
  verifiedByPersonId?: string;
  verifiedAt?: Date;
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
