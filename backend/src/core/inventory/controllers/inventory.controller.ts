import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  RequirePermission,
} from '../../auth/decorators/require-permission.decorator';

import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';

import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';

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
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryService,
} from '../services/inventory.service';

import {
  InventoryItemType,
} from '../types/inventory.types';

@ApiTags('Inventory')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/inventory')
export class InventoryController {
  constructor(
    private readonly service:
      InventoryService,
  ) {}

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('units')
  async listUnits(
    @Query('activeOnly')
    activeOnly?: string,
  ) {
    return this.success(
      await this.service
        .listUnitsOfMeasure(
          this.booleanQuery(
            activeOnly,
            true,
          ),
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('units/:id')
  async getUnit(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getUnitOfMeasure(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.CONFIGURE,
  )
  @Post('units')
  async createUnit(
    @Body()
    dto: CreateUnitOfMeasureDto,
  ) {
    return this.success(
      await this.service
        .createUnitOfMeasure(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.CONFIGURE,
  )
  @Patch('units/:id')
  async updateUnit(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateUnitOfMeasureDto,
  ) {
    return this.success(
      await this.service
        .updateUnitOfMeasure(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('categories')
  async listCategories(
    @Query('activeOnly')
    activeOnly?: string,
  ) {
    return this.success(
      await this.service
        .listCategories(
          this.booleanQuery(
            activeOnly,
            true,
          ),
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('categories/:id')
  async getCategory(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getCategory(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.CONFIGURE,
  )
  @Post('categories')
  async createCategory(
    @Body()
    dto: CreateItemCategoryDto,
  ) {
    return this.success(
      await this.service
        .createCategory(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.CONFIGURE,
  )
  @Patch('categories/:id')
  async updateCategory(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateItemCategoryDto,
  ) {
    return this.success(
      await this.service
        .updateCategory(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('brands')
  async listBrands(
    @Query('activeOnly')
    activeOnly?: string,
  ) {
    return this.success(
      await this.service
        .listBrands(
          this.booleanQuery(
            activeOnly,
            true,
          ),
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('brands/:id')
  async getBrand(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getBrand(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.CONFIGURE,
  )
  @Post('brands')
  async createBrand(
    @Body()
    dto: CreateBrandDto,
  ) {
    return this.success(
      await this.service
        .createBrand(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.CONFIGURE,
  )
  @Patch('brands/:id')
  async updateBrand(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateBrandDto,
  ) {
    return this.success(
      await this.service
        .updateBrand(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ITEMS,
  )
  @Post('items')
  async createItem(
    @Body()
    dto: CreateInventoryItemDto,
  ) {
    return this.success(
      await this.service
        .createItem(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('items')
  async listItems(
    @Query('categoryId')
    categoryId?: string,

    @Query('unitOfMeasureId')
    unitOfMeasureId?: string,

    @Query('brandId')
    brandId?: string,

    @Query('itemType')
    itemType?: InventoryItemType,

    @Query('isActive')
    isActive?: string,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service
        .listItems({
          categoryId,
          unitOfMeasureId,
          brandId,
          itemType,
          isActive:
            this.optionalBooleanQuery(
              isActive,
            ),
          search,
        }),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('items/:id')
  async getItem(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getItem(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ITEMS,
  )
  @Patch('items/:id')
  async updateItem(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateInventoryItemDto,
  ) {
    return this.success(
      await this.service
        .updateItem(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ITEMS,
  )
  @Post('items/:id/activate')
  async activateItem(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionInventoryItemDto,
  ) {
    return this.success(
      await this.service
        .activateItem(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ITEMS,
  )
  @Post('items/:id/deactivate')
  async deactivateItem(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionInventoryItemDto,
  ) {
    return this.success(
      await this.service
        .deactivateItem(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STORES,
  )
  @Post('stores')
  async createStore(
    @Body()
    dto: CreateInventoryStoreDto,
  ) {
    return this.success(
      await this.service
        .createStore(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('stores')
  async listStores(
    @Query('propertyId')
    propertyId?: string,

    @Query('zoneId')
    zoneId?: string,

    @Query('spaceId')
    spaceId?: string,

    @Query('isActive')
    isActive?: string,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service
        .listStores({
          propertyId,
          zoneId,
          spaceId,
          isActive:
            this.optionalBooleanQuery(
              isActive,
            ),
          search,
        }),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('stores/:id')
  async getStore(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getStore(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STORES,
  )
  @Patch('stores/:id')
  async updateStore(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateInventoryStoreDto,
  ) {
    return this.success(
      await this.service
        .updateStore(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STORES,
  )
  @Post('stores/:id/activate')
  async activateStore(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionInventoryStoreDto,
  ) {
    return this.success(
      await this.service
        .activateStore(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STORES,
  )
  @Post('stores/:id/deactivate')
  async deactivateStore(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionInventoryStoreDto,
  ) {
    return this.success(
      await this.service
        .deactivateStore(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STORES,
  )
  @Post('bins')
  async createBin(
    @Body()
    dto: CreateBinLocationDto,
  ) {
    return this.success(
      await this.service
        .createBinLocation(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('bins')
  async listBins(
    @Query('storeId')
    storeId: string,
  ) {
    return this.success(
      await this.service
        .listBinLocations(
          storeId,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('bins/:id')
  async getBin(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getBinLocation(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STORES,
  )
  @Patch('bins/:id')
  async updateBin(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateBinLocationDto,
  ) {
    return this.success(
      await this.service
        .updateBinLocation(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get('stock-balances')
  async listStockBalances(
    @Query('itemId')
    itemId?: string,

    @Query('storeId')
    storeId?: string,

    @Query('binLocationId')
    binLocationId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('belowReorderLevel')
    belowReorderLevel?: string,
  ) {
    return this.success(
      await this.service
        .listStockBalances({
          itemId,
          storeId,
          binLocationId,
          propertyId,
          belowReorderLevel:
            this.booleanQuery(
              belowReorderLevel,
              false,
            ),
        }),
    );
  }

  private success(
    data: unknown,
  ) {
    return {
      success: true,
      data,
    };
  }

  private optionalBooleanQuery(
    value?: string,
  ): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value === 'true';
  }

  private booleanQuery(
    value: string | undefined,
    defaultValue: boolean,
  ): boolean {
    if (value === undefined) {
      return defaultValue;
    }

    return value === 'true';
  }
}
