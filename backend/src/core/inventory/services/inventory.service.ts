import {
  BadRequestException,
  ConflictException,
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
  INVENTORY_EVENTS,
} from '../inventory.constants';

import {
  CreateBinLocationDto,
  CreateBrandDto,
  CreateInventoryItemDto,
  CreateInventoryStoreDto,
  CreateItemCategoryDto,
  CreateUnitOfMeasureDto,
  TransitionInventoryItemDto,
  TransitionInventoryStoreDto,
  UpdateBinLocationDto,
  UpdateBrandDto,
  UpdateInventoryItemDto,
  UpdateInventoryStoreDto,
  UpdateItemCategoryDto,
  UpdateUnitOfMeasureDto,
} from '../dto';

import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../repositories/inventory.repository';

import {
  InventoryBinLocation,
  InventoryBrand,
  InventoryItem,
  InventoryItemCategory,
  InventoryItemFilters,
  InventoryStockBalanceFilters,
  InventoryStore,
  InventoryStoreFilters,
  InventoryUnitOfMeasure,
} from '../types/inventory.types';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repository:
      InventoryRepository,

    private readonly eventBus:
      EventBusService,

    private readonly auditService:
      AuditService,
  ) {}

  async createUnitOfMeasure(
    dto: CreateUnitOfMeasureDto,
  ) {
    this.requireText(
      dto.code,
      'code',
    );

    this.requireText(
      dto.name,
      'name',
    );

    this.requireText(
      dto.symbol,
      'symbol',
    );

    const decimalPlaces =
      Number(dto.decimalPlaces);

    if (
      !Number.isInteger(
        decimalPlaces,
      ) ||
      decimalPlaces < 0 ||
      decimalPlaces > 6
    ) {
      throw new BadRequestException(
        'decimalPlaces must be an integer between 0 and 6',
      );
    }

    const now = new Date();

    const unit:
      InventoryUnitOfMeasure = {
        id: randomUUID(),
        code:
          dto.code
            .trim()
            .toUpperCase(),
        name:
          dto.name.trim(),
        symbol:
          dto.symbol.trim(),
        decimalPlaces,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

    const created =
      await this.withConflict(
        () =>
          this.repository
            .createUnitOfMeasure(
              unit,
            ),
        `Unit of Measure already exists: ${unit.code}`,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.UNIT_CREATED,
      'inventory.unit_of_measure',
      created.id,
      {
        unitId: created.id,
        code: created.code,
        name: created.name,
        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  listUnitsOfMeasure(
    activeOnly = true,
  ) {
    return this.repository
      .listUnitsOfMeasure(
        activeOnly,
      );
  }

  async getUnitOfMeasure(
    id: string,
  ) {
    const unit =
      await this.repository
        .findUnitOfMeasureById(
          id,
        );

    if (!unit) {
      throw new NotFoundException(
        `Unit of Measure not found: ${id}`,
      );
    }

    return unit;
  }

  async updateUnitOfMeasure(
    id: string,
    dto: UpdateUnitOfMeasureDto,
  ) {
    const current =
      await this.getUnitOfMeasure(
        id,
      );

    this.assertDecimalPlaces(
      dto.decimalPlaces,
    );

    const updated:
      InventoryUnitOfMeasure = {
        ...current,
        name:
          dto.name !== undefined
            ? this.requiredTrimmed(
                dto.name,
                'name',
              )
            : current.name,
        symbol:
          dto.symbol !== undefined
            ? this.requiredTrimmed(
                dto.symbol,
                'symbol',
              )
            : current.symbol,
        decimalPlaces:
          dto.decimalPlaces ??
          current.decimalPlaces,
        isActive:
          dto.isActive ??
          current.isActive,
        updatedAt:
          new Date(),
      };

    const result =
      await this.withConflict(
        async () => {
          const repository =
            this.repository as
              InventoryRepository & {
                updateUnitOfMeasure?: (
                  unitId: string,
                  input:
                    InventoryUnitOfMeasure,
                ) =>
                  Promise<
                    InventoryUnitOfMeasure | null
                  >;
              };

          if (
            !repository
              .updateUnitOfMeasure
          ) {
            throw new BadRequestException(
              'Unit of Measure updates are not supported by the repository',
            );
          }

          return repository
            .updateUnitOfMeasure(
              id,
              updated,
            );
        },
        `Unit of Measure update conflicts with an existing record`,
      );

    if (!result) {
      throw new NotFoundException(
        `Unit of Measure not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS.UNIT_UPDATED,
      'inventory.unit_of_measure',
      result.id,
      {
        unitId: result.id,
        code: result.code,
        actorPersonId:
          dto.updatedByPersonId,
        remarks: dto.remarks,
      },
    );

    return result;
  }

  async createCategory(
    dto: CreateItemCategoryDto,
  ) {
    this.requireText(
      dto.code,
      'code',
    );

    this.requireText(
      dto.name,
      'name',
    );

    if (dto.parentCategoryId) {
      const parent =
        await this.repository
          .findCategoryById(
            dto.parentCategoryId,
          );

      if (
        !parent ||
        !parent.isActive
      ) {
        throw new BadRequestException(
          `Invalid parent Inventory category: ${dto.parentCategoryId}`,
        );
      }
    }

    const now = new Date();

    const category:
      InventoryItemCategory = {
        id: randomUUID(),
        parentCategoryId:
          dto.parentCategoryId,
        code:
          dto.code
            .trim()
            .toUpperCase(),
        name:
          dto.name.trim(),
        description:
          this.optionalTrimmed(
            dto.description,
          ),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

    const created =
      await this.withConflict(
        () =>
          this.repository
            .createCategory(
              category,
            ),
        `Inventory category already exists: ${category.code}`,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.CATEGORY_CREATED,
      'inventory.category',
      created.id,
      {
        categoryId:
          created.id,
        code: created.code,
        parentCategoryId:
          created.parentCategoryId,
        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  listCategories(
    activeOnly = true,
  ) {
    return this.repository
      .listCategories(
        activeOnly,
      );
  }

  async getCategory(
    id: string,
  ) {
    const category =
      await this.repository
        .findCategoryById(id);

    if (!category) {
      throw new NotFoundException(
        `Inventory category not found: ${id}`,
      );
    }

    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateItemCategoryDto,
  ) {
    const current =
      await this.getCategory(id);

    if (
      dto.parentCategoryId === id
    ) {
      throw new BadRequestException(
        'An Inventory category cannot be its own parent',
      );
    }

    if (dto.parentCategoryId) {
      const parent =
        await this.repository
          .findCategoryById(
            dto.parentCategoryId,
          );

      if (
        !parent ||
        !parent.isActive
      ) {
        throw new BadRequestException(
          `Invalid parent Inventory category: ${dto.parentCategoryId}`,
        );
      }
    }

    const updated:
      InventoryItemCategory = {
        ...current,
        parentCategoryId:
          dto.parentCategoryId !==
          undefined
            ? dto.parentCategoryId
            : current.parentCategoryId,
        name:
          dto.name !== undefined
            ? this.requiredTrimmed(
                dto.name,
                'name',
              )
            : current.name,
        description:
          dto.description !==
          undefined
            ? this.optionalTrimmed(
                dto.description,
              )
            : current.description,
        isActive:
          dto.isActive ??
          current.isActive,
        updatedAt:
          new Date(),
      };

    const result =
      await this.requireRepositoryUpdate(
        'updateCategory',
        id,
        updated,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.CATEGORY_UPDATED,
      'inventory.category',
      result.id,
      {
        categoryId:
          result.id,
        code: result.code,
        actorPersonId:
          dto.updatedByPersonId,
        remarks: dto.remarks,
      },
    );

    return result;
  }

  async createBrand(
    dto: CreateBrandDto,
  ) {
    this.requireText(
      dto.code,
      'code',
    );

    this.requireText(
      dto.name,
      'name',
    );

    const now = new Date();

    const brand:
      InventoryBrand = {
        id: randomUUID(),
        code:
          dto.code
            .trim()
            .toUpperCase(),
        name:
          dto.name.trim(),
        description:
          this.optionalTrimmed(
            dto.description,
          ),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

    const created =
      await this.withConflict(
        () =>
          this.repository
            .createBrand(brand),
        `Inventory brand already exists: ${brand.code}`,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.BRAND_CREATED,
      'inventory.brand',
      created.id,
      {
        brandId: created.id,
        code: created.code,
        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  listBrands(
    activeOnly = true,
  ) {
    return this.repository
      .listBrands(activeOnly);
  }

  async getBrand(
    id: string,
  ) {
    const brand =
      await this.repository
        .findBrandById(id);

    if (!brand) {
      throw new NotFoundException(
        `Inventory brand not found: ${id}`,
      );
    }

    return brand;
  }

  async updateBrand(
    id: string,
    dto: UpdateBrandDto,
  ) {
    const current =
      await this.getBrand(id);

    const updated:
      InventoryBrand = {
        ...current,
        name:
          dto.name !== undefined
            ? this.requiredTrimmed(
                dto.name,
                'name',
              )
            : current.name,
        description:
          dto.description !==
          undefined
            ? this.optionalTrimmed(
                dto.description,
              )
            : current.description,
        isActive:
          dto.isActive ??
          current.isActive,
        updatedAt:
          new Date(),
      };

    const result =
      await this.requireRepositoryUpdate(
        'updateBrand',
        id,
        updated,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.BRAND_UPDATED,
      'inventory.brand',
      result.id,
      {
        brandId: result.id,
        code: result.code,
        actorPersonId:
          dto.updatedByPersonId,
        remarks: dto.remarks,
      },
    );

    return result;
  }

  async createItem(
    dto: CreateInventoryItemDto,
  ) {
    this.requireText(
      dto.sku,
      'sku',
    );

    this.requireText(
      dto.name,
      'name',
    );

    const existing =
      await this.repository
        .findItemBySku(
          dto.sku.trim(),
        );

    if (existing) {
      throw new ConflictException(
        `Inventory item SKU already exists: ${dto.sku.trim().toUpperCase()}`,
      );
    }

    await this.requireActiveCategory(
      dto.categoryId,
    );

    await this.requireActiveUnit(
      dto.unitOfMeasureId,
    );

    if (dto.brandId) {
      await this.requireActiveBrand(
        dto.brandId,
      );
    }

    this.assertNonNegative(
      dto.minimumStockLevel,
      'minimumStockLevel',
    );

    this.assertNonNegative(
      dto.reorderLevel,
      'reorderLevel',
    );

    this.assertNonNegative(
      dto.reorderQuantity,
      'reorderQuantity',
    );

    this.assertNonNegative(
      dto.standardCost,
      'standardCost',
    );

    const now = new Date();

    const item:
      InventoryItem = {
        id: randomUUID(),
        sku:
          dto.sku
            .trim()
            .toUpperCase(),
        name:
          dto.name.trim(),
        description:
          this.optionalTrimmed(
            dto.description,
          ),
        categoryId:
          dto.categoryId,
        unitOfMeasureId:
          dto.unitOfMeasureId,
        brandId:
          dto.brandId,
        itemType:
          dto.itemType,
        barcode:
          this.optionalTrimmed(
            dto.barcode,
          ),
        manufacturerPartNumber:
          this.optionalTrimmed(
            dto.manufacturerPartNumber,
          ),
        minimumStockLevel:
          Number(
            dto.minimumStockLevel,
          ),
        reorderLevel:
          Number(
            dto.reorderLevel,
          ),
        reorderQuantity:
          Number(
            dto.reorderQuantity,
          ),
        standardCost:
          Number(
            dto.standardCost,
          ),
        currency:
          this.normalizeCurrency(
            dto.currency,
          ),
        isSerialized:
          Boolean(
            dto.isSerialized,
          ),
        isBatchTracked:
          Boolean(
            dto.isBatchTracked,
          ),
        isActive: true,
        createdByPersonId:
          dto.createdByPersonId,
        createdAt: now,
        updatedAt: now,
      };

    const created =
      await this.withConflict(
        () =>
          this.repository
            .createItem(item),
        `Inventory item conflicts with an existing SKU or barcode`,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.ITEM_CREATED,
      'inventory.item',
      created.id,
      this.itemPayload(
        created,
        dto.createdByPersonId,
      ),
    );

    return created;
  }

  listItems(
    filters:
      InventoryItemFilters = {},
  ) {
    return this.repository
      .listItems(filters);
  }

  async searchItems(
    query: string,
    limit = 25,
  ) {
    if (!query?.trim()) {
      return [];
    }

    const items =
      await this.repository
        .listItems({
          search:
            query.trim(),
          isActive: true,
        });

    return items.slice(
      0,
      Math.min(
        Math.max(limit, 1),
        100,
      ),
    );
  }

  async getItem(
    id: string,
  ) {
    const item =
      await this.repository
        .findItemById(id);

    if (!item) {
      throw new NotFoundException(
        `Inventory item not found: ${id}`,
      );
    }

    return item;
  }

  async updateItem(
    id: string,
    dto: UpdateInventoryItemDto,
  ) {
    const current =
      await this.getItem(id);

    if (dto.categoryId) {
      await this.requireActiveCategory(
        dto.categoryId,
      );
    }

    if (dto.unitOfMeasureId) {
      await this.requireActiveUnit(
        dto.unitOfMeasureId,
      );
    }

    if (dto.brandId) {
      await this.requireActiveBrand(
        dto.brandId,
      );
    }

    this.assertNonNegative(
      dto.minimumStockLevel,
      'minimumStockLevel',
    );

    this.assertNonNegative(
      dto.reorderLevel,
      'reorderLevel',
    );

    this.assertNonNegative(
      dto.reorderQuantity,
      'reorderQuantity',
    );

    this.assertNonNegative(
      dto.standardCost,
      'standardCost',
    );

    const updated =
      await this.withConflict(
        () =>
          this.repository
            .updateItem(
              id,
              {
                name:
                  dto.name !==
                  undefined
                    ? this.requiredTrimmed(
                        dto.name,
                        'name',
                      )
                    : current.name,
                description:
                  dto.description !==
                  undefined
                    ? this.optionalTrimmed(
                        dto.description,
                      )
                    : current.description,
                categoryId:
                  dto.categoryId ??
                  current.categoryId,
                unitOfMeasureId:
                  dto.unitOfMeasureId ??
                  current.unitOfMeasureId,
                brandId:
                  dto.brandId !==
                  undefined
                    ? dto.brandId
                    : current.brandId,
                itemType:
                  dto.itemType ??
                  current.itemType,
                barcode:
                  dto.barcode !==
                  undefined
                    ? this.optionalTrimmed(
                        dto.barcode,
                      )
                    : current.barcode,
                manufacturerPartNumber:
                  dto.manufacturerPartNumber !==
                  undefined
                    ? this.optionalTrimmed(
                        dto.manufacturerPartNumber,
                      )
                    : current.manufacturerPartNumber,
                minimumStockLevel:
                  dto.minimumStockLevel ??
                  current.minimumStockLevel,
                reorderLevel:
                  dto.reorderLevel ??
                  current.reorderLevel,
                reorderQuantity:
                  dto.reorderQuantity ??
                  current.reorderQuantity,
                standardCost:
                  dto.standardCost ??
                  current.standardCost,
                currency:
                  dto.currency
                    ? this.normalizeCurrency(
                        dto.currency,
                      )
                    : current.currency,
                isSerialized:
                  dto.isSerialized ??
                  current.isSerialized,
                isBatchTracked:
                  dto.isBatchTracked ??
                  current.isBatchTracked,
                updatedByPersonId:
                  dto.updatedByPersonId,
              },
            ),
        'Inventory item update conflicts with an existing barcode',
      );

    if (!updated) {
      throw new NotFoundException(
        `Inventory item not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS.ITEM_UPDATED,
      'inventory.item',
      updated.id,
      this.itemPayload(
        updated,
        dto.updatedByPersonId,
        dto.remarks,
      ),
    );

    return updated;
  }

  async activateItem(
    id: string,
    dto: TransitionInventoryItemDto,
  ) {
    return this.transitionItem(
      id,
      true,
      INVENTORY_EVENTS.ITEM_ACTIVATED,
      dto,
    );
  }

  async deactivateItem(
    id: string,
    dto: TransitionInventoryItemDto,
  ) {
    return this.transitionItem(
      id,
      false,
      INVENTORY_EVENTS.ITEM_DEACTIVATED,
      dto,
    );
  }

  async createStore(
    dto: CreateInventoryStoreDto,
  ) {
    this.requireText(
      dto.storeCode,
      'storeCode',
    );

    this.requireText(
      dto.name,
      'name',
    );

    this.requireText(
      dto.propertyId,
      'propertyId',
    );

    const now = new Date();

    const store:
      InventoryStore = {
        id: randomUUID(),
        storeCode:
          dto.storeCode
            .trim()
            .toUpperCase(),
        name:
          dto.name.trim(),
        description:
          this.optionalTrimmed(
            dto.description,
          ),
        propertyId:
          dto.propertyId,
        zoneId:
          dto.zoneId,
        spaceId:
          dto.spaceId,
        managerPersonId:
          dto.managerPersonId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

    const created =
      await this.withConflict(
        () =>
          this.repository
            .createStore(store),
        `Inventory store already exists for this property: ${store.storeCode}`,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.STORE_CREATED,
      'inventory.store',
      created.id,
      this.storePayload(
        created,
        dto.createdByPersonId,
      ),
    );

    return created;
  }

  listStores(
    filters:
      InventoryStoreFilters = {},
  ) {
    return this.repository
      .listStores(filters);
  }

  async getStore(
    id: string,
  ) {
    const store =
      await this.repository
        .findStoreById(id);

    if (!store) {
      throw new NotFoundException(
        `Inventory store not found: ${id}`,
      );
    }

    return store;
  }

  async updateStore(
    id: string,
    dto: UpdateInventoryStoreDto,
  ) {
    const current =
      await this.getStore(id);

    const updated =
      await this.repository
        .updateStore(
          id,
          {
            name:
              dto.name !==
              undefined
                ? this.requiredTrimmed(
                    dto.name,
                    'name',
                  )
                : current.name,
            description:
              dto.description !==
              undefined
                ? this.optionalTrimmed(
                    dto.description,
                  )
                : current.description,
            zoneId:
              dto.zoneId !==
              undefined
                ? dto.zoneId
                : current.zoneId,
            spaceId:
              dto.spaceId !==
              undefined
                ? dto.spaceId
                : current.spaceId,
            managerPersonId:
              dto.managerPersonId !==
              undefined
                ? dto.managerPersonId
                : current.managerPersonId,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory store not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS.STORE_UPDATED,
      'inventory.store',
      updated.id,
      this.storePayload(
        updated,
        dto.updatedByPersonId,
        dto.remarks,
      ),
    );

    return updated;
  }

  async activateStore(
    id: string,
    dto: TransitionInventoryStoreDto,
  ) {
    return this.transitionStore(
      id,
      true,
      INVENTORY_EVENTS.STORE_ACTIVATED,
      dto,
    );
  }

  async deactivateStore(
    id: string,
    dto: TransitionInventoryStoreDto,
  ) {
    return this.transitionStore(
      id,
      false,
      INVENTORY_EVENTS.STORE_DEACTIVATED,
      dto,
    );
  }

  async createBinLocation(
    dto: CreateBinLocationDto,
  ) {
    const store =
      await this.getStore(
        dto.storeId,
      );

    if (!store.isActive) {
      throw new BadRequestException(
        `Inventory store is inactive: ${store.id}`,
      );
    }

    this.requireText(
      dto.binCode,
      'binCode',
    );

    this.requireText(
      dto.name,
      'name',
    );

    if (dto.parentBinId) {
      const parent =
        await this.repository
          .findBinLocationById(
            dto.parentBinId,
          );

      if (
        !parent ||
        parent.storeId !==
          dto.storeId ||
        !parent.isActive
      ) {
        throw new BadRequestException(
          `Invalid parent bin location: ${dto.parentBinId}`,
        );
      }
    }

    const now = new Date();

    const bin:
      InventoryBinLocation = {
        id: randomUUID(),
        storeId:
          dto.storeId,
        parentBinId:
          dto.parentBinId,
        binCode:
          dto.binCode
            .trim()
            .toUpperCase(),
        name:
          dto.name.trim(),
        description:
          this.optionalTrimmed(
            dto.description,
          ),
        barcode:
          this.optionalTrimmed(
            dto.barcode,
          ),
        isReceivingBin:
          Boolean(
            dto.isReceivingBin,
          ),
        isDispatchBin:
          Boolean(
            dto.isDispatchBin,
          ),
        isQuarantineBin:
          Boolean(
            dto.isQuarantineBin,
          ),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

    const created =
      await this.withConflict(
        () =>
          this.repository
            .createBinLocation(
              bin,
            ),
        `Inventory bin already exists in the store: ${bin.binCode}`,
      );

    await this.publishAndAudit(
      INVENTORY_EVENTS.BIN_CREATED,
      'inventory.bin_location',
      created.id,
      {
        binLocationId:
          created.id,
        storeId:
          created.storeId,
        binCode:
          created.binCode,
        actorPersonId:
          dto.createdByPersonId,
      },
    );

    return created;
  }

  async listBinLocations(
    storeId: string,
  ) {
    await this.getStore(storeId);

    return this.repository
      .listBinLocations(
        storeId,
      );
  }

  async getBinLocation(
    id: string,
  ) {
    const bin =
      await this.repository
        .findBinLocationById(
          id,
        );

    if (!bin) {
      throw new NotFoundException(
        `Inventory bin location not found: ${id}`,
      );
    }

    return bin;
  }

  async updateBinLocation(
    id: string,
    dto: UpdateBinLocationDto,
  ) {
    const current =
      await this.getBinLocation(id);

    if (
      dto.parentBinId === id
    ) {
      throw new BadRequestException(
        'A bin location cannot be its own parent',
      );
    }

    if (dto.parentBinId) {
      const parent =
        await this.repository
          .findBinLocationById(
            dto.parentBinId,
          );

      if (
        !parent ||
        parent.storeId !==
          current.storeId ||
        !parent.isActive
      ) {
        throw new BadRequestException(
          `Invalid parent bin location: ${dto.parentBinId}`,
        );
      }
    }

    const updated =
      await this.withConflict(
        () =>
          this.repository
            .updateBinLocation(
              id,
              {
                parentBinId:
                  dto.parentBinId !==
                  undefined
                    ? dto.parentBinId
                    : current.parentBinId,
                name:
                  dto.name !==
                  undefined
                    ? this.requiredTrimmed(
                        dto.name,
                        'name',
                      )
                    : current.name,
                description:
                  dto.description !==
                  undefined
                    ? this.optionalTrimmed(
                        dto.description,
                      )
                    : current.description,
                barcode:
                  dto.barcode !==
                  undefined
                    ? this.optionalTrimmed(
                        dto.barcode,
                      )
                    : current.barcode,
                isReceivingBin:
                  dto.isReceivingBin ??
                  current.isReceivingBin,
                isDispatchBin:
                  dto.isDispatchBin ??
                  current.isDispatchBin,
                isQuarantineBin:
                  dto.isQuarantineBin ??
                  current.isQuarantineBin,
                isActive:
                  dto.isActive ??
                  current.isActive,
              },
            ),
        'Inventory bin update conflicts with an existing barcode',
      );

    if (!updated) {
      throw new NotFoundException(
        `Inventory bin location not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      INVENTORY_EVENTS.BIN_UPDATED,
      'inventory.bin_location',
      updated.id,
      {
        binLocationId:
          updated.id,
        storeId:
          updated.storeId,
        binCode:
          updated.binCode,
        actorPersonId:
          dto.updatedByPersonId,
        remarks: dto.remarks,
      },
    );

    return updated;
  }

  listStockBalances(
    filters:
      InventoryStockBalanceFilters = {},
  ) {
    return this.repository
      .listStockBalances(
        filters,
      );
  }

  async getStockBalance(
    itemId: string,
    storeId: string,
    binLocationId?: string,
  ) {
    await this.getItem(itemId);
    await this.getStore(storeId);

    if (binLocationId) {
      const bin =
        await this.getBinLocation(
          binLocationId,
        );

      if (
        bin.storeId !==
        storeId
      ) {
        throw new BadRequestException(
          'The bin location does not belong to the selected store',
        );
      }
    }

    return this.repository
      .findStockBalance(
        itemId,
        storeId,
        binLocationId,
      );
  }

  private async transitionItem(
    id: string,
    isActive: boolean,
    eventType: string,
    dto: TransitionInventoryItemDto,
  ) {
    const current =
      await this.getItem(id);

    if (
      current.isActive ===
      isActive
    ) {
      throw new BadRequestException(
        `Inventory item is already ${
          isActive
            ? 'active'
            : 'inactive'
        }`,
      );
    }

    const updated =
      await this.repository
        .updateItem(
          id,
          {
            isActive,
            updatedByPersonId:
              dto.changedByPersonId,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory item not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      eventType,
      'inventory.item',
      updated.id,
      this.itemPayload(
        updated,
        dto.changedByPersonId,
        dto.remarks,
      ),
    );

    return updated;
  }

  private async transitionStore(
    id: string,
    isActive: boolean,
    eventType: string,
    dto: TransitionInventoryStoreDto,
  ) {
    const current =
      await this.getStore(id);

    if (
      current.isActive ===
      isActive
    ) {
      throw new BadRequestException(
        `Inventory store is already ${
          isActive
            ? 'active'
            : 'inactive'
        }`,
      );
    }

    const updated =
      await this.repository
        .updateStore(
          id,
          {
            isActive,
          },
        );

    if (!updated) {
      throw new NotFoundException(
        `Inventory store not found: ${id}`,
      );
    }

    await this.publishAndAudit(
      eventType,
      'inventory.store',
      updated.id,
      this.storePayload(
        updated,
        dto.changedByPersonId,
        dto.remarks,
      ),
    );

    return updated;
  }

  private async requireActiveCategory(
    id: string,
  ) {
    const category =
      await this.repository
        .findCategoryById(id);

    if (
      !category ||
      !category.isActive
    ) {
      throw new BadRequestException(
        `Invalid Inventory category: ${id}`,
      );
    }

    return category;
  }

  private async requireActiveUnit(
    id: string,
  ) {
    const unit =
      await this.repository
        .findUnitOfMeasureById(
          id,
        );

    if (
      !unit ||
      !unit.isActive
    ) {
      throw new BadRequestException(
        `Invalid Unit of Measure: ${id}`,
      );
    }

    return unit;
  }

  private async requireActiveBrand(
    id: string,
  ) {
    const brand =
      await this.repository
        .findBrandById(id);

    if (
      !brand ||
      !brand.isActive
    ) {
      throw new BadRequestException(
        `Invalid Inventory brand: ${id}`,
      );
    }

    return brand;
  }

  private itemPayload(
    item: InventoryItem,
    actorPersonId: string,
    remarks?: string,
  ) {
    return {
      entityType:
        'inventory.item',
      entityId:
        item.id,
      itemId:
        item.id,
      sku:
        item.sku,
      categoryId:
        item.categoryId,
      unitOfMeasureId:
        item.unitOfMeasureId,
      brandId:
        item.brandId,
      itemType:
        item.itemType,
      isActive:
        item.isActive,
      actorPersonId,
      remarks,
    };
  }

  private storePayload(
    store: InventoryStore,
    actorPersonId: string,
    remarks?: string,
  ) {
    return {
      entityType:
        'inventory.store',
      entityId:
        store.id,
      storeId:
        store.id,
      storeCode:
        store.storeCode,
      propertyId:
        store.propertyId,
      zoneId:
        store.zoneId,
      spaceId:
        store.spaceId,
      isActive:
        store.isActive,
      actorPersonId,
      remarks,
    };
  }

  private async publishAndAudit(
    eventType: string,
    entityType: string,
    entityId: string,
    payload:
      Record<string, unknown>,
  ) {
    const fullPayload = {
      entityType,
      entityId,
      ...payload,
    };

    await this.eventBus.publish(
      eventType,
      'core.inventory',
      fullPayload,
    );

    await this.auditService.record(
      eventType,
      'core.inventory',
      fullPayload,
    );
  }

  private async requireRepositoryUpdate(
    methodName:
      | 'updateCategory'
      | 'updateBrand',
    id: string,
    input:
      | InventoryItemCategory
      | InventoryBrand,
  ): Promise<
    InventoryItemCategory |
    InventoryBrand
  > {
    if (
      methodName ===
      'updateCategory'
    ) {
      const updated =
        await this.withConflict(
          () =>
            this.repository
              .updateCategory(
                id,
                input as
                  InventoryItemCategory,
              ),
          'Inventory category update conflicts with an existing record',
        );

      if (!updated) {
        throw new NotFoundException(
          `Inventory category not found: ${id}`,
        );
      }

      return updated;
    }

    const updated =
      await this.withConflict(
        () =>
          this.repository
            .updateBrand(
              id,
              input as
                InventoryBrand,
            ),
        'Inventory brand update conflicts with an existing record',
      );

    if (!updated) {
      throw new NotFoundException(
        `Inventory brand not found: ${id}`,
      );
    }

    return updated;
  }

  private async withConflict<T>(
    operation: () =>
      Promise<T>,
    message: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (
        error?.code ===
        '23505'
      ) {
        throw new ConflictException(
          message,
        );
      }

      throw error;
    }
  }

  private requiredTrimmed(
    value: string,
    field: string,
  ) {
    this.requireText(
      value,
      field,
    );

    return value.trim();
  }

  private optionalTrimmed(
    value?: string,
  ) {
    const trimmed =
      value?.trim();

    return trimmed ||
      undefined;
  }

  private requireText(
    value: string | undefined,
    field: string,
  ) {
    if (!value?.trim()) {
      throw new BadRequestException(
        `${field} is required`,
      );
    }
  }

  private assertDecimalPlaces(
    value?: number,
  ) {
    if (
      value === undefined
    ) {
      return;
    }

    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 6
    ) {
      throw new BadRequestException(
        'decimalPlaces must be an integer between 0 and 6',
      );
    }
  }

  private assertNonNegative(
    value: number | undefined,
    field: string,
  ) {
    if (
      value === undefined
    ) {
      return;
    }

    if (
      !Number.isFinite(
        Number(value),
      ) ||
      Number(value) < 0
    ) {
      throw new BadRequestException(
        `${field} must be zero or greater`,
      );
    }
  }

  private normalizeCurrency(
    currency: string,
  ) {
    const normalized =
      currency
        .trim()
        .toUpperCase();

    if (
      normalized.length !== 3
    ) {
      throw new BadRequestException(
        'currency must be a three-letter code',
      );
    }

    return normalized;
  }
}
