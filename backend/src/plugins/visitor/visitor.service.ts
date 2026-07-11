import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { EventBusService } from '../../core/eventbus/services/eventbus.service';
import { SchedulerService } from '../../core/scheduler';
import { VISITOR_REPOSITORY, VisitorRepositoryPort } from './repositories/visitor-repository.interface';
import {
  QR_STATUSES,
  VISITOR_DEFAULT_SETTINGS,
  VISITOR_EVENTS,
  VISITOR_STATUSES,
} from './visitor.constants';

import { CreateVisitorInviteDto } from './dto/create-visitor-invite.dto';
import { ApproveVisitorDto } from './dto/approve-visitor.dto';
import { RejectVisitorDto } from './dto/reject-visitor.dto';
import { ValidateQrDto } from './dto/validate-qr.dto';
import { CheckInVisitorDto } from './dto/check-in-visitor.dto';
import { CheckOutVisitorDto } from './dto/check-out-visitor.dto';
import { UpdateVisitorSettingsDto } from './dto/update-visitor-settings.dto';

@Injectable()
export class VisitorService {
  constructor(
    @Inject(VISITOR_REPOSITORY)
    private readonly visitorRepository: VisitorRepositoryPort,
    private readonly eventBus: EventBusService,
    private readonly schedulerService: SchedulerService,
  ) {}

