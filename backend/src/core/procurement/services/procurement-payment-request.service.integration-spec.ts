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
  ProcurementInvoiceMatchDetails,
  ProcurementInvoiceMatchRepository,
} from '../repositories/procurement-invoice-match.repository';
import {
  ProcurementPaymentRequestDetails,
  ProcurementPaymentRequestRepository,
} from '../repositories/procurement-payment-request.repository';
import {
  InvoiceMatchStatus,
  PaymentRequestStatus,
} from '../types/procurement.types';
import {
  ProcurementPaymentRequestService,
} from './procurement-payment-request.service';
import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

describe(
  'ProcurementPaymentRequestService lifecycle contract',
  () => {
    let repository:
      jest.Mocked<ProcurementPaymentRequestRepository>;

    let invoiceMatchRepository:
      jest.Mocked<ProcurementInvoiceMatchRepository>;

    let service:
      ProcurementPaymentRequestService;

    const createInvoiceMatch = (
      status:
        InvoiceMatchStatus =
          InvoiceMatchStatus.APPROVED,
    ): ProcurementInvoiceMatchDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'invoice-match-1',
        invoiceMatchNumber:
          'IM-20260727-001',
        purchaseOrderId:
          'purchase-order-1',
        goodsReceiptId:
          'goods-receipt-1',
        invoiceId:
          'invoice-1',
        vendorId:
          'vendor-1',
        propertyId:
          'property-1',
        externalInvoiceNumber:
          'INV-001',
        invoiceDate:
          now,
        invoiceAmount:
          59000,
        purchaseOrderAmount:
          59000,
        goodsReceiptAmount:
          50000,
        amountVariance:
          0,
        quantityVariance:
          0,
        status,
        matchedByPersonId:
          'person-4',
        approvedByPersonId:
          status ===
          InvoiceMatchStatus.APPROVED
            ? 'person-5'
            : undefined,
        approvedAt:
          status ===
          InvoiceMatchStatus.APPROVED
            ? now
            : undefined,
        createdAt:
          now,
        updatedAt:
          now,
        items:
          [],
        history:
          [],
      } as ProcurementInvoiceMatchDetails;
    };

    const createPaymentRequest = (
      status:
        PaymentRequestStatus =
          PaymentRequestStatus.DRAFT,
      overrides: Partial<
        ProcurementPaymentRequestDetails
      > = {},
    ): ProcurementPaymentRequestDetails => {
      const now =
        new Date(
          '2026-07-27T00:00:00.000Z',
        );

      return {
        id:
          'payment-request-1',
        paymentRequestNumber:
          'PAY-20260727-001',
        vendorId:
          'vendor-1',
        propertyId:
          'property-1',
        purchaseOrderId:
          'purchase-order-1',
        invoiceMatchId:
          'invoice-match-1',
        requestedAmount:
          59000,
        currency:
          'INR',
        dueDate:
          new Date(
            '2026-08-15T00:00:00.000Z',
          ),
        status,
        requestedByPersonId:
          'person-6',
        createdAt:
          now,
        updatedAt:
          now,
        history:
          [],
        ...overrides,
      } as ProcurementPaymentRequestDetails;
    };

    beforeEach(() => {
      repository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        findActiveByInvoiceMatchId:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        transition:
          jest.fn(),
        addHistory:
          jest.fn(),
        listHistory:
          jest.fn(),
      };

      invoiceMatchRepository = {
        create:
          jest.fn(),
        findById:
          jest.fn(),
        list:
          jest.fn(),
        update:
          jest.fn(),
        transition:
          jest.fn(),
        addHistory:
          jest.fn(),
        listItems:
          jest.fn(),
        listHistory:
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

      const transitionMetrics = {
        observe:
          async (
            _transition: string,
            operation:
              () => Promise<unknown>,
          ) => operation(),
      } as unknown as
        ProcurementTransitionMetricsService;

      service =
        new ProcurementPaymentRequestService(
          repository,
          invoiceMatchRepository,
          auditService,
          eventBus,
          transitionMetrics,
        );
    });

    it(
      'delegates filtered Payment Request listing',
      async () => {
        const paymentRequest =
          createPaymentRequest();

        repository.list.mockResolvedValue([
          paymentRequest,
        ]);

        const filters = {
          invoiceMatchId:
            'invoice-match-1',
          purchaseOrderId:
            'purchase-order-1',
          vendorId:
            'vendor-1',
          propertyId:
            'property-1',
          status:
            PaymentRequestStatus.DRAFT,
          overdue:
            false,
          search:
            'PAY-20260727',
        };

        await expect(
          service.list(filters),
        ).resolves.toEqual([
          paymentRequest,
        ]);

        expect(
          repository.list,
        ).toHaveBeenCalledWith(
          filters,
        );
      },
    );

    it(
      'returns an existing Payment Request',
      async () => {
        const paymentRequest =
          createPaymentRequest();

        repository.findById
          .mockResolvedValue(
            paymentRequest,
          );

        await expect(
          service.get(
            paymentRequest.id,
          ),
        ).resolves.toEqual(
          paymentRequest,
        );
      },
    );

    it(
      'rejects lookup of a missing Payment Request',
      async () => {
        repository.findById
          .mockResolvedValue(
            null,
          );

        await expect(
          service.get(
            'missing-payment-request',
          ),
        ).rejects.toBeInstanceOf(
          NotFoundException,
        );
      },
    );

    it(
      'requires an approved Invoice Match for creation',
      async () => {
        invoiceMatchRepository.findById
          .mockResolvedValue(
            createInvoiceMatch(
              InvoiceMatchStatus.MATCHED,
            ),
          );

        const dto = {
          invoiceMatchId:
            'invoice-match-1',
          requestedByPersonId:
            'person-6',
        } as Parameters<
          ProcurementPaymentRequestService[
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
            .findActiveByInvoiceMatchId,
        ).not.toHaveBeenCalled();

        expect(
          repository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'blocks a duplicate active Payment Request',
      async () => {
        const invoiceMatch =
          createInvoiceMatch();

        invoiceMatchRepository.findById
          .mockResolvedValue(
            invoiceMatch,
          );

        repository
          .findActiveByInvoiceMatchId
          .mockResolvedValue(
            createPaymentRequest(),
          );

        const dto = {
          invoiceMatchId:
            invoiceMatch.id,
          requestedByPersonId:
            'person-6',
        } as Parameters<
          ProcurementPaymentRequestService[
            'create'
          ]
        >[0];

        await expect(
          service.create(dto),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'creates a draft Payment Request from an approved Invoice Match',
      async () => {
        const invoiceMatch =
          createInvoiceMatch();

        invoiceMatchRepository.findById
          .mockResolvedValue(
            invoiceMatch,
          );

        repository
          .findActiveByInvoiceMatchId
          .mockResolvedValue(
            null,
          );

        repository.create
          .mockImplementation(
            async (
              paymentRequest,
              history,
            ) => ({
              ...paymentRequest,
              history:
                [history],
            }),
          );

        await expect(
          service.create({
            invoiceMatchId:
              invoiceMatch.id,
            requestedAmount:
              50000,
            currency:
              ' inr ',
            dueDate:
              '2026-08-15',
            requestedByPersonId:
              'person-6',
            remarks:
              'Vendor payment',
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            invoiceMatchId:
              invoiceMatch.id,
            requestedAmount:
              50000,
            currency:
              'INR',
            status:
              PaymentRequestStatus.DRAFT,
          }),
        );

        expect(
          repository.create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            vendorId:
              invoiceMatch.vendorId,
            propertyId:
              invoiceMatch.propertyId,
            purchaseOrderId:
              invoiceMatch.purchaseOrderId,
            invoiceMatchId:
              invoiceMatch.id,
            requestedAmount:
              50000,
            currency:
              'INR',
            status:
              PaymentRequestStatus.DRAFT,
          }),
          expect.objectContaining({
            toStatus:
              PaymentRequestStatus.DRAFT,
            changedByPersonId:
              'person-6',
          }),
        );
      },
    );

    it(
      'blocks editing a non-draft Payment Request',
      async () => {
        const current =
          createPaymentRequest(
            PaymentRequestStatus.SUBMITTED,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        await expect(
          service.update(
            current.id,
            {
              requestedAmount:
                50000,
              updatedByPersonId:
                'person-7',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.update,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'submits a draft Payment Request',
      async () => {
        const current =
          createPaymentRequest();

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              paymentRequest,
            ) => ({
              ...current,
              ...paymentRequest,
            }),
          );

        await expect(
          service.submit(
            current.id,
            {
              submittedByPersonId:
                'person-7',
              remarks:
                'Submit for approval',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              PaymentRequestStatus.SUBMITTED,
          }),
        );

        expect(
          repository.transition,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              PaymentRequestStatus.SUBMITTED,
          }),
          expect.objectContaining({
            fromStatus:
              PaymentRequestStatus.DRAFT,
            toStatus:
              PaymentRequestStatus.SUBMITTED,
            changedByPersonId:
              'person-7',
          }),
        );
      },
    );

    it(
      'blocks approval exceeding the requested amount',
      async () => {
        const current =
          createPaymentRequest(
            PaymentRequestStatus.SUBMITTED,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        await expect(
          service.approve(
            current.id,
            {
              approvedByPersonId:
                'person-8',
              approvedAmount:
                60000,
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.transition,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'approves a submitted Payment Request',
      async () => {
        const current =
          createPaymentRequest(
            PaymentRequestStatus.SUBMITTED,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              paymentRequest,
            ) => ({
              ...current,
              ...paymentRequest,
            }),
          );

        await expect(
          service.approve(
            current.id,
            {
              approvedByPersonId:
                'person-8',
              approvedAmount:
                55000,
              remarks:
                'Approved',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              PaymentRequestStatus.APPROVED,
            approvedAmount:
              55000,
            approvedByPersonId:
              'person-8',
          }),
        );
      },
    );

    it(
      'requires a rejection reason',
      async () => {
        const current =
          createPaymentRequest(
            PaymentRequestStatus.SUBMITTED,
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        await expect(
          service.reject(
            current.id,
            {
              rejectedByPersonId:
                'person-8',
              rejectionReason:
                '   ',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.transition,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'cancels an approved Payment Request',
      async () => {
        const current =
          createPaymentRequest(
            PaymentRequestStatus.APPROVED,
            {
              approvedAmount:
                55000,
              approvedByPersonId:
                'person-8',
            },
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              paymentRequest,
            ) => ({
              ...current,
              ...paymentRequest,
            }),
          );

        await expect(
          service.cancel(
            current.id,
            {
              cancelledByPersonId:
                'person-9',
              remarks:
                'Payment no longer required',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              PaymentRequestStatus.CANCELLED,
          }),
        );
      },
    );

    it(
      'requires a payment reference when paying',
      async () => {
        const current =
          createPaymentRequest(
            PaymentRequestStatus.APPROVED,
            {
              approvedAmount:
                55000,
              approvedByPersonId:
                'person-8',
            },
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        await expect(
          service.pay(
            current.id,
            {
              paidByPersonId:
                'person-10',
              paymentReference:
                '   ',
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );

        expect(
          repository.transition,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'marks an approved Payment Request as paid',
      async () => {
        const current =
          createPaymentRequest(
            PaymentRequestStatus.APPROVED,
            {
              approvedAmount:
                55000,
              approvedByPersonId:
                'person-8',
            },
          );

        repository.findById
          .mockResolvedValue(
            current,
          );

        repository.transition
          .mockImplementation(
            async (
              paymentRequest,
            ) => ({
              ...current,
              ...paymentRequest,
            }),
          );

        await expect(
          service.pay(
            current.id,
            {
              paidByPersonId:
                'person-10',
              paidAmount:
                55000,
              paymentReference:
                '  UTR-20260727-001  ',
              remarks:
                'Paid through bank transfer',
            },
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            status:
              PaymentRequestStatus.PAID,
            paidAmount:
              55000,
            paidByPersonId:
              'person-10',
            paymentReference:
              'UTR-20260727-001',
          }),
        );

        expect(
          repository.transition,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              PaymentRequestStatus.PAID,
            paidAmount:
              55000,
            paymentReference:
              'UTR-20260727-001',
          }),
          expect.objectContaining({
            fromStatus:
              PaymentRequestStatus.APPROVED,
            toStatus:
              PaymentRequestStatus.PAID,
            changedByPersonId:
              'person-10',
          }),
        );
      },
    );
  },
);
