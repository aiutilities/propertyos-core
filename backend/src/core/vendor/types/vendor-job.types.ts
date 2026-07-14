export interface VendorContractExpiryJobPayload {
  contractId: string;
  vendorId: string;
}

export interface VendorComplianceExpiryJobPayload {
  complianceDocumentId: string;
  vendorId: string;
}
