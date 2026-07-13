import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  randomUUID,
} from 'crypto';

import {
  AuditService,
} from '../../audit/audit.service';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  CreateVendorDto,
  VendorContactInputDto,
  VendorPropertyCoverageInputDto,
  VendorServiceCategoryInputDto,
} from '../dto/create-vendor.dto';

import {
  UpdateVendorDto,
} from '../dto/update-vendor.dto';

import {
  TransitionVendorDto,
} from '../dto/transition-vendor.dto';

import {
  CreateVendorContractDto,
} from '../dto/create-vendor-contract.dto';

import {
  RenewVendorContractDto,
} from '../dto/renew-vendor-contract.dto';

import {
  TransitionVendorContractDto,
} from '../dto/transition-vendor-contract.dto';

import {
  CreateVendorComplianceDto,
} from '../dto/create-vendor-compliance.dto';

import {
  VerifyVendorComplianceDto,
} from '../dto/verify-vendor-compliance.dto';

import {
  TransitionVendorComplianceDto,
} from '../dto/transition-vendor-compliance.dto';

import {
  CreateVendorWorkOrderDto,
} from '../dto/create-vendor-work-order.dto';

import {
  TransitionVendorWorkOrderDto,
} from '../dto/transition-vendor-work-order.dto';

import {
  CompleteVendorWorkOrderDto,
} from '../dto/complete-vendor-work-order.dto';

import {
  CancelVendorWorkOrderDto,
} from '../dto/cancel-vendor-work-order.dto';

import {
  CreateVendorRatingDto,
} from '../dto/create-vendor-rating.dto';

import {
  VENDOR_EVENTS,
} from '../vendor.constants';

import {
  VENDOR_REPOSITORY,
  VendorRepository,
} from '../repositories/vendor.repository';

import {
  Vendor,
  VendorComplianceDocument,
  VendorComplianceStatus,
  VendorContact,
  VendorContract,
  VendorContractStatus,
  VendorFilters,
  VendorPropertyCoverage,
  VendorRating,
  VendorServiceCategory,
  VendorStatus,
  VendorWorkOrder,
  VendorWorkOrderHistory,
  VendorWorkOrderStatus,
} from '../types/vendor.types';

@Injectable()
export class VendorService {
  constructor(
    @Inject(VENDOR_REPOSITORY)
    private readonly repository:
      VendorRepository,

    private readonly eventBus:
      EventBusService,

    private readonly auditService:
      AuditService,
  ) {}

