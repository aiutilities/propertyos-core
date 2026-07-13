import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";

import { AuditService } from "../../audit/audit.service";
import { EventBusService } from "../../eventbus/services/eventbus.service";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { RecordStaffAttendanceDto } from "../dto/record-staff-attendance.dto";
import { UpdateStaffStatusDto } from "../dto/update-staff-status.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";
import {
  STAFF_REPOSITORY,
  StaffRepository,
} from "../repositories/staff.repository";
import { STAFF_EVENTS } from "../staff.constants";
import {
  Staff,
  StaffAttendanceType,
  StaffFilters,
  StaffStatus,
} from "../types/staff.types";

@Injectable()
export class StaffService {
  constructor(
    @Inject(STAFF_REPOSITORY)
    private readonly repository: StaffRepository,
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateStaffDto) {
    const normalizedEmployeeCode = this.normalizeEmployeeCode(dto.employeeCode);

    if (!normalizedEmployeeCode) {
      throw new BadRequestException("Staff employee code is required");
    }

    const duplicate = await this.repository.findByNormalizedEmployeeCode(
      dto.propertyId,
      normalizedEmployeeCode,
    );

    if (duplicate) {
      throw new ConflictException(
        `Staff already registered: ${duplicate.employeeCode}`,
      );
    }

    await this.assertCredentialsAvailable(dto.propertyId, {
      idCardNumber: dto.idCardNumber,
      qrCode: dto.qrCode,
      rfidTag: dto.rfidTag,
    });

    const now = new Date();

    const staff: Staff = {
      id: randomUUID(),
      employeeCode: dto.employeeCode.trim().toUpperCase(),
      normalizedEmployeeCode,
      personId: dto.personId,
      staffType: dto.staffType,
      propertyId: dto.propertyId,
      zoneId: dto.zoneId,
      employerName: dto.employerName,
      department: dto.department,
      designation: dto.designation,
      shiftName: dto.shiftName,
      idCardNumber: this.optionalTrim(dto.idCardNumber),
      qrCode: this.optionalTrim(dto.qrCode),
      rfidTag: this.optionalTrim(dto.rfidTag),
      status: StaffStatus.PENDING,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repository.create(staff);

    await this.publish(STAFF_EVENTS.CREATED, created);

    await this.auditService.record(
      STAFF_EVENTS.CREATED,
      "core.staff",
      this.auditPayload(created, {
        actorPersonId: dto.personId,
      }),
    );

    return created;
  }

  list(filters: StaffFilters = {}) {
    return this.repository.list({
      ...filters,
      employeeCode: filters.employeeCode
        ? this.normalizeEmployeeCode(filters.employeeCode)
        : undefined,
    });
  }

  async search(query: string, limit = 25) {
    const staffMembers = await this.repository.list({
      search: query,
    });

    return staffMembers.slice(0, Math.min(Math.max(limit, 1), 100));
  }

  async get(id: string) {
    const staff = await this.repository.findDetailsById(id);

    if (!staff) {
      throw new NotFoundException(`Staff not found: ${id}`);
    }

    return staff;
  }

  async lookupByEmployeeCode(propertyId: string, employeeCode: string) {
    if (!propertyId?.trim()) {
      throw new BadRequestException(
        "Property ID is required for employee-code lookup",
      );
    }

    const normalized = this.normalizeEmployeeCode(employeeCode);

    if (!normalized) {
      throw new BadRequestException("Employee code is required");
    }

    const staff = await this.repository.findByNormalizedEmployeeCode(
      propertyId,
      normalized,
    );

    if (!staff) {
      throw new NotFoundException(`Staff not found: ${employeeCode}`);
    }

    return this.get(staff.id);
  }

  async lookupByQrCode(qrCode: string) {
    const value = qrCode?.trim();

    if (!value) {
      throw new BadRequestException("QR code is required");
    }

    const staff = await this.repository.findByQrCode(value);

    if (!staff) {
      throw new NotFoundException("Staff not found for QR code");
    }

    return this.get(staff.id);
  }

  async lookupByRfidTag(rfidTag: string) {
    const value = rfidTag?.trim();

    if (!value) {
      throw new BadRequestException("RFID tag is required");
    }

    const staff = await this.repository.findByRfidTag(value);

    if (!staff) {
      throw new NotFoundException("Staff not found for RFID tag");
    }

    return this.get(staff.id);
  }

  async update(id: string, dto: UpdateStaffDto) {
    const current = await this.requireStaff(id);

    await this.assertCredentialsAvailable(
      current.propertyId,
      {
        idCardNumber: dto.idCardNumber,
        qrCode: dto.qrCode,
        rfidTag: dto.rfidTag,
      },
      current.id,
    );

    const updated = await this.repository.update(id, {
      personId: dto.personId ?? current.personId,
      staffType: dto.staffType ?? current.staffType,
      zoneId: dto.zoneId ?? current.zoneId,
      employerName: dto.employerName ?? current.employerName,
      department: dto.department ?? current.department,
      designation: dto.designation ?? current.designation,
      shiftName: dto.shiftName ?? current.shiftName,
      idCardNumber:
        dto.idCardNumber !== undefined
          ? this.optionalTrim(dto.idCardNumber)
          : current.idCardNumber,
      qrCode:
        dto.qrCode !== undefined
          ? this.optionalTrim(dto.qrCode)
          : current.qrCode,
      rfidTag:
        dto.rfidTag !== undefined
          ? this.optionalTrim(dto.rfidTag)
          : current.rfidTag,
      notes: dto.notes ?? current.notes,
    });

    if (!updated) {
      throw new NotFoundException(`Staff not found: ${id}`);
    }

    await this.publish(STAFF_EVENTS.UPDATED, updated, {
      actorPersonId: dto.changedByPersonId,
      remarks: dto.remarks,
    });

    await this.auditService.record(
      STAFF_EVENTS.UPDATED,
      "core.staff",
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return updated;
  }

  async updateStatus(id: string, dto: UpdateStaffStatusDto) {
    const current = await this.requireStaff(id);

    this.assertStatusTransition(current.status, dto.status);

    const activating = dto.status === StaffStatus.ACTIVE;

    const updated = await this.repository.updateStatus(id, dto.status, {
      verifiedByPersonId: activating ? dto.changedByPersonId : undefined,
      verifiedAt: activating ? new Date() : undefined,
    });

    if (!updated) {
      throw new NotFoundException(`Staff not found: ${id}`);
    }

    const event = this.eventForStatus(dto.status);

    await this.publish(event, updated, {
      actorPersonId: dto.changedByPersonId,
      reason: dto.reason,
      previousStatus: current.status,
    });

    await this.auditService.record(
      event,
      "core.staff",
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        reason: dto.reason,
        previousStatus: current.status,
      }),
    );

    return updated;
  }

