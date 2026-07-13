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
  VENDOR_EVENTS,
} from '../vendor.constants';

import {
  VENDOR_REPOSITORY,
  VendorRepository,
} from '../repositories/vendor.repository';

import {
  Vendor,
  VendorContact,
  VendorFilters,
  VendorPropertyCoverage,
  VendorServiceCategory,
  VendorStatus,
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

  async listCategories() {
    return this.repository
      .listCategories();
  }

  async getMetrics() {
    return this.repository
      .getMetrics();
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
