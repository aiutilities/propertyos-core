import type { SortOrder } from "@/types/pagination";

export interface RentCollectionReportRow {
  paymentId: string;
  rentLedgerId: string;
  tenantId: string;
  tenantNumber: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  agreementId: string;
  agreementNumber: string;
  receiptId?: string;
  receiptNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string;
  notes?: string;
}

export interface RentCollectionSummary {
  totalCollected: number;
  paymentCount: number;
}

export interface RentCollectionReportData {
  items: RentCollectionReportRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: RentCollectionSummary;
}

export interface RentCollectionReportResponse {
  success: boolean;
  data: RentCollectionReportData;
}

export interface RentCollectionReportQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: SortOrder;
  propertyId: string;
  tenantId: string;
  paymentMode: string;
  fromDate: string;
  toDate: string;
}
