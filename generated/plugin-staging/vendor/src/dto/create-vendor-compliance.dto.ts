import {
  VendorComplianceType,
} from '../types/vendor.types';

export class CreateVendorComplianceDto {
  vendorId!: string;

  complianceType!:
    VendorComplianceType;

  documentId!: string;

  referenceNumber?: string;

  issuedAt?: string;
  expiresAt?: string;

  remarks?: string;

  createdByPersonId!: string;
}