  async recordAttendance(id: string, dto: RecordStaffAttendanceDto) {
    const staff = await this.requireStaff(id);

    if (staff.status !== StaffStatus.ACTIVE) {
      throw new BadRequestException("Only active staff can record attendance");
    }

    const existing = await this.repository.listAttendance(id);

    const latest = existing[0];

    if (latest && latest.attendanceType === dto.attendanceType) {
      throw new BadRequestException(
        `Staff already has latest attendance ${dto.attendanceType}`,
      );
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestException("Invalid attendance occurrence time");
    }

    const attendance = await this.repository.recordAttendance({
      id: randomUUID(),
      staffId: id,
      attendanceType: dto.attendanceType,
      gate: dto.gate,
      recordedByPersonId: dto.recordedByPersonId,
      occurredAt,
      remarks: dto.remarks,
      createdAt: new Date(),
    });

    const event =
      dto.attendanceType === StaffAttendanceType.CHECK_IN
        ? STAFF_EVENTS.CHECKED_IN
        : STAFF_EVENTS.CHECKED_OUT;

    const payload = {
      ...this.auditPayload(staff),
      attendanceId: attendance.id,
      attendanceType: attendance.attendanceType,
      gate: attendance.gate,
      occurredAt: attendance.occurredAt,
      actorPersonId: attendance.recordedByPersonId,
    };

    await this.eventBus.publish(
      STAFF_EVENTS.ATTENDANCE_RECORDED,
      "core.staff",
      payload,
    );

    await this.eventBus.publish(event, "core.staff", payload);

    await this.auditService.record(
      STAFF_EVENTS.ATTENDANCE_RECORDED,
      "core.staff",
      payload,
    );

    return attendance;
  }

