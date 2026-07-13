import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { AuditService } from '../../audit/audit.service';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import {
  RecordVehicleMovementDto,
} from '../dto/record-vehicle-movement.dto';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import {
  UpdateVehicleStatusDto,
} from '../dto/update-vehicle-status.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import {
  VEHICLE_EVENTS,
} from '../vehicle.constants';
import {
  VEHICLE_REPOSITORY,
  VehicleRepository,
} from '../repositories/vehicle.repository';
import {
  Vehicle,
  VehicleFilters,
  VehicleMovementType,
  VehicleStatus,
} from '../types/vehicle.types';

@Injectable()
export class VehicleService {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly repository: VehicleRepository,
    private readonly eventBus: EventBusService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateVehicleDto) {
    const normalized =
      this.normalizeRegistrationNumber(
        dto.registrationNumber,
      );

    if (!normalized) {
      throw new BadRequestException(
        'Vehicle registration number is required',
      );
    }

    const duplicate =
      await this.repository.findByNormalizedRegistration(
        normalized,
      );

    if (duplicate) {
      throw new ConflictException(
        `Vehicle already registered: ${duplicate.registrationNumber}`,
      );
    }

    const now = new Date();

    const vehicle: Vehicle = {
      id: randomUUID(),
      registrationNumber:
        dto.registrationNumber.trim().toUpperCase(),
      normalizedRegistrationNumber: normalized,
      vehicleType: dto.vehicleType,
      ownerPersonId: dto.ownerPersonId,
      propertyId: dto.propertyId,
      spaceId: dto.spaceId,
      parkingSlot: dto.parkingSlot,
      make: dto.make,
      model: dto.model,
      colour: dto.colour,
      yearOfManufacture:
        dto.yearOfManufacture,
      rfidTag: dto.rfidTag,
      status: VehicleStatus.PENDING,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };

    const created =
      await this.repository.create(vehicle);

    await this.publish(
      VEHICLE_EVENTS.CREATED,
      created,
    );

    await this.auditService.record(
      VEHICLE_EVENTS.CREATED,
      'core.vehicle',
      this.auditPayload(created, {
        actorPersonId: dto.ownerPersonId,
      }),
    );

    return created;
  }

  list(filters: VehicleFilters = {}) {
    return this.repository.list({
      ...filters,
      registrationNumber:
        filters.registrationNumber
          ? this.normalizeRegistrationNumber(
              filters.registrationNumber,
            )
          : undefined,
    });
  }

  async search(query: string, limit = 25) {
    const vehicles = await this.repository.list({
      search: query,
    });

    return vehicles.slice(
      0,
      Math.min(Math.max(limit, 1), 100),
    );
  }

  async get(id: string) {
    const vehicle =
      await this.repository.findDetailsById(id);

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle not found: ${id}`,
      );
    }

    return vehicle;
  }

  async lookupByRegistration(
    registrationNumber: string,
  ) {
    const normalized =
      this.normalizeRegistrationNumber(
        registrationNumber,
      );

    const vehicle =
      await this.repository.findByNormalizedRegistration(
        normalized,
      );

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle not found: ${registrationNumber}`,
      );
    }

    return this.get(vehicle.id);
  }

  async update(
    id: string,
    dto: UpdateVehicleDto,
  ) {
    const current = await this.requireVehicle(id);

    const updated = await this.repository.update(
      id,
      {
        vehicleType:
          dto.vehicleType ?? current.vehicleType,
        ownerPersonId:
          dto.ownerPersonId ??
          current.ownerPersonId,
        spaceId: dto.spaceId ?? current.spaceId,
        parkingSlot:
          dto.parkingSlot ?? current.parkingSlot,
        make: dto.make ?? current.make,
        model: dto.model ?? current.model,
        colour: dto.colour ?? current.colour,
        yearOfManufacture:
          dto.yearOfManufacture ??
          current.yearOfManufacture,
        rfidTag: dto.rfidTag ?? current.rfidTag,
        notes: dto.notes ?? current.notes,
      },
    );

    if (!updated) {
      throw new NotFoundException(
        `Vehicle not found: ${id}`,
      );
    }

    await this.publish(
      VEHICLE_EVENTS.UPDATED,
      updated,
      {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      },
    );

    await this.auditService.record(
      VEHICLE_EVENTS.UPDATED,
      'core.vehicle',
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        remarks: dto.remarks,
      }),
    );

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateVehicleStatusDto,
  ) {
    const current = await this.requireVehicle(id);

    this.assertStatusTransition(
      current.status,
      dto.status,
    );

    const verified =
      dto.status === VehicleStatus.VERIFIED;

    const updated =
      await this.repository.updateStatus(
        id,
        dto.status,
        {
          verifiedByPersonId: verified
            ? dto.changedByPersonId
            : undefined,
          verifiedAt: verified
            ? new Date()
            : undefined,
          rejectionReason:
            dto.status === VehicleStatus.REJECTED
              ? dto.reason
              : undefined,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Vehicle not found: ${id}`,
      );
    }

    const event = this.eventForStatus(dto.status);

    await this.publish(event, updated, {
      actorPersonId: dto.changedByPersonId,
      reason: dto.reason,
      previousStatus: current.status,
    });

    await this.auditService.record(
      event,
      'core.vehicle',
      this.auditPayload(updated, {
        actorPersonId: dto.changedByPersonId,
        reason: dto.reason,
        previousStatus: current.status,
      }),
    );

    return updated;
  }

  async recordMovement(
    id: string,
    dto: RecordVehicleMovementDto,
  ) {
    const vehicle = await this.requireVehicle(id);

    if (
      vehicle.status !== VehicleStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Only verified vehicles can record movement',
      );
    }

    const existing =
      await this.repository.listMovements(id);

    const latest = existing[0];

    if (
      latest &&
      latest.movementType === dto.movementType
    ) {
      throw new BadRequestException(
        `Vehicle already has latest movement ${dto.movementType}`,
      );
    }

    const now = new Date();

    const movement =
      await this.repository.recordMovement({
        id: randomUUID(),
        vehicleId: id,
        movementType: dto.movementType,
        gate: dto.gate,
        recordedByPersonId:
          dto.recordedByPersonId,
        occurredAt: dto.occurredAt
          ? new Date(dto.occurredAt)
          : now,
        remarks: dto.remarks,
        createdAt: now,
      });

    await this.eventBus.publish(
      VEHICLE_EVENTS.MOVEMENT_RECORDED,
      'core.vehicle',
      {
        entityType: 'vehicle',
        entityId: vehicle.id,
        vehicleId: vehicle.id,
        registrationNumber:
          vehicle.registrationNumber,
        normalizedRegistrationNumber:
          vehicle.normalizedRegistrationNumber,
        propertyId: vehicle.propertyId,
        ownerPersonId: vehicle.ownerPersonId,
        movementType:
          movement.movementType,
        gate: movement.gate,
        occurredAt: movement.occurredAt,
        recordedByPersonId:
          movement.recordedByPersonId,
      },
    );

    await this.auditService.record(
      VEHICLE_EVENTS.MOVEMENT_RECORDED,
      'core.vehicle',
      {
        ...this.auditPayload(vehicle),
        movementId: movement.id,
        movementType:
          movement.movementType,
        gate: movement.gate,
        occurredAt: movement.occurredAt,
        actorPersonId:
          movement.recordedByPersonId,
      },
    );

    return movement;
  }

  getMetrics(propertyId?: string) {
    return this.repository.getMetrics(propertyId);
  }

  normalizeRegistrationNumber(
    value: string,
  ): string {
    return String(value ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  private async requireVehicle(
    id: string,
  ): Promise<Vehicle> {
    const vehicle =
      await this.repository.findById(id);

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle not found: ${id}`,
      );
    }

    return vehicle;
  }

  private assertStatusTransition(
    from: VehicleStatus,
    to: VehicleStatus,
  ): void {
    const transitions: Record<
      VehicleStatus,
      VehicleStatus[]
    > = {
      PENDING: [
        VehicleStatus.VERIFIED,
        VehicleStatus.REJECTED,
        VehicleStatus.ARCHIVED,
      ],
      VERIFIED: [
        VehicleStatus.SUSPENDED,
        VehicleStatus.ARCHIVED,
      ],
      REJECTED: [
        VehicleStatus.PENDING,
        VehicleStatus.ARCHIVED,
      ],
      SUSPENDED: [
        VehicleStatus.VERIFIED,
        VehicleStatus.ARCHIVED,
      ],
      ARCHIVED: [],
    };

    if (!transitions[from].includes(to)) {
      throw new BadRequestException(
        `Invalid vehicle status transition: ${from} -> ${to}`,
      );
    }
  }

  private eventForStatus(
    status: VehicleStatus,
  ): string {
    const events: Record<
      VehicleStatus,
      string
    > = {
      PENDING: VEHICLE_EVENTS.UPDATED,
      VERIFIED: VEHICLE_EVENTS.VERIFIED,
      REJECTED: VEHICLE_EVENTS.REJECTED,
      SUSPENDED: VEHICLE_EVENTS.SUSPENDED,
      ARCHIVED: VEHICLE_EVENTS.ARCHIVED,
    };

    return events[status];
  }

  private auditPayload(
    vehicle: Vehicle,
    extra: Record<string, unknown> = {},
  ) {
    return {
      entityType: 'vehicle',
      entityId: vehicle.id,
      vehicleId: vehicle.id,
      registrationNumber:
        vehicle.registrationNumber,
      normalizedRegistrationNumber:
        vehicle.normalizedRegistrationNumber,
      vehicleType: vehicle.vehicleType,
      ownerPersonId: vehicle.ownerPersonId,
      propertyId: vehicle.propertyId,
      spaceId: vehicle.spaceId,
      status: vehicle.status,
      ...extra,
    };
  }

  private publish(
    eventType: string,
    vehicle: Vehicle,
    extra: Record<string, unknown> = {},
  ) {
    return this.eventBus.publish(
      eventType,
      'core.vehicle',
      this.auditPayload(vehicle, extra),
    );
  }
}
