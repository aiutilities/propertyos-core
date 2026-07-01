export interface VisitorQrPassEntity {
  id: string;
  visitId: string;
  qrToken: string;
  expiresAt: Date;
  generatedAt: Date;
  scannedAt?: Date;
  status: string;
  metadata?: Record<string, unknown>;
}
