import {
  AccessDirection,
  AccessSchedule,
  AccessSubjectType,
} from "../types/access-control.types";

export class CreateAccessGrantDto {
  accessPointId!: string;
  subjectType!: AccessSubjectType;
  subjectId!: string;
  direction!: AccessDirection;
  validFrom?: string;
  validUntil?: string;
  schedule?: AccessSchedule;
  issuedByPersonId!: string;
  notes?: string;
}
