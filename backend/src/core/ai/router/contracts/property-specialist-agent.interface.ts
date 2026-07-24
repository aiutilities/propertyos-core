export interface PropertySpecialistAgent {
  id: string;
  name: string;
  priority: number;
  capabilities: string[];

  canHandle(request: {
    capability: string;
    payload?: unknown;
  }): boolean;

  confidence(request: {
    capability: string;
    payload?: unknown;
  }): number;
}
