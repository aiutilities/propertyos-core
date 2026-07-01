export class UpdateVisitorSettingsDto {
  allowQrInvite?: boolean;
  hostApprovalRequired?: boolean;
  defaultVisitDurationHours?: number;
  notifyHostOnCheckIn?: boolean;
  notifyHostOnCheckOut?: boolean;
}
