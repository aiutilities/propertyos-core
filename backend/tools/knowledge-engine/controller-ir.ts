export interface SourceReference {
  path: string;
  line: number;
}

export interface RouteKnowledge {
  id: string;
  controllerId: string;
  controllerClassName: string;
  moduleId: string;
  httpMethod: string;
  path: string;
  fullPath: string;
  handler: string;
  handlerLine: number;
  permissions: string[];
  bearerAuth: boolean;
  source: SourceReference;
}

export interface ControllerKnowledge {
  id: string;
  moduleId: string;
  className: string;
  basePath: string;
  guards: string[];
  bearerAuth: boolean;
  routeCount: number;
  routes: RouteKnowledge[];
  source: SourceReference;
}

export interface ControllerKnowledgeManifest {
  schemaVersion: "1.0.0";
  controllerCount: number;
  routeCount: number;
  controllers: ControllerKnowledge[];
}
