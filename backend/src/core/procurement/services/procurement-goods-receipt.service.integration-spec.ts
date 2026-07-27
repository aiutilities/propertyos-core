import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import {
  AuditService,
} from '../../audit/audit.service';
import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';
import {
  GoodsReceiptDetails,
  GoodsReceiptRepository,
} from '../repositories/procurement-goods-receipt.repository';
import {
  PurchaseOrderDetails,
  PurchaseOrderRepository,
} from '../repositories/procurement-purchase-order.repository';
import {
  GoodsReceiptItemStatus,
  GoodsReceiptStatus,
  ProcurementItemType,
  PurchaseOrderStatus,
} from '../types/procurement.types';
import {
  ProcurementGoodsReceiptService,
} from './procurement-goods-receipt.service';
import {
  ProcurementInventoryPostingService,
} from './procurement-inventory-posting.service';
import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

describe(
  'ProcurementGoodsReceiptService foundation contract',
  () => {
    let repository:
      jest.Mocked<GoodsReceiptRepository>;

    let purchaseOrderRepository:
      jest.Mocked<PurchaseOrderRepository>;

    let service:
      ProcurementGoodsReceiptService;

    const createPurchaseOrder = (
      status:
        PurchaseOrderStatus =
          PurchaseOrderStatus.ACKNOWLEDGED,
    ): PurchaseOrderDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'purchase-order-1',
        purchaseOrderNumber:
          'PO-20260727-001',
        propertyId:
          'property-1',
        vendorId:
          'vendor-1',
        purchaseRequestId:
          'purchase-request-1',
        rfqId:
          'rfq-1',
        quotationId:
          'quotation-1',
        title:
          'Room furniture order',
        status,
        orderDate:
          now,
        subtotal:
          50000,
        discountAmount:
          1000,
        taxAmount:
          8820,
        freightAmount:
          500,
        totalAmount:
          58320,
        currency:
          'INR',
        createdByPersonId:
          'person-1',
        acknowledgedAt:
          status ===
          PurchaseOrderStatus.ACKNOWLEDGED
            ? now
            : undefined,
        createdAt:
          now,
        updatedAt:
          now,
        items: [
          {
            id:
              'purchase-order-item-1',
            purchaseOrderId:
              'purchase-order-1',
            lineNumber:
              1,
            itemType:
              ProcurementItemType.GOODS,
            description:
              'Studio room cot',
            orderedQuantity:
              10,
            receivedQuantity:
              0,
            unit:
              'EA',
            unitPrice:
              5000,
            discountAmount:
              0,
            taxRate:
              18,
            taxAmount:
              9000,
            lineTotal:
              59000,
            createdAt:
              now,
            updatedAt:
              now,
          },
        ],
        history:
          [],
      } as PurchaseOrderDetails;
    };

    const createGoodsReceipt = (
      status:
        GoodsReceiptStatus =
          GoodsReceiptStatus.DRAFT,
    ): GoodsReceiptDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'goods-receipt-1',
        goodsReceiptNumber:
          'GRN-20260727-001',
        purchaseOrderId:
          'purchase-order-1',
        propertyId:
          'property-1',
        vendorId:
          'vendor-1',
        status,
        receiptDate:
          now,
        deliveryReference:
          'DELIVERY-001',
        invoiceReference:
          'INVOICE-001',
        receivedByPersonId:
          'person-2',
        createdAt:
          now,
        updatedAt:
          now,
        items: [
          {
            id:
              'goods-receipt-item-1',
            goodsReceiptId:
              'goods-receipt-1',
            purchaseOrderItemId:
              'purchase-order-item-1',
            orderedQuantity:
              10,
            previouslyReceivedQuantity:
              0,
            receivedQuantity:
              5,
            acceptedQuantity:
              5,
            rejectedQuantity:
              0,
            status:
              GoodsReceiptItemStatus.ACCEPTED,
            createdAt:
              now,
            updatedAt:
              now,
          },
        ],
        history:
          [],
      } as GoodsReceiptDetails;
    };

    beforeEach(() => {
      repository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        addHistory:
          jest.fn(),
        listItems:
          jest.fn(),
        listHistory:
          jest.fn(),
        aggregatePostedQuantities:
          jest.fn(),
        post:
          jest.fn(),
        reverse:
          jest.fn(),
      };

      purchaseOrderRepository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        findByQuotationId:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        addHistory:
          jest.fn(),
      };

      const auditService =
        new Proxy(
          {},
          {
            get: () =>
              async () => undefined,
          },
        ) as unknown as AuditService;

      const eventBus = {
        publish:
          async () => undefined,
      } as unknown as EventBusService;

      const inventoryPostingService = {
        postGoodsReceipt:
          async () => [],
      } as unknown as
        ProcurementInventoryPostingService;

      const transitionMetrics = {
        observe:
          async (
            _name: string,
            operation:
              () => Promise<unknown>,
          ) => operation(),
      } as unknown as
        ProcurementTransitionMetricsService;

      service =
        new ProcurementGoodsReceiptService(
          repository,
          purchaseOrderRepository,
          auditService,
          eventBus,
          inventoryPostingService,
          transitionMetrics,
        );
    });

    it(
      'delegates filtered Goods Receipt listing',
      async () => {
        const receipt =
          createGoodsReceipt();

        repository.list.mockResolvedValue([
          receipt,
        ]);

        const filters = {
          purchaseOrderId:
            'purchase-order-1',
          propertyId:
            'property-1',
          vendorId:
            'vendor-1',
          status:
            GoodsReceiptStatus.DRAFT,
          search:
            'GRN-20260727',
        };

        await expect(
          service.list(filters),
        ).resolves.toEqual([
          receipt,
        ]);

        expect(
          repository.list,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an existing Goods Receipt',
      async () => {
        const receipt =
          createGoodsReceipt();

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        await expect(
          service.get(
            receipt.id,
          ),
        ).resolves.toEqual(
          receipt,
        );

        expect(
          repository.findById,
        ).toHaveBeenCalledWith(
          receipt.id,
        );
      },
    );

    it(
      'rejects lookup of a missing Goods Receipt',
      async () => {
        repository.findById
          .mockResolvedValue(
            null,
          );

        await expect(
          service.get(
            'missing-goods-receipt',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'blocks creation for a non-receivable Purchase Order',
      async () => {
        purchaseOrderRepository.findById
          .mockResolvedValue(
            createPurchaseOrder(
              PurchaseOrderStatus.DRAFT,
            ),
          );

        const dto = {
          purchaseOrderId:
            'purchase-order-1',
          receivedByPersonId:
            'person-2',
          items: [
            {
              purchaseOrderItemId:
                'purchase-order-item-1',
              receivedQuantity:
                5,
              acceptedQuantity:
                5,
              rejectedQuantity:
                0,
            },
          ],
        } as Parameters<
          ProcurementGoodsReceiptService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository
            .aggregatePostedQuantities,
        ).not.toHaveBeenCalled();

        expect(
          repository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks editing a non-draft Goods Receipt',
      async () => {
        const receipt =
          createGoodsReceipt(
            GoodsReceiptStatus.POSTED,
          );

        repository.findById
          .mockResolvedValue(
            receipt,
          );

        const dto = {
          remarks:
            'Updated receipt remarks',
          updatedByPersonId:
            'person-3',
        } as Parameters<
          ProcurementGoodsReceiptService[
            'update'
          ]
        >[1];

        await expect(
          service.update(
            receipt.id,
            dto,
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          purchaseOrderRepository
            .findById,
        ).not.toHaveBeenCalled();

        expect(
          repository.update,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