  async create(
    dto: CreateVendorDto,
  ): Promise<Vendor> {
    this.requireText(
      dto.legalName,
      'legalName',
    );

    this.requireText(
      dto.displayName,
      'displayName',
    );

    const now =
      new Date();

    const vendor: Vendor = {
      id:
        randomUUID(),

      vendorNumber:
        this.createNumber(),

      legalName:
        dto.legalName.trim(),

      displayName:
        dto.displayName.trim(),

      vendorType:
        dto.vendorType,

      status:
        VendorStatus.DRAFT,

      email:
        dto.email?.trim() ||
        undefined,

      phone:
        dto.phone?.trim() ||
        undefined,

      website:
        dto.website?.trim() ||
        undefined,

      taxIdentifier:
        dto.taxIdentifier?.trim() ||
        undefined,

      panNumber:
        dto.panNumber?.trim() ||
        undefined,

      registrationNumber:
        dto.registrationNumber?.trim() ||
        undefined,

      addressLine1:
        dto.addressLine1?.trim() ||
        undefined,

      addressLine2:
        dto.addressLine2?.trim() ||
        undefined,

      city:
        dto.city?.trim() ||
        undefined,

      state:
        dto.state?.trim() ||
        undefined,

      country:
        dto.country?.trim() ||
        undefined,

      postalCode:
        dto.postalCode?.trim() ||
        undefined,

      notes:
        dto.notes?.trim() ||
        undefined,

      metadata:
        dto.metadata ?? {},

      createdByPersonId:
        dto.createdByPersonId,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const created =
      await this.repository.create(
        vendor,
      );

    if (dto.contacts) {
      await this.repository.replaceContacts(
        created.id,
        dto.contacts.map(
          (contact) =>
            this.mapContact(
              created.id,
              contact,
            ),
        ),
      );
    }

    if (dto.propertyCoverage) {
      await this.repository
        .replacePropertyCoverage(
          created.id,
          dto.propertyCoverage.map(
            (coverage) =>
              this.mapCoverage(
                created.id,
                coverage,
              ),
          ),
        );
    }

    if (dto.serviceCategories) {
      await this.validateCategories(
        dto.serviceCategories,
      );

      await this.repository
        .replaceServiceCategories(
          created.id,
          dto.serviceCategories.map(
            (category) =>
              this.mapServiceCategory(
                created.id,
                category,
              ),
          ),
        );
    }

    await this.publishEvent(
      VENDOR_EVENTS.CREATED,
      created,
    );

    await this.auditService.record(
      VENDOR_EVENTS.CREATED,
      'core.vendor',
      this.auditPayload(
        created,
        dto.createdByPersonId,
      ),
    );

    return created;
  }

  async list(
    filters:
      VendorFilters = {},
  ) {
    return this.repository.findAll(
      filters,
    );
  }

  async get(
    id: string,
  ) {
    const vendor =
      await this.repository
        .findDetailsById(id);

    if (!vendor) {
      throw new NotFoundException(
        `Vendor not found: ${id}`,
      );
    }

    return vendor;
  }

  async update(
    id: string,
    dto: UpdateVendorDto,
  ) {
    const current =
      await this.requireVendor(id);

    const updated =
      await this.repository.update(
        id,
        {
          legalName:
            dto.legalName?.trim() ||
            current.legalName,

          displayName:
            dto.displayName?.trim() ||
            current.displayName,

          vendorType:
            dto.vendorType ??
            current.vendorType,

          email:
            dto.email !== undefined
              ? dto.email.trim() ||
                undefined
              : current.email,

          phone:
            dto.phone !== undefined
              ? dto.phone.trim() ||
                undefined
              : current.phone,

          website:
            dto.website !== undefined
              ? dto.website.trim() ||
                undefined
              : current.website,

          taxIdentifier:
            dto.taxIdentifier !== undefined
              ? dto.taxIdentifier.trim() ||
                undefined
              : current.taxIdentifier,

          panNumber:
            dto.panNumber !== undefined
              ? dto.panNumber.trim() ||
                undefined
              : current.panNumber,

          registrationNumber:
            dto.registrationNumber !== undefined
              ? dto.registrationNumber.trim() ||
                undefined
              : current.registrationNumber,

          addressLine1:
            dto.addressLine1 !== undefined
              ? dto.addressLine1.trim() ||
                undefined
              : current.addressLine1,

          addressLine2:
            dto.addressLine2 !== undefined
              ? dto.addressLine2.trim() ||
                undefined
              : current.addressLine2,

          city:
            dto.city !== undefined
              ? dto.city.trim() ||
                undefined
              : current.city,

          state:
            dto.state !== undefined
              ? dto.state.trim() ||
                undefined
              : current.state,

          country:
            dto.country !== undefined
              ? dto.country.trim() ||
                undefined
              : current.country,

          postalCode:
            dto.postalCode !== undefined
              ? dto.postalCode.trim() ||
                undefined
              : current.postalCode,

          notes:
            dto.notes !== undefined
              ? dto.notes.trim() ||
                undefined
              : current.notes,

          metadata:
            dto.metadata ??
            current.metadata,

          updatedByPersonId:
            dto.updatedByPersonId,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Vendor not found: ${id}`,
      );
    }

    if (dto.contacts) {
      await this.repository.replaceContacts(
        id,
        dto.contacts.map(
          (contact) =>
            this.mapContact(
              id,
              contact,
            ),
        ),
      );
    }

    if (dto.propertyCoverage) {
      await this.repository
        .replacePropertyCoverage(
          id,
          dto.propertyCoverage.map(
            (coverage) =>
              this.mapCoverage(
                id,
                coverage,
              ),
          ),
        );
    }

    if (dto.serviceCategories) {
      await this.validateCategories(
        dto.serviceCategories,
      );

      await this.repository
        .replaceServiceCategories(
          id,
          dto.serviceCategories.map(
            (category) =>
              this.mapServiceCategory(
                id,
                category,
              ),
          ),
        );
    }

    await this.publishEvent(
      VENDOR_EVENTS.UPDATED,
      updated,
    );

    await this.auditService.record(
      VENDOR_EVENTS.UPDATED,
      'core.vendor',
      this.auditPayload(
        updated,
        dto.updatedByPersonId,
      ),
    );

    return updated;
  }

  async activate(
    id: string,
    dto: TransitionVendorDto,
  ) {
    const current =
      await this.requireVendor(id);

    if (
      current.status !==
      VendorStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Vendor cannot be activated from ${current.status}`,
      );
    }

    return this.transition(
      current,
      VendorStatus.ACTIVE,
      VENDOR_EVENTS.ACTIVATED,
      dto.changedByPersonId,
      dto.remarks,
      {
        activatedAt:
          new Date(),
        suspendedAt:
          undefined,
        blockedAt:
          undefined,
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async suspend(
    id: string,
    dto: TransitionVendorDto,
  ) {
    const current =
      await this.requireVendor(id);

    if (
      current.status !==
      VendorStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Vendor cannot be suspended from ${current.status}`,
      );
    }

    return this.transition(
      current,
      VendorStatus.SUSPENDED,
      VENDOR_EVENTS.SUSPENDED,
      dto.changedByPersonId,
      dto.remarks,
      {
        suspendedAt:
          new Date(),
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async block(
    id: string,
    dto: TransitionVendorDto,
  ) {
    const current =
      await this.requireVendor(id);

    if (
      ![
        VendorStatus.ACTIVE,
        VendorStatus.SUSPENDED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Vendor cannot be blocked from ${current.status}`,
      );
    }

    return this.transition(
      current,
      VendorStatus.BLOCKED,
      VENDOR_EVENTS.BLOCKED,
      dto.changedByPersonId,
      dto.remarks,
      {
        blockedAt:
          new Date(),
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async reactivate(
    id: string,
    dto: TransitionVendorDto,
  ) {
    const current =
      await this.requireVendor(id);

    if (
      ![
        VendorStatus.SUSPENDED,
        VendorStatus.BLOCKED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Vendor cannot be reactivated from ${current.status}`,
      );
    }

    return this.transition(
      current,
      VendorStatus.ACTIVE,
      VENDOR_EVENTS.REACTIVATED,
      dto.changedByPersonId,
      dto.remarks,
      {
        activatedAt:
          new Date(),
        suspendedAt:
          undefined,
        blockedAt:
          undefined,
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async archive(
    id: string,
    dto: TransitionVendorDto,
  ) {
    const current =
      await this.requireVendor(id);

    if (
      current.status ===
      VendorStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Vendor is already archived',
      );
    }

    return this.transition(
      current,
      VendorStatus.ARCHIVED,
      VENDOR_EVENTS.ARCHIVED,
      dto.changedByPersonId,
      dto.remarks,
      {
        archivedAt:
          new Date(),
        updatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async createRating(
    dto: CreateVendorRatingDto,
  ): Promise<VendorRating> {
    const vendor =
      await this.requireVendor(
        dto.vendorId,
      );

    if (
      vendor.status ===
      VendorStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Cannot rate an archived vendor',
      );
    }

    this.validateRating(
      dto.rating,
      'rating',
      false,
    );

    this.validateRating(
      dto.qualityRating,
      'qualityRating',
      true,
    );

    this.validateRating(
      dto.timelinessRating,
      'timelinessRating',
      true,
    );

    this.validateRating(
      dto.professionalismRating,
      'professionalismRating',
      true,
    );

    if (dto.workOrderId) {
      const workOrder =
        await this.requireWorkOrder(
          dto.workOrderId,
        );

      if (
        workOrder.vendorId !==
        dto.vendorId
      ) {
        throw new BadRequestException(
          'Work order does not belong to the selected vendor',
        );
      }

      if (
        workOrder.status !==
        VendorWorkOrderStatus.COMPLETED
      ) {
        throw new BadRequestException(
          'Only completed work orders can be rated',
        );
      }

      const existing =
        await this.repository
          .findRatingByWorkOrderAndPerson(
            dto.vendorId,
            dto.workOrderId,
            dto.ratedByPersonId,
          );

      if (existing) {
        throw new BadRequestException(
          'This person has already rated the work order',
        );
      }
    }

    const rating: VendorRating = {
      id:
        randomUUID(),

      vendorId:
        dto.vendorId,

      workOrderId:
        dto.workOrderId,

      propertyId:
        dto.propertyId,

      ratedByPersonId:
        dto.ratedByPersonId,

      rating:
        dto.rating,

      qualityRating:
        dto.qualityRating,

      timelinessRating:
        dto.timelinessRating,

      professionalismRating:
        dto.professionalismRating,

      comments:
        dto.comments?.trim() ||
        undefined,

      createdAt:
        new Date(),
    };

    const created =
      await this.repository
        .createRating(rating);

    await this.publishRatingEvent(
      VENDOR_EVENTS.RATED,
      created,
    );

    await this.auditService.record(
      VENDOR_EVENTS.RATED,
      'core.vendor',
      this.ratingAuditPayload(
        created,
      ),
    );

    return created;
  }

  async listRatings(
    vendorId: string,
  ) {
    await this.requireVendor(
      vendorId,
    );

    return this.repository
      .listRatings(vendorId);
  }

  async getRatingSummary(
    vendorId: string,
  ) {
    await this.requireVendor(
      vendorId,
    );

    return this.repository
      .getRatingSummary(
        vendorId,
      );
  }

  async createWorkOrder(
    dto: CreateVendorWorkOrderDto,
  ): Promise<VendorWorkOrder> {
    const vendor =
      await this.requireVendor(
        dto.vendorId,
      );

    if (
      vendor.status !==
      VendorStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Vendor must be ACTIVE before creating a work order',
      );
    }

    if (dto.contractId) {
      const contract =
        await this.requireContract(
          dto.contractId,
        );

      if (
        contract.vendorId !==
        dto.vendorId
      ) {
        throw new BadRequestException(
          'Contract does not belong to the selected vendor',
        );
      }

      if (
        contract.status !==
        VendorContractStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'Linked contract must be ACTIVE',
        );
      }
    }

    const scheduledStartAt =
      dto.scheduledStartAt
        ? this.parseDate(
            dto.scheduledStartAt,
            'scheduledStartAt',
          )
        : undefined;

    const scheduledEndAt =
      dto.scheduledEndAt
        ? this.parseDate(
            dto.scheduledEndAt,
            'scheduledEndAt',
          )
        : undefined;

    if (
      scheduledStartAt &&
      scheduledEndAt &&
      scheduledEndAt.getTime() <
        scheduledStartAt.getTime()
    ) {
      throw new BadRequestException(
        'scheduledEndAt must be on or after scheduledStartAt',
      );
    }

    this.validatePositiveNumber(
      dto.estimatedCost,
      'estimatedCost',
      true,
    );

    const now =
      new Date();

    const workOrder:
      VendorWorkOrder = {
        id:
          randomUUID(),

        workOrderNumber:
          this.createWorkOrderNumber(),

        vendorId:
          dto.vendorId,

        propertyId:
          dto.propertyId,

        zoneId:
          dto.zoneId,

        spaceId:
          dto.spaceId,

        contractId:
          dto.contractId,

        maintenanceTicketId:
          dto.maintenanceTicketId,

        helpdeskTicketId:
          dto.helpdeskTicketId,

        facilityAssetId:
          dto.facilityAssetId,

        title:
          dto.title.trim(),

        description:
          dto.description.trim(),

        priority:
          dto.priority,

        status:
          VendorWorkOrderStatus.DRAFT,

        scheduledStartAt,
        scheduledEndAt,

        estimatedCost:
          dto.estimatedCost,

        currency:
          (
            dto.currency ??
            'INR'
          )
            .trim()
            .toUpperCase(),

        assignedByPersonId:
          dto.assignedByPersonId,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const created =
      await this.repository
        .createWorkOrder(
          workOrder,
        );

    await this.addWorkOrderHistory(
      created,
      undefined,
      VendorWorkOrderStatus.DRAFT,
      dto.assignedByPersonId,
      'Work order created',
    );

    await this.publishWorkOrderEvent(
      VENDOR_EVENTS.WORK_ORDER_CREATED,
      created,
    );

    await this.auditService.record(
      VENDOR_EVENTS.WORK_ORDER_CREATED,
      'core.vendor',
      this.workOrderAuditPayload(
        created,
        dto.assignedByPersonId,
      ),
    );

    return created;
  }

  async listWorkOrders(
    filters: {
      vendorId?: string;
      propertyId?: string;
      contractId?: string;
      status?: string;
      priority?: string;
      search?: string;
    } = {},
  ) {
    return this.repository
      .listWorkOrders(filters);
  }

  async getWorkOrder(
    id: string,
  ) {
    const workOrder =
      await this.requireWorkOrder(
        id,
      );

    return {
      ...workOrder,
      history:
        await this.repository
          .listWorkOrderHistory(
            id,
          ),
    };
  }

  async issueWorkOrder(
    id: string,
    dto: TransitionVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      current.status !==
      VendorWorkOrderStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Work order cannot be issued from ${current.status}`,
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.ISSUED,
      VENDOR_EVENTS.WORK_ORDER_ASSIGNED,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async acceptWorkOrder(
    id: string,
    dto: TransitionVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      current.status !==
      VendorWorkOrderStatus.ISSUED
    ) {
      throw new BadRequestException(
        `Work order cannot be accepted from ${current.status}`,
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.ACCEPTED,
      VENDOR_EVENTS.WORK_ORDER_ACCEPTED,
      dto.changedByPersonId,
      dto.remarks,
      {
        acceptedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async rejectWorkOrder(
    id: string,
    dto: TransitionVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      current.status !==
      VendorWorkOrderStatus.ISSUED
    ) {
      throw new BadRequestException(
        `Work order cannot be rejected from ${current.status}`,
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.REJECTED,
      VENDOR_EVENTS.WORK_ORDER_REJECTED,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async startWorkOrder(
    id: string,
    dto: TransitionVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      current.status !==
      VendorWorkOrderStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        `Work order cannot start from ${current.status}`,
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.IN_PROGRESS,
      VENDOR_EVENTS.WORK_ORDER_STARTED,
      dto.changedByPersonId,
      dto.remarks,
      {
        actualStartAt:
          new Date(),
      },
    );
  }

  async holdWorkOrder(
    id: string,
    dto: TransitionVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      current.status !==
      VendorWorkOrderStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Work order cannot be put on hold from ${current.status}`,
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.ON_HOLD,
      VENDOR_EVENTS.WORK_ORDER_ON_HOLD,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async resumeWorkOrder(
    id: string,
    dto: TransitionVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      current.status !==
      VendorWorkOrderStatus.ON_HOLD
    ) {
      throw new BadRequestException(
        `Work order cannot resume from ${current.status}`,
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.IN_PROGRESS,
      VENDOR_EVENTS.WORK_ORDER_RESUMED,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async completeWorkOrder(
    id: string,
    dto: CompleteVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      ![
        VendorWorkOrderStatus.IN_PROGRESS,
        VendorWorkOrderStatus.ON_HOLD,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Work order cannot be completed from ${current.status}`,
      );
    }

    this.validatePositiveNumber(
      dto.actualCost,
      'actualCost',
      true,
    );

    if (
      !dto.completionNotes?.trim()
    ) {
      throw new BadRequestException(
        'completionNotes is required',
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.COMPLETED,
      VENDOR_EVENTS.WORK_ORDER_COMPLETED,
      dto.completedByPersonId,
      dto.remarks,
      {
        actualEndAt:
          new Date(),

        actualCost:
          dto.actualCost,

        completedByPersonId:
          dto.completedByPersonId,

        completionNotes:
          dto.completionNotes.trim(),
      },
    );
  }

  async cancelWorkOrder(
    id: string,
    dto: CancelVendorWorkOrderDto,
  ) {
    const current =
      await this.requireWorkOrder(
        id,
      );

    if (
      [
        VendorWorkOrderStatus.COMPLETED,
        VendorWorkOrderStatus.CANCELLED,
        VendorWorkOrderStatus.REJECTED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Work order cannot be cancelled from ${current.status}`,
      );
    }

    if (
      !dto.cancellationReason?.trim()
    ) {
      throw new BadRequestException(
        'cancellationReason is required',
      );
    }

    return this.transitionWorkOrder(
      current,
      VendorWorkOrderStatus.CANCELLED,
      VENDOR_EVENTS.WORK_ORDER_CANCELLED,
      dto.cancelledByPersonId,
      dto.remarks,
      {
        cancelledByPersonId:
          dto.cancelledByPersonId,

        cancellationReason:
          dto.cancellationReason.trim(),
      },
    );
  }

  async createComplianceDocument(
    dto: CreateVendorComplianceDto,
  ): Promise<VendorComplianceDocument> {
    const vendor =
      await this.requireVendor(
        dto.vendorId,
      );

    if (
      vendor.status ===
      VendorStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Cannot add compliance to an archived vendor',
      );
    }

    const issuedAt =
      dto.issuedAt
        ? this.parseDate(
            dto.issuedAt,
            'issuedAt',
          )
        : undefined;

    const expiresAt =
      dto.expiresAt
        ? this.parseDate(
            dto.expiresAt,
            'expiresAt',
          )
        : undefined;

    if (
      issuedAt &&
      expiresAt &&
      expiresAt.getTime() <
        issuedAt.getTime()
    ) {
      throw new BadRequestException(
        'expiresAt must be on or after issuedAt',
      );
    }

    const now =
      new Date();

    const document:
      VendorComplianceDocument = {
        id:
          randomUUID(),

        vendorId:
          dto.vendorId,

        complianceType:
          dto.complianceType,

        documentId:
          dto.documentId,

        referenceNumber:
          dto.referenceNumber?.trim() ||
          undefined,

        issuedAt,
        expiresAt,

        status:
          VendorComplianceStatus.PENDING,

        remarks:
          dto.remarks?.trim() ||
          undefined,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const created =
      await this.repository
        .createComplianceDocument(
          document,
        );

    await this.publishComplianceEvent(
      VENDOR_EVENTS.COMPLIANCE_ADDED,
      created,
    );

    await this.auditService.record(
      VENDOR_EVENTS.COMPLIANCE_ADDED,
      'core.vendor',
      this.complianceAuditPayload(
        created,
        dto.createdByPersonId,
      ),
    );

    return created;
  }

  async listComplianceDocuments(
    filters: {
      vendorId?: string;
      complianceType?: string;
      status?: string;
      expiringBefore?: string;
    } = {},
  ) {
    return this.repository
      .listComplianceDocuments({
        vendorId:
          filters.vendorId,
        complianceType:
          filters.complianceType,
        status:
          filters.status,
        expiringBefore:
          filters.expiringBefore
            ? this.parseDate(
                filters.expiringBefore,
                'expiringBefore',
              )
            : undefined,
      });
  }

  async getComplianceDocument(
    id: string,
  ) {
    return this.requireComplianceDocument(
      id,
    );
  }

  async verifyComplianceDocument(
    id: string,
    dto: VerifyVendorComplianceDto,
  ) {
    const current =
      await this.requireComplianceDocument(
        id,
      );

    if (
      ![
        VendorComplianceStatus.PENDING,
        VendorComplianceStatus.REJECTED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Compliance document cannot be verified from ${current.status}`,
      );
    }

    return this.transitionComplianceDocument(
      current,
      VendorComplianceStatus.VERIFIED,
      VENDOR_EVENTS.COMPLIANCE_VERIFIED,
      dto.verifiedByPersonId,
      dto.remarks,
      {
        verifiedByPersonId:
          dto.verifiedByPersonId,
        verifiedAt:
          new Date(),
      },
    );
  }

  async rejectComplianceDocument(
    id: string,
    dto: TransitionVendorComplianceDto,
  ) {
    const current =
      await this.requireComplianceDocument(
        id,
      );

    if (
      ![
        VendorComplianceStatus.PENDING,
        VendorComplianceStatus.VERIFIED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Compliance document cannot be rejected from ${current.status}`,
      );
    }

    return this.transitionComplianceDocument(
      current,
      VendorComplianceStatus.REJECTED,
      'vendor.compliance.rejected',
      dto.changedByPersonId,
      dto.remarks,
      {
        verifiedByPersonId:
          undefined,
        verifiedAt:
          undefined,
      },
    );
  }

  async waiveComplianceDocument(
    id: string,
    dto: TransitionVendorComplianceDto,
  ) {
    const current =
      await this.requireComplianceDocument(
        id,
      );

    if (
      current.status ===
      VendorComplianceStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Expired compliance cannot be waived',
      );
    }

    return this.transitionComplianceDocument(
      current,
      VendorComplianceStatus.WAIVED,
      'vendor.compliance.waived',
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async expireComplianceDocument(
    id: string,
    dto: TransitionVendorComplianceDto,
  ) {
    const current =
      await this.requireComplianceDocument(
        id,
      );

    if (
      ![
        VendorComplianceStatus.VERIFIED,
        VendorComplianceStatus.PENDING,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Compliance document cannot expire from ${current.status}`,
      );
    }

    return this.transitionComplianceDocument(
      current,
      VendorComplianceStatus.EXPIRED,
      VENDOR_EVENTS.COMPLIANCE_EXPIRED,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async createContract(
    dto: CreateVendorContractDto,
  ): Promise<VendorContract> {
    const vendor =
      await this.requireVendor(
        dto.vendorId,
      );

    if (
      vendor.status ===
      VendorStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Cannot create a contract for an archived vendor',
      );
    }

    const startDate =
      this.parseDate(
        dto.startDate,
        'startDate',
      );

    const endDate =
      this.parseDate(
        dto.endDate,
        'endDate',
      );

    this.validateContractDates(
      startDate,
      endDate,
    );

    this.validatePositiveNumber(
      dto.contractValue,
      'contractValue',
      true,
    );

    this.validatePositiveNumber(
      dto.responseSlaMinutes,
      'responseSlaMinutes',
      false,
    );

    this.validatePositiveNumber(
      dto.resolutionSlaMinutes,
      'resolutionSlaMinutes',
      false,
    );

    const renewalNoticeDays =
      dto.renewalNoticeDays ??
      30;

    if (
      renewalNoticeDays < 0
    ) {
      throw new BadRequestException(
        'renewalNoticeDays cannot be negative',
      );
    }

    const now =
      new Date();

    const contract: VendorContract = {
      id:
        randomUUID(),

      contractNumber:
        this.createContractNumber(),

      vendorId:
        dto.vendorId,

      propertyId:
        dto.propertyId,

      contractType:
        dto.contractType,

      title:
        dto.title.trim(),

      description:
        dto.description?.trim() ||
        undefined,

      status:
        VendorContractStatus.DRAFT,

      startDate,
      endDate,

      contractValue:
        dto.contractValue,

      currency:
        (
          dto.currency ??
          'INR'
        )
          .trim()
          .toUpperCase(),

      responseSlaMinutes:
        dto.responseSlaMinutes,

      resolutionSlaMinutes:
        dto.resolutionSlaMinutes,

      autoRenew:
        dto.autoRenew ??
        false,

      renewalNoticeDays:
        dto.renewalNoticeDays ??
        30,

      createdByPersonId:
        dto.createdByPersonId,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const created =
      await this.repository
        .createContract(contract);

    await this.publishContractEvent(
      VENDOR_EVENTS.CONTRACT_CREATED,
      created,
    );

    await this.auditService.record(
      VENDOR_EVENTS.CONTRACT_CREATED,
      'core.vendor',
      this.contractAuditPayload(
        created,
        dto.createdByPersonId,
      ),
    );

    return created;
  }

  async listContracts(
    filters: {
      vendorId?: string;
      propertyId?: string;
      status?: string;
      search?: string;
    } = {},
  ) {
    return this.repository
      .listContracts(filters);
  }

  async getContract(
    id: string,
  ) {
    return this.requireContract(id);
  }

  async activateContract(
    id: string,
    dto: TransitionVendorContractDto,
  ) {
    const current =
      await this.requireContract(id);

    if (
      current.status !==
      VendorContractStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Contract cannot be activated from ${current.status}`,
      );
    }

    const vendor =
      await this.requireVendor(
        current.vendorId,
      );

    if (
      vendor.status !==
      VendorStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Vendor must be ACTIVE before contract activation',
      );
    }

    return this.transitionContract(
      current,
      VendorContractStatus.ACTIVE,
      VENDOR_EVENTS.CONTRACT_ACTIVATED,
      dto.changedByPersonId,
      dto.remarks,
      {
        activatedAt:
          new Date(),
        approvedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async renewContract(
    id: string,
    dto: RenewVendorContractDto,
  ) {
    const current =
      await this.requireContract(id);

    if (
      ![
        VendorContractStatus.ACTIVE,
        VendorContractStatus.EXPIRED,
      ].includes(current.status)
    ) {
      throw new BadRequestException(
        `Contract cannot be renewed from ${current.status}`,
      );
    }

    const startDate =
      this.parseDate(
        dto.startDate,
        'startDate',
      );

    const endDate =
      this.parseDate(
        dto.endDate,
        'endDate',
      );

    this.validateContractDates(
      startDate,
      endDate,
    );

    this.validatePositiveNumber(
      dto.contractValue,
      'contractValue',
      true,
    );

    this.validatePositiveNumber(
      dto.responseSlaMinutes,
      'responseSlaMinutes',
      false,
    );

    this.validatePositiveNumber(
      dto.resolutionSlaMinutes,
      'resolutionSlaMinutes',
      false,
    );

    return this.transitionContract(
      current,
      VendorContractStatus.RENEWED,
      VENDOR_EVENTS.CONTRACT_RENEWED,
      dto.changedByPersonId,
      dto.remarks,
      {
        startDate,
        endDate,
        contractValue:
          dto.contractValue ??
          current.contractValue,
        responseSlaMinutes:
          dto.responseSlaMinutes ??
          current.responseSlaMinutes,
        resolutionSlaMinutes:
          dto.resolutionSlaMinutes ??
          current.resolutionSlaMinutes,
        renewedAt:
          new Date(),
        approvedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async expireContract(
    id: string,
    dto: TransitionVendorContractDto,
  ) {
    const current =
      await this.requireContract(id);

    if (
      current.status !==
      VendorContractStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Contract cannot expire from ${current.status}`,
      );
    }

    return this.transitionContract(
      current,
      VendorContractStatus.EXPIRED,
      VENDOR_EVENTS.CONTRACT_EXPIRED,
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async terminateContract(
    id: string,
    dto: TransitionVendorContractDto,
  ) {
    const current =
      await this.requireContract(id);

    if (
      current.status !==
      VendorContractStatus.ACTIVE
    ) {
      throw new BadRequestException(
        `Contract cannot be terminated from ${current.status}`,
      );
    }

    return this.transitionContract(
      current,
      VendorContractStatus.TERMINATED,
      VENDOR_EVENTS.CONTRACT_TERMINATED,
      dto.changedByPersonId,
      dto.remarks,
      {
        terminatedAt:
          new Date(),
        terminatedByPersonId:
          dto.changedByPersonId,
      },
    );
  }

  async cancelContract(
    id: string,
    dto: TransitionVendorContractDto,
  ) {
    const current =
      await this.requireContract(id);

    if (
      current.status !==
      VendorContractStatus.DRAFT
    ) {
      throw new BadRequestException(
        `Contract cannot be cancelled from ${current.status}`,
      );
    }

    return this.transitionContract(
      current,
      VendorContractStatus.CANCELLED,
      'vendor.contract.cancelled',
      dto.changedByPersonId,
      dto.remarks,
    );
  }

  async listCategories() {
    return this.repository
      .listCategories();
  }

  async getMetrics() {
    return this.repository
      .getMetrics();
  }

  private async requireWorkOrder(
    id: string,
  ): Promise<VendorWorkOrder> {
    const workOrder =
      await this.repository
        .findWorkOrderById(id);

    if (!workOrder) {
      throw new NotFoundException(
        `Vendor work order not found: ${id}`,
      );
    }

    return workOrder;
  }

  private async transitionWorkOrder(
    current: VendorWorkOrder,
    nextStatus: VendorWorkOrderStatus,
    eventName: string,
    changedByPersonId: string,
    remarks?: string,
    changes: Partial<VendorWorkOrder> = {},
  ): Promise<VendorWorkOrder> {
    const updated =
      await this.repository
        .updateWorkOrder(
          current.id,
          {
            ...changes,
            status:
              nextStatus,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Vendor work order not found: ${current.id}`,
      );
    }

    await this.addWorkOrderHistory(
      updated,
      current.status,
      nextStatus,
      changedByPersonId,
      remarks,
    );

    await this.publishWorkOrderEvent(
      eventName,
      updated,
    );

    await this.auditService.record(
      eventName,
      'core.vendor',
      {
        ...this.workOrderAuditPayload(
          updated,
          changedByPersonId,
        ),
        fromStatus:
          current.status,
        toStatus:
          nextStatus,
        remarks,
      },
    );

    return updated;
  }

  private async addWorkOrderHistory(
    workOrder: VendorWorkOrder,
    fromStatus: VendorWorkOrderStatus | undefined,
    toStatus: VendorWorkOrderStatus,
    changedByPersonId: string,
    remarks?: string,
  ): Promise<VendorWorkOrderHistory> {
    return this.repository
      .addWorkOrderHistory({
        id:
          randomUUID(),
        workOrderId:
          workOrder.id,
        fromStatus,
        toStatus,
        changedByPersonId,
        remarks,
        createdAt:
          new Date(),
      });
  }

  private async requireComplianceDocument(
    id: string,
  ): Promise<VendorComplianceDocument> {
    const document =
      await this.repository
        .findComplianceDocumentById(
          id,
        );

    if (!document) {
      throw new NotFoundException(
        `Vendor compliance document not found: ${id}`,
      );
    }

    return document;
  }

  private async transitionComplianceDocument(
    current: VendorComplianceDocument,
    nextStatus: VendorComplianceStatus,
    eventName: string,
    changedByPersonId: string,
    remarks?: string,
    changes: Partial<VendorComplianceDocument> = {},
  ): Promise<VendorComplianceDocument> {
    const updated =
      await this.repository
        .updateComplianceDocument(
          current.id,
          {
            ...changes,
            status:
              nextStatus,
            remarks:
              remarks ??
              changes.remarks ??
              current.remarks,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Vendor compliance document not found: ${current.id}`,
      );
    }

    await this.publishComplianceEvent(
      eventName,
      updated,
    );

    await this.auditService.record(
      eventName,
      'core.vendor',
      {
        ...this.complianceAuditPayload(
          updated,
          changedByPersonId,
        ),
        fromStatus:
          current.status,
        toStatus:
          nextStatus,
        remarks,
      },
    );

    return updated;
  }

  private async requireContract(
    id: string,
  ): Promise<VendorContract> {
    const contract =
      await this.repository
        .findContractById(id);

    if (!contract) {
      throw new NotFoundException(
        `Vendor contract not found: ${id}`,
      );
    }

    return contract;
  }

  private async transitionContract(
    current: VendorContract,
    nextStatus: VendorContractStatus,
    eventName: string,
    changedByPersonId: string,
    remarks?: string,
    changes: Partial<VendorContract> = {},
  ): Promise<VendorContract> {
    const updated =
      await this.repository
        .updateContract(
          current.id,
          {
            ...changes,
            status:
              nextStatus,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Vendor contract not found: ${current.id}`,
      );
    }

    await this.publishContractEvent(
      eventName,
      updated,
    );

    await this.auditService.record(
      eventName,
      'core.vendor',
      {
        ...this.contractAuditPayload(
          updated,
          changedByPersonId,
        ),
        fromStatus:
          current.status,
        toStatus:
          nextStatus,
        remarks,
      },
    );

    return updated;
  }

  private async transition(
    current: Vendor,
    nextStatus: VendorStatus,
    eventName: string,
    changedByPersonId: string,
    remarks?: string,
    changes: Partial<Vendor> = {},
  ): Promise<Vendor> {
    const updated =
      await this.repository.update(
        current.id,
        {
          ...changes,
          status:
            nextStatus,
        },
      );

    if (!updated) {
      throw new NotFoundException(
        `Vendor not found: ${current.id}`,
      );
    }

    await this.publishEvent(
      eventName,
      updated,
    );

    await this.auditService.record(
      eventName,
      'core.vendor',
      {
        ...this.auditPayload(
          updated,
          changedByPersonId,
        ),
        fromStatus:
          current.status,
        toStatus:
          nextStatus,
        remarks,
      },
    );

    return updated;
  }

  private async requireVendor(
    id: string,
  ): Promise<Vendor> {
    const vendor =
      await this.repository.findById(
        id,
      );

    if (!vendor) {
      throw new NotFoundException(
        `Vendor not found: ${id}`,
      );
    }

    return vendor;
  }

  private async validateCategories(
    categories:
      VendorServiceCategoryInputDto[],
  ): Promise<void> {
    for (
      const category
      of categories
    ) {
      const found =
        await this.repository
          .findCategoryById(
            category.categoryId,
          );

      if (
        !found ||
        !found.isActive
      ) {
        throw new BadRequestException(
          `Invalid vendor category: ${category.categoryId}`,
        );
      }
    }
  }

  private mapContact(
    vendorId: string,
    input: VendorContactInputDto,
  ): VendorContact {
    const now =
      new Date();

    return {
      id:
        randomUUID(),
      vendorId,
      contactType:
        input.contactType,
      name:
        input.name.trim(),
      designation:
        input.designation?.trim() ||
        undefined,
      email:
        input.email?.trim() ||
        undefined,
      phone:
        input.phone?.trim() ||
        undefined,
      isPrimary:
        input.isPrimary,
      isActive:
        true,
      createdAt:
        now,
      updatedAt:
        now,
    };
  }

  private mapCoverage(
    vendorId: string,
    input: VendorPropertyCoverageInputDto,
  ): VendorPropertyCoverage {
    return {
      id:
        randomUUID(),
      vendorId,
      propertyId:
        input.propertyId,
      zoneId:
        input.zoneId,
      isActive:
        true,
      createdAt:
        new Date(),
    };
  }

  private mapServiceCategory(
    vendorId: string,
    input: VendorServiceCategoryInputDto,
  ): VendorServiceCategory {
    return {
      id:
        randomUUID(),
      vendorId,
      categoryId:
        input.categoryId,
      notes:
        input.notes?.trim() ||
        undefined,
      isActive:
        true,
      createdAt:
        new Date(),
    };
  }

  private requireText(
    value: string,
    field: string,
  ): void {
    if (!value?.trim()) {
      throw new BadRequestException(
        `${field} is required`,
      );
    }
  }

  private validateRating(
    value: number | undefined,
    field: string,
    optional: boolean,
  ): void {
    if (
      value === undefined &&
      optional
    ) {
      return;
    }

    if (
      value === undefined ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 5
    ) {
      throw new BadRequestException(
        `${field} must be an integer between 1 and 5`,
      );
    }
  }

  private parseDate(
    value: string,
    field: string,
  ): Date {
    const parsed =
      new Date(value);

    if (
      !value ||
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      throw new BadRequestException(
        `${field} must be a valid date`,
      );
    }

    return parsed;
  }

  private validateContractDates(
    startDate: Date,
    endDate: Date,
  ): void {
    if (
      endDate.getTime() <
      startDate.getTime()
    ) {
      throw new BadRequestException(
        'endDate must be on or after startDate',
      );
    }
  }

  private validatePositiveNumber(
    value: number | undefined,
    field: string,
    allowZero: boolean,
  ): void {
    if (value === undefined) {
      return;
    }

    if (
      !Number.isFinite(value) ||
      (
        allowZero
          ? value < 0
          : value <= 0
      )
    ) {
      throw new BadRequestException(
        `${field} must be ${
          allowZero
            ? 'zero or greater'
            : 'greater than zero'
        }`,
      );
    }
  }

  private createWorkOrderNumber(): string {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    const suffix =
      randomUUID()
        .replace(/-/g, '')
        .slice(0, 8)
        .toUpperCase();

    return `VWO-${date}-${suffix}`;
  }

  private createContractNumber(): string {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    const suffix =
      randomUUID()
        .replace(/-/g, '')
        .slice(0, 8)
        .toUpperCase();

    return `VCT-${date}-${suffix}`;
  }

  private createNumber(): string {
    const date =
      new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    const suffix =
      randomUUID()
        .replace(/-/g, '')
        .slice(0, 8)
        .toUpperCase();

    return `VEN-${date}-${suffix}`;
  }

  private async publishRatingEvent(
    eventName: string,
    rating: VendorRating,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      'core.vendor',
      {
        ...rating,
        entityType:
          'vendor.rating',
        entityId:
          rating.id,
        eventVersion:
          1,
      },
    );
  }

  private async publishWorkOrderEvent(
    eventName: string,
    workOrder: VendorWorkOrder,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      'core.vendor',
      {
        ...workOrder,
        entityType:
          'vendor.work_order',
        entityId:
          workOrder.id,
        eventVersion:
          1,
      },
    );
  }

  private async publishComplianceEvent(
    eventName: string,
    document: VendorComplianceDocument,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      'core.vendor',
      {
        ...document,
        entityType:
          'vendor.compliance',
        entityId:
          document.id,
        eventVersion:
          1,
      },
    );
  }

  private async publishContractEvent(
    eventName: string,
    contract: VendorContract,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      'core.vendor',
      {
        ...contract,
        entityType:
          'vendor.contract',
        entityId:
          contract.id,
        eventVersion:
          1,
      },
    );
  }

  private async publishEvent(
    eventName: string,
    vendor: Vendor,
  ): Promise<void> {
    await this.eventBus.publish(
      eventName,
      'core.vendor',
      {
        ...vendor,
        entityType:
          'vendor',
        entityId:
          vendor.id,
        eventVersion:
          1,
      },
    );
  }

  private ratingAuditPayload(
    rating: VendorRating,
  ) {
    return {
      ratingId:
        rating.id,
      vendorId:
        rating.vendorId,
      workOrderId:
        rating.workOrderId,
      propertyId:
        rating.propertyId,
      rating:
        rating.rating,
      qualityRating:
        rating.qualityRating,
      timelinessRating:
        rating.timelinessRating,
      professionalismRating:
        rating.professionalismRating,
      actorPersonId:
        rating.ratedByPersonId,
    };
  }

  private workOrderAuditPayload(
    workOrder: VendorWorkOrder,
    actorPersonId: string,
  ) {
    return {
      workOrderId:
        workOrder.id,
      workOrderNumber:
        workOrder.workOrderNumber,
      vendorId:
        workOrder.vendorId,
      propertyId:
        workOrder.propertyId,
      contractId:
        workOrder.contractId,
      priority:
        workOrder.priority,
      status:
        workOrder.status,
      actorPersonId,
    };
  }

  private complianceAuditPayload(
    document: VendorComplianceDocument,
    actorPersonId: string,
  ) {
    return {
      complianceDocumentId:
        document.id,
      vendorId:
        document.vendorId,
      complianceType:
        document.complianceType,
      documentId:
        document.documentId,
      referenceNumber:
        document.referenceNumber,
      status:
        document.status,
      issuedAt:
        document.issuedAt,
      expiresAt:
        document.expiresAt,
      actorPersonId,
    };
  }

  private contractAuditPayload(
    contract: VendorContract,
    actorPersonId: string,
  ) {
    return {
      contractId:
        contract.id,
      contractNumber:
        contract.contractNumber,
      vendorId:
        contract.vendorId,
      propertyId:
        contract.propertyId,
      contractType:
        contract.contractType,
      status:
        contract.status,
      startDate:
        contract.startDate,
      endDate:
        contract.endDate,
      actorPersonId,
    };
  }

  private auditPayload(
    vendor: Vendor,
    actorPersonId: string,
  ) {
    return {
      vendorId:
        vendor.id,
      vendorNumber:
        vendor.vendorNumber,
      legalName:
        vendor.legalName,
      displayName:
        vendor.displayName,
      vendorType:
        vendor.vendorType,
      status:
        vendor.status,
      actorPersonId,
    };
  }
}
