export const VISITOR_REPOSITORY = 'VISITOR_REPOSITORY';

export interface VisitorRepositoryPort {
  findVisitorByMobile(mobile: string): Promise<any>;
  createVisitor(data: Record<string, unknown>): Promise<any>;
  createVisit(data: Record<string, unknown>): Promise<any>;
  updateVisitStatus(
    visitId: string,
    status: string,
    updates?: Record<string, unknown>,
  ): Promise<any>;
  createQrPass(data: Record<string, unknown>): Promise<any>;
  findQrPassByToken(qrToken: string): Promise<any>;
  findVisitById(visitId: string): Promise<any>;
  listVisits(filters: Record<string, unknown>): Promise<any>;
  createStatusHistory(data: Record<string, unknown>): Promise<any>;
  getVisitHistory(visitId: string): Promise<any>;
  getSettings(propertyId?: string): Promise<any>;
  updateSettings(
    propertyId: string | undefined,
    settings: Record<string, unknown>,
  ): Promise<any>;
}
