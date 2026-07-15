import type {
  QuotationStatus,
} from "@/types/quotation";

export interface QuotationComparisonEntry {
  quotationId: string;
  quotationNumber: string;
  vendorId: string;
  status: QuotationStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  deliveryDays?: number;
  validUntil: string;
  commercialRank: number;
  isLowestCommercialOffer: boolean;
}

export interface QuotationItemComparisonEntry {
  quotationId: string;
  quotationNumber: string;
  vendorId: string;
  quotationItemId: string;
  rfqItemId: string;
  lineNumber: number;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  deliveryDays?: number;
  lineRank: number;
  isLowestLineOffer: boolean;
}

export interface QuotationItemComparison {
  rfqItemId: string;
  entries: QuotationItemComparisonEntry[];
}

export interface ProcurementQuotationComparison {
  rfqId: string;
  rfqNumber: string;
  propertyId: string;
  currency: string;
  quotationCount: number;
  comparableQuotationCount: number;
  generatedAt: string;
  commercialRanking: QuotationComparisonEntry[];
  itemComparisons: QuotationItemComparison[];
}

export interface ComparisonRfq {
  id: string;
  rfqNumber: string;
  propertyId: string;
  title: string;
  status: string;
  quotationDeadline: string;
  currency: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}