  async inviteVisitor(dto: CreateVisitorInviteDto) {
    const existingVisitor = await this.visitorRepository.findVisitorByMobile(
      dto.mobile,
    );

    const visitor =
      existingVisitor ??
      (await this.visitorRepository.createVisitor({
        id: randomUUID(),
        fullName: dto.visitorName,
        mobile: dto.mobile,
        email: dto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const visit = await this.visitorRepository.createVisit({
      id: randomUUID(),
      visitorId: visitor.id,
      propertyId: dto.propertyId,
      hostPersonId: dto.hostPersonId,
      visitDate: dto.visitDate,
      visitPurpose: dto.visitPurpose,
      status: VISITOR_STATUSES.INVITED,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as { id: string };

    await this.recordStatusHistory(
      visit.id,
      undefined,
      VISITOR_STATUSES.INVITED,
      'Visitor invited',
    );

    await this.publishVisitorEvent(VISITOR_EVENTS.INVITED, {
      visitorId: visitor.id,
      visitId: visit.id,
      propertyId: dto.propertyId,
      hostPersonId: dto.hostPersonId,
      visitDate: dto.visitDate,
      status: VISITOR_STATUSES.INVITED,
      visitorName: visitor.fullName,
      visitorMobile: visitor.mobile,
      visitorEmail: visitor.email,
      ...(await this.getHostNotificationContext(
        dto.hostPersonId,
      )),
    });

    await this.scheduleVisitorNoShowJob(
      visit.id,
      dto.visitDate,
      dto.propertyId,
      dto.hostPersonId,
    );

    return visit;
  }

  async approveVisitor(visitId: string, dto: ApproveVisitorDto) {
    const visit = await this.visitorRepository.updateVisitStatus(
      visitId,
      VISITOR_STATUSES.APPROVED,
      {
        approvedAt: new Date(),
        remarks: dto.remarks,
      },
    );

    await this.recordStatusHistory(
      visitId,
      undefined,
      VISITOR_STATUSES.APPROVED,
      'Visitor approved',
    );

    await this.publishVisitorEvent(VISITOR_EVENTS.APPROVED, {
      visitId,
      visitorId: visit.visitorId,
      propertyId: visit.propertyId,
      hostPersonId: visit.hostPersonId,
      status: VISITOR_STATUSES.APPROVED,
      ...(await this.getVisitNotificationContext(visitId)),
    });

    return visit;
  }

  async rejectVisitor(visitId: string, dto: RejectVisitorDto) {
    const visit = await this.visitorRepository.updateVisitStatus(
      visitId,
      VISITOR_STATUSES.REJECTED,
      {
        rejectedAt: new Date(),
        reason: dto.reason,
      },
    );

    await this.recordStatusHistory(
      visitId,
      undefined,
      VISITOR_STATUSES.REJECTED,
      dto.reason,
    );

    await this.publishVisitorEvent(VISITOR_EVENTS.REJECTED, {
      visitId,
      reason: dto.reason,
      status: VISITOR_STATUSES.REJECTED,
      ...(await this.getVisitNotificationContext(visitId)),
    });

    return visit;
  }

  async generateQrPass(visitId: string) {
    const qrPass = await this.visitorRepository.createQrPass({
      id: randomUUID(),
      visitId,
      qrToken: randomUUID(),
      expiresAt: this.getDefaultQrExpiry(),
      generatedAt: new Date(),
      status: QR_STATUSES.ACTIVE,
    });

    await this.publishVisitorEvent(VISITOR_EVENTS.QR_GENERATED, {
      visitId,
      qrPassId: qrPass.id,
      qrToken: qrPass.qrToken,
      expiresAt: qrPass.expiresAt,
      ...(await this.getVisitNotificationContext(visitId)),
    });

    await this.scheduleQrExpiryJob(visitId, qrPass.id, qrPass.expiresAt);

    return qrPass;
  }

  async validateQr(dto: ValidateQrDto) {
    const qrPass = await this.visitorRepository.findQrPassByToken(dto.qrToken);

    if (!qrPass) {
      await this.publishVisitorEvent(VISITOR_EVENTS.QR_INVALID, {
        reason: 'QR_INVALID',
      });

      return {
        valid: false,
        reason: 'QR_INVALID',
      };
    }

    if (qrPass.status !== QR_STATUSES.ACTIVE) {
      await this.publishVisitorEvent(VISITOR_EVENTS.QR_INVALID, {
        visitId: qrPass.visitId,
        qrPassId: qrPass.id,
        reason: 'QR_NOT_ACTIVE',
      });

      return {
        valid: false,
        reason: 'QR_NOT_ACTIVE',
      };
    }

    if (new Date(qrPass.expiresAt) < new Date()) {
      await this.publishVisitorEvent(VISITOR_EVENTS.QR_INVALID, {
        visitId: qrPass.visitId,
        qrPassId: qrPass.id,
        reason: 'QR_EXPIRED',
      });

      return {
        valid: false,
        reason: 'QR_EXPIRED',
      };
    }

    await this.publishVisitorEvent(VISITOR_EVENTS.QR_SCANNED, {
      visitId: qrPass.visitId,
      qrPassId: qrPass.id,
      scannedAt: new Date(),
    });

    return {
      valid: true,
      visitId: qrPass.visitId,
    };
  }

  async markArrived(visitId: string) {
    const visit = await this.visitorRepository.updateVisitStatus(
      visitId,
      VISITOR_STATUSES.ARRIVED,
      {
        arrivedAt: new Date(),
      },
    );

    await this.recordStatusHistory(
      visitId,
      undefined,
      VISITOR_STATUSES.ARRIVED,
      'Visitor arrived',
    );

    await this.publishVisitorEvent(VISITOR_EVENTS.ARRIVED, {
      visitId,
      arrivedAt: new Date(),
      ...(await this.getVisitNotificationContext(visitId)),
    });

    return visit;
  }

  async checkInVisitor(visitId: string, dto: CheckInVisitorDto) {
    const visit = await this.visitorRepository.updateVisitStatus(
      visitId,
      VISITOR_STATUSES.CHECKED_IN,
      {
        checkedInAt: new Date(),
        gate: dto.gate,
        securityPersonId: dto.securityPersonId,
      },
    );

    await this.recordStatusHistory(
      visitId,
      undefined,
      VISITOR_STATUSES.CHECKED_IN,
      'Visitor checked in',
    );

    const checkedInAt = new Date();

    await this.publishVisitorEvent(VISITOR_EVENTS.CHECKED_IN, {
      visitId,
      checkedInAt,
      gate: dto.gate,
      securityPersonId: dto.securityPersonId,
      ...(await this.getVisitNotificationContext(visitId)),
    });

    await this.scheduleAutoCheckoutJob(visitId, checkedInAt);

    return visit;
  }

  async checkOutVisitor(visitId: string, dto: CheckOutVisitorDto) {
    const visit = await this.visitorRepository.updateVisitStatus(
      visitId,
      VISITOR_STATUSES.CHECKED_OUT,
      {
        checkedOutAt: new Date(),
        gate: dto.gate,
        securityPersonId: dto.securityPersonId,
      },
    );

    await this.recordStatusHistory(
      visitId,
      undefined,
      VISITOR_STATUSES.CHECKED_OUT,
      'Visitor checked out',
    );

    await this.publishVisitorEvent(VISITOR_EVENTS.CHECKED_OUT, {
      visitId,
      checkedOutAt: new Date(),
      gate: dto.gate,
      securityPersonId: dto.securityPersonId,
      ...(await this.getVisitNotificationContext(visitId)),
    });

    return visit;
  }

  async cancelVisitor(visitId: string, reason: string) {
    const visit = await this.visitorRepository.updateVisitStatus(
      visitId,
      VISITOR_STATUSES.CANCELLED,
      {
        cancelledAt: new Date(),
        reason,
      },
    );

    await this.recordStatusHistory(
      visitId,
      undefined,
      VISITOR_STATUSES.CANCELLED,
      reason,
    );

    await this.publishVisitorEvent(VISITOR_EVENTS.CANCELLED, {
      visitId,
      reason,
      status: VISITOR_STATUSES.CANCELLED,
    });

    return visit;
  }

  async getVisit(visitId: string) {
    return this.visitorRepository.findVisitById(visitId);
  }


  async searchVisits(query: string, limit?: number) {
    return this.visitorRepository.searchVisits(query, limit);
  }

  async listVisits(filters: Record<string, unknown>) {
    return this.visitorRepository.listVisits(filters);
  }

  async getHistory(visitId: string) {
    return this.visitorRepository.getVisitHistory(visitId);
  }

  async getSettings(propertyId?: string) {
    const savedSettings = await this.visitorRepository.getSettings(propertyId);

    return savedSettings.settings ?? VISITOR_DEFAULT_SETTINGS;
  }

  async updateSettings(
    propertyId: string | undefined,
    dto: UpdateVisitorSettingsDto,
  ) {
    return this.visitorRepository.updateSettings(propertyId, { ...dto });
  }

  private async recordStatusHistory(
    visitId: string,
    previousStatus: string | undefined,
    newStatus: string,
    reason: string,
  ) {
    return this.visitorRepository.createStatusHistory({
      id: randomUUID(),
      visitId,
      previousStatus,
      newStatus,
      changeReason: reason,
      createdAt: new Date(),
    });
  }


  private async getVisitNotificationContext(
    visitId: string,
  ): Promise<Record<string, unknown>> {
    const visit =
      await this.visitorRepository.findVisitById(visitId);

    if (!visit) {
      return {};
    }

    const hostContext =
      await this.getHostNotificationContext(
        visit.hostPersonId,
      );

    return {
      visitorName: visit.visitor?.fullName,
      visitorMobile: visit.visitor?.mobile,
      visitorEmail: visit.visitor?.email,
      hostPersonId: visit.hostPersonId,
      propertyId: visit.propertyId,
      visitDate: visit.visitDate,
      visitPurpose: visit.visitPurpose,
      ...hostContext,
    };
  }

  private async getHostNotificationContext(
    hostPersonId: string,
  ): Promise<Record<string, unknown>> {
    if (!hostPersonId) {
      return {};
    }

    return this.visitorRepository
      .findHostNotificationContact(hostPersonId);
  }

  private async scheduleVisitorNoShowJob(
    visitId: string,
    visitDate: string,
    propertyId: string,
    hostPersonId: string,
  ) {
    const runAt = new Date(visitDate);

    if (Number.isNaN(runAt.getTime())) {
      return;
    }

    await this.schedulerService.createJob({
      name: 'Visitor No Show Check',
      jobType: 'visitor.no_show',
      payload: {
        visitId,
        propertyId,
        hostPersonId,
      },
      scheduleType: 'ONE_TIME',
      runAt: runAt.toISOString(),
      maxAttempts: 3,
    });
  }

  private async scheduleQrExpiryJob(
    visitId: string,
    qrPassId: string,
    expiresAt: Date,
  ) {
    await this.schedulerService.createJob({
      name: 'Visitor QR Expiry',
      jobType: 'visitor.qr.expire',
      payload: {
        visitId,
        qrPassId,
      },
      scheduleType: 'ONE_TIME',
      runAt: expiresAt.toISOString(),
      maxAttempts: 3,
    });
  }

  private async scheduleAutoCheckoutJob(visitId: string, checkedInAt: Date) {
    const runAt = new Date(checkedInAt);
    runAt.setHours(
      runAt.getHours() + VISITOR_DEFAULT_SETTINGS.defaultVisitDurationHours,
    );

    await this.schedulerService.createJob({
      name: 'Visitor Auto Checkout',
      jobType: 'visitor.auto_checkout',
      payload: {
        visitId,
      },
      scheduleType: 'ONE_TIME',
      runAt: runAt.toISOString(),
      maxAttempts: 3,
    });
  }

  private async publishVisitorEvent(
    eventName: string,
    payload: Record<string, unknown>,
  ) {
    return this.eventBus.publish(eventName, 'plugin.visitor', payload);
  }

  private getDefaultQrExpiry() {
    const expiry = new Date();
    expiry.setHours(
      expiry.getHours() + VISITOR_DEFAULT_SETTINGS.defaultVisitDurationHours,
    );
    return expiry;
  }
}