  getMetrics(propertyId?: string) {
    return this.repository.getMetrics(propertyId);
  }

  normalizeEmployeeCode(value: string): string {
    return String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }

  private async requireStaff(id: string): Promise<Staff> {
    const staff = await this.repository.findById(id);

    if (!staff) {
      throw new NotFoundException(`Staff not found: ${id}`);
    }

    return staff;
  }

  private async assertCredentialsAvailable(
    propertyId: string,
    credentials: {
      idCardNumber?: string;
      qrCode?: string;
      rfidTag?: string;
    },
    currentStaffId?: string,
  ): Promise<void> {
    const idCardNumber = this.optionalTrim(credentials.idCardNumber);

    if (idCardNumber) {
      const duplicate = await this.repository.findByIdCardNumber(
        propertyId,
        idCardNumber,
      );

      if (duplicate && duplicate.id !== currentStaffId) {
        throw new ConflictException(
          `Staff ID card already registered: ${idCardNumber}`,
        );
      }
    }

    const qrCode = this.optionalTrim(credentials.qrCode);

    if (qrCode) {
      const duplicate = await this.repository.findByQrCode(qrCode);

      if (duplicate && duplicate.id !== currentStaffId) {
        throw new ConflictException("Staff QR code is already registered");
      }
    }

    const rfidTag = this.optionalTrim(credentials.rfidTag);

    if (rfidTag) {
      const duplicate = await this.repository.findByRfidTag(rfidTag);

      if (duplicate && duplicate.id !== currentStaffId) {
        throw new ConflictException("Staff RFID tag is already registered");
      }
    }
  }

  private assertStatusTransition(from: StaffStatus, to: StaffStatus): void {
    const transitions: Record<StaffStatus, StaffStatus[]> = {
      PENDING: [StaffStatus.ACTIVE, StaffStatus.ARCHIVED],
      ACTIVE: [
        StaffStatus.INACTIVE,
        StaffStatus.SUSPENDED,
        StaffStatus.ARCHIVED,
      ],
      INACTIVE: [StaffStatus.ACTIVE, StaffStatus.ARCHIVED],
      SUSPENDED: [StaffStatus.ACTIVE, StaffStatus.ARCHIVED],
      ARCHIVED: [],
    };

    if (!transitions[from].includes(to)) {
      throw new BadRequestException(
        `Invalid staff status transition: ${from} -> ${to}`,
      );
    }
  }

  private eventForStatus(status: StaffStatus): string {
    const events: Record<StaffStatus, string> = {
      PENDING: STAFF_EVENTS.UPDATED,
      ACTIVE: STAFF_EVENTS.ACTIVATED,
      INACTIVE: STAFF_EVENTS.DEACTIVATED,
      SUSPENDED: STAFF_EVENTS.SUSPENDED,
      ARCHIVED: STAFF_EVENTS.ARCHIVED,
    };

    return events[status];
  }

  private auditPayload(staff: Staff, extra: Record<string, unknown> = {}) {
    return {
      entityType: "staff",
      entityId: staff.id,
      staffId: staff.id,
      employeeCode: staff.employeeCode,
      normalizedEmployeeCode: staff.normalizedEmployeeCode,
      personId: staff.personId,
      staffType: staff.staffType,
      propertyId: staff.propertyId,
      zoneId: staff.zoneId,
      status: staff.status,
      ...extra,
    };
  }

  private publish(
    eventType: string,
    staff: Staff,
    extra: Record<string, unknown> = {},
  ) {
    return this.eventBus.publish(
      eventType,
      "core.staff",
      this.auditPayload(staff, extra),
    );
  }

  private optionalTrim(value?: string): string | undefined {
    const trimmed = value?.trim();

    return trimmed || undefined;
  }
}
