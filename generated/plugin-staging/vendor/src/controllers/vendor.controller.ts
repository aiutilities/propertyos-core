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
} from '@propertyos/core-contracts';

import {
  JwtAuthGuard,
} from '@propertyos/core-contracts';

import {
  PermissionGuard,
} from '@propertyos/core-contracts';

import {
  CreateVendorDto,
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
  VendorService,
} from '../services/vendor.service';

import {
  VENDOR_PERMISSIONS,
} from '../vendor.constants';

import {
  VendorStatus,
  VendorType,
} from '../types/vendor.types';

@ApiTags('Vendors')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/vendors')
export class VendorController {
  constructor(
    private readonly service:
      VendorService,
  ) {}

  @RequirePermission(
    VENDOR_PERMISSIONS.CREATE,
  )
  @Post()
  async create(
    @Body()
    dto: CreateVendorDto,
  ) {
    return this.success(
      await this.service.create(
        dto,
      ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('status')
    status?: VendorStatus,

    @Query('vendorType')
    vendorType?: VendorType,

    @Query('categoryId')
    categoryId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        status,
        vendorType,
        categoryId,
        propertyId,
        search,
      }),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get('categories')
  async categories() {
    return this.success(
      await this.service
        .listCategories(),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get('metrics')
  async metrics() {
    return this.success(
      await this.service
        .getMetrics(),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Get('contracts')
  async listContracts(
    @Query('vendorId')
    vendorId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('status')
    status?: string,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service
        .listContracts({
          vendorId,
          propertyId,
          status,
          search,
        }),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get(':id')
  async get(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.get(id),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.RATINGS,
  )
  @Post('ratings')
  async createRating(
    @Body()
    dto: CreateVendorRatingDto,
  ) {
    return this.success(
      await this.service
        .createRating(dto),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get(':id/ratings')
  async listRatings(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .listRatings(id),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get(':id/rating-summary')
  async getRatingSummary(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getRatingSummary(id),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders')
  async createWorkOrder(
    @Body()
    dto: CreateVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .createWorkOrder(dto),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Get('work-orders')
  async listWorkOrders(
    @Query('vendorId')
    vendorId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('contractId')
    contractId?: string,

    @Query('status')
    status?: string,

    @Query('priority')
    priority?: string,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service
        .listWorkOrders({
          vendorId,
          propertyId,
          contractId,
          status,
          priority,
          search,
        }),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Get('work-orders/:workOrderId')
  async getWorkOrder(
    @Param('workOrderId')
    workOrderId: string,
  ) {
    return this.success(
      await this.service
        .getWorkOrder(
          workOrderId,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/issue')
  async issueWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: TransitionVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .issueWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/accept')
  async acceptWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: TransitionVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .acceptWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/reject')
  async rejectWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: TransitionVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .rejectWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/start')
  async startWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: TransitionVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .startWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/hold')
  async holdWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: TransitionVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .holdWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/resume')
  async resumeWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: TransitionVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .resumeWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/complete')
  async completeWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: CompleteVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .completeWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.WORK_ORDERS,
  )
  @Post('work-orders/:workOrderId/cancel')
  async cancelWorkOrder(
    @Param('workOrderId')
    workOrderId: string,

    @Body()
    dto: CancelVendorWorkOrderDto,
  ) {
    return this.success(
      await this.service
        .cancelWorkOrder(
          workOrderId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.COMPLIANCE,
  )
  @Post('compliance')
  async createComplianceDocument(
    @Body()
    dto: CreateVendorComplianceDto,
  ) {
    return this.success(
      await this.service
        .createComplianceDocument(
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.COMPLIANCE,
  )
  @Get('compliance')
  async listComplianceDocuments(
    @Query('vendorId')
    vendorId?: string,

    @Query('complianceType')
    complianceType?: string,

    @Query('status')
    status?: string,

    @Query('expiringBefore')
    expiringBefore?: string,
  ) {
    return this.success(
      await this.service
        .listComplianceDocuments({
          vendorId,
          complianceType,
          status,
          expiringBefore,
        }),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.COMPLIANCE,
  )
  @Get('compliance/:documentId')
  async getComplianceDocument(
    @Param('documentId')
    documentId: string,
  ) {
    return this.success(
      await this.service
        .getComplianceDocument(
          documentId,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.COMPLIANCE,
  )
  @Post('compliance/:documentId/verify')
  async verifyComplianceDocument(
    @Param('documentId')
    documentId: string,

    @Body()
    dto: VerifyVendorComplianceDto,
  ) {
    return this.success(
      await this.service
        .verifyComplianceDocument(
          documentId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.COMPLIANCE,
  )
  @Post('compliance/:documentId/reject')
  async rejectComplianceDocument(
    @Param('documentId')
    documentId: string,

    @Body()
    dto: TransitionVendorComplianceDto,
  ) {
    return this.success(
      await this.service
        .rejectComplianceDocument(
          documentId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.COMPLIANCE,
  )
  @Post('compliance/:documentId/waive')
  async waiveComplianceDocument(
    @Param('documentId')
    documentId: string,

    @Body()
    dto: TransitionVendorComplianceDto,
  ) {
    return this.success(
      await this.service
        .waiveComplianceDocument(
          documentId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.COMPLIANCE,
  )
  @Post('compliance/:documentId/expire')
  async expireComplianceDocument(
    @Param('documentId')
    documentId: string,

    @Body()
    dto: TransitionVendorComplianceDto,
  ) {
    return this.success(
      await this.service
        .expireComplianceDocument(
          documentId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Post('contracts')
  async createContract(
    @Body()
    dto: CreateVendorContractDto,
  ) {
    return this.success(
      await this.service
        .createContract(dto),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Get('contracts/:contractId')
  async getContract(
    @Param('contractId')
    contractId: string,
  ) {
    return this.success(
      await this.service
        .getContract(
          contractId,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Post('contracts/:contractId/activate')
  async activateContract(
    @Param('contractId')
    contractId: string,

    @Body()
    dto: TransitionVendorContractDto,
  ) {
    return this.success(
      await this.service
        .activateContract(
          contractId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Post('contracts/:contractId/renew')
  async renewContract(
    @Param('contractId')
    contractId: string,

    @Body()
    dto: RenewVendorContractDto,
  ) {
    return this.success(
      await this.service
        .renewContract(
          contractId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Post('contracts/:contractId/expire')
  async expireContract(
    @Param('contractId')
    contractId: string,

    @Body()
    dto: TransitionVendorContractDto,
  ) {
    return this.success(
      await this.service
        .expireContract(
          contractId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Post('contracts/:contractId/terminate')
  async terminateContract(
    @Param('contractId')
    contractId: string,

    @Body()
    dto: TransitionVendorContractDto,
  ) {
    return this.success(
      await this.service
        .terminateContract(
          contractId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.CONTRACTS,
  )
  @Post('contracts/:contractId/cancel')
  async cancelContract(
    @Param('contractId')
    contractId: string,

    @Body()
    dto: TransitionVendorContractDto,
  ) {
    return this.success(
      await this.service
        .cancelContract(
          contractId,
          dto,
        ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.MANAGE,
  )
  @Post(':id/activate')
  async activate(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionVendorDto,
  ) {
    return this.success(
      await this.service.activate(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.MANAGE,
  )
  @Post(':id/suspend')
  async suspend(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionVendorDto,
  ) {
    return this.success(
      await this.service.suspend(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.MANAGE,
  )
  @Post(':id/block')
  async block(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionVendorDto,
  ) {
    return this.success(
      await this.service.block(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.MANAGE,
  )
  @Post(':id/reactivate')
  async reactivate(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionVendorDto,
  ) {
    return this.success(
      await this.service.reactivate(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.MANAGE,
  )
  @Post(':id/archive')
  async archive(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionVendorDto,
  ) {
    return this.success(
      await this.service.archive(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.UPDATE,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateVendorDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
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
}
