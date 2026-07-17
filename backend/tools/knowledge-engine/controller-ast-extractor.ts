import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";

import {
  ControllerKnowledge,
  ControllerKnowledgeManifest,
  RouteKnowledge,
} from "./controller-ir";

const HTTP_DECORATORS: Readonly<Record<string, string>> = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Patch: "PATCH",
  Delete: "DELETE",
  Options: "OPTIONS",
  Head: "HEAD",
  All: "ALL",
};

const PERMISSION_DECORATORS = new Set([
  "RequirePermission",
  "RequirePermissions",
  "Permissions",
]);

const DISCOVERY_PREFIXES = [
  "backend/src/core/",
  "backend/src/plugins/",
  "backend/src/config/",
  "backend/src/database/",
];

interface ParsedDecorator {
  name: string;
  node: ts.Decorator;
  arguments: readonly ts.Expression[];
}

function normaliseSlashes(value: string): string {
  return value.replaceAll(path.sep, "/");
}

function normalisePath(value: string): string {
  const segments = value
    .trim()
    .split("/")
    .filter(Boolean);

  return segments.length === 0
    ? "/"
    : `/${segments.join("/")}`;
}

function normaliseRelativePath(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function joinPaths(basePath: string, routePath: string): string {
  const segments = [basePath, routePath]
    .flatMap((value) => value.trim().split("/"))
    .filter(Boolean);

  return segments.length === 0
    ? "/"
    : `/${segments.join("/")}`;
}

function moduleId(relativePath: string): string {
  const parts = relativePath.split("/");

  if (
    parts.length >= 4 &&
    parts[0] === "backend" &&
    parts[1] === "src" &&
    parts[2] === "core"
  ) {
    return parts[3];
  }

  if (
    parts.length >= 4 &&
    parts[0] === "backend" &&
    parts[1] === "src" &&
    parts[2] === "plugins"
  ) {
    return `plugin:${parts[3]}`;
  }

  if (
    parts.length >= 4 &&
    parts[0] === "backend" &&
    parts[1] === "src" &&
    parts[2] === "config"
  ) {
    return "config";
  }

  if (
    parts.length >= 4 &&
    parts[0] === "backend" &&
    parts[1] === "src" &&
    parts[2] === "database"
  ) {
    return "database";
  }

  return "unknown";
}

function controllerId(
  ownerModuleId: string,
  className: string,
): string {
  const value = className
    .replace(/Controller$/, "")
    .replace(/(?<!^)(?=[A-Z])/g, "-")
    .toLowerCase();

  return `${ownerModuleId}:${value}`;
}

function lineNumber(
  sourceFile: ts.SourceFile,
  node: ts.Node,
): number {
  return (
    sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile),
    ).line + 1
  );
}

function decoratorName(expression: ts.Expression): string {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  return expression.getText();
}

function decoratorsOf(node: ts.Node): ParsedDecorator[] {
  if (!ts.canHaveDecorators(node)) {
    return [];
  }

  return (ts.getDecorators(node) ?? []).map((decorator) => {
    const expression = decorator.expression;

    if (ts.isCallExpression(expression)) {
      return {
        name: decoratorName(expression.expression),
        node: decorator,
        arguments: expression.arguments,
      };
    }

    return {
      name: decoratorName(expression),
      node: decorator,
      arguments: [],
    };
  });
}

function stringArgument(
  decorator: ParsedDecorator,
): string {
  const argument = decorator.arguments[0];

  if (
    argument &&
    (
      ts.isStringLiteral(argument) ||
      ts.isNoSubstitutionTemplateLiteral(argument)
    )
  ) {
    return argument.text;
  }

  return "";
}

function classGuards(
  decorators: readonly ParsedDecorator[],
): string[] {
  const guards = new Set<string>();

  for (const decorator of decorators) {
    if (decorator.name !== "UseGuards") {
      continue;
    }

    for (const argument of decorator.arguments) {
      if (ts.isIdentifier(argument)) {
        guards.add(argument.text);
      }
    }
  }

  return [...guards].sort();
}

function permissions(
  decorators: readonly ParsedDecorator[],
  sourceFile: ts.SourceFile,
): string[] {
  const values = new Set<string>();

  for (const decorator of decorators) {
    if (!PERMISSION_DECORATORS.has(decorator.name)) {
      continue;
    }

    for (const argument of decorator.arguments) {
      const value = argument
        .getText(sourceFile)
        .replace(/\s+/g, "");

      if (value) {
        values.add(value);
      }
    }
  }

  return [...values].sort();
}

function isControllerSource(
  repositoryRoot: string,
  sourceFile: ts.SourceFile,
): boolean {
  const relativePath = normaliseSlashes(
    path.relative(repositoryRoot, sourceFile.fileName),
  );

  return (
    relativePath.endsWith(".controller.ts") &&
    DISCOVERY_PREFIXES.some(
      (prefix) => relativePath.startsWith(prefix),
    ) &&
    !relativePath.startsWith("backend/backend/")
  );
}

function extractController(
  repositoryRoot: string,
  sourceFile: ts.SourceFile,
): ControllerKnowledge | null {
  let result: ControllerKnowledge | null = null;

  sourceFile.forEachChild((node) => {
    if (
      result !== null ||
      !ts.isClassDeclaration(node) ||
      !node.name
    ) {
      return;
    }

    const classDecorators = decoratorsOf(node);
    const controllerDecorator = classDecorators.find(
      (decorator) => decorator.name === "Controller",
    );

    if (!controllerDecorator) {
      return;
    }

    const relativePath = normaliseSlashes(
      path.relative(repositoryRoot, sourceFile.fileName),
    );

    const ownerModuleId = moduleId(relativePath);
    const className = node.name.text;
    const id = controllerId(ownerModuleId, className);
    const rawBasePath = stringArgument(controllerDecorator);
    const bearerAuth = classDecorators.some(
      (decorator) => decorator.name === "ApiBearerAuth",
    );

    const routes: RouteKnowledge[] = [];

    for (const member of node.members) {
      if (
        !ts.isMethodDeclaration(member) ||
        !member.name
      ) {
        continue;
      }

      const methodDecorators = decoratorsOf(member);
      const routeDecorators = methodDecorators.filter(
        (decorator) =>
          Object.prototype.hasOwnProperty.call(
            HTTP_DECORATORS,
            decorator.name,
          ),
      );

      if (routeDecorators.length === 0) {
        continue;
      }

      const handler = member.name.getText(sourceFile);
      const routePermissions = permissions(
        methodDecorators,
        sourceFile,
      );

      for (const routeDecorator of routeDecorators) {
        const rawRoutePath = stringArgument(routeDecorator);
        const httpMethod =
          HTTP_DECORATORS[routeDecorator.name];
        const fullPath = joinPaths(
          rawBasePath,
          rawRoutePath,
        );

        routes.push({
          id:
            `${id}:` +
            `${httpMethod.toLowerCase()}:` +
            `${handler}:` +
            `${fullPath}`,
          controllerId: id,
          controllerClassName: className,
          moduleId: ownerModuleId,
          httpMethod,
          path: normaliseRelativePath(rawRoutePath),
          fullPath,
          handler,
          handlerLine: lineNumber(
            sourceFile,
            member.name,
          ),
          permissions: routePermissions,
          bearerAuth,
          source: {
            path: relativePath,
            line: lineNumber(
              sourceFile,
              routeDecorator.node,
            ),
          },
        });
      }
    }

    routes.sort((left, right) => {
      return (
        left.fullPath.localeCompare(right.fullPath) ||
        left.httpMethod.localeCompare(right.httpMethod) ||
        left.handler.localeCompare(right.handler) ||
        left.source.line - right.source.line
      );
    });

    result = {
      id,
      moduleId: ownerModuleId,
      className,
      basePath: normalisePath(rawBasePath),
      guards: classGuards(classDecorators),
      bearerAuth,
      routeCount: routes.length,
      routes,
      source: {
        path: relativePath,
        line: lineNumber(
          sourceFile,
          controllerDecorator.node,
        ),
      },
    };
  });

  return result;
}

function loadProgram(repositoryRoot: string): ts.Program {
  const configPath = path.join(
    repositoryRoot,
    "backend",
    "tsconfig.json",
  );

  const configFile = ts.readConfigFile(
    configPath,
    ts.sys.readFile,
  );

  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(
        configFile.error.messageText,
        "\n",
      ),
    );
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
    undefined,
    configPath,
  );

  if (parsed.errors.length > 0) {
    throw new Error(
      parsed.errors
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n",
          ),
        )
        .join("\n"),
    );
  }

  return ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
    projectReferences: parsed.projectReferences,
  });
}

function main(): void {
  const repositoryRoot = path.resolve(
    process.argv[2] ?? path.join(__dirname, "../../.."),
  );

  const outputPath = path.resolve(
    process.argv[3] ??
      path.join(
        repositoryRoot,
        "generated",
        "knowledge",
        "controllers.ast.json",
      ),
  );

  const program = loadProgram(repositoryRoot);

  const controllers = program
    .getSourceFiles()
    .filter((sourceFile) =>
      isControllerSource(repositoryRoot, sourceFile),
    )
    .map((sourceFile) =>
      extractController(repositoryRoot, sourceFile),
    )
    .filter(
      (controller): controller is ControllerKnowledge =>
        controller !== null,
    )
    .sort((left, right) => {
      return (
        left.moduleId.localeCompare(right.moduleId) ||
        left.className.localeCompare(right.className) ||
        left.source.path.localeCompare(right.source.path)
      );
    });

  const manifest: ControllerKnowledgeManifest = {
    schemaVersion: "1.0.0",
    controllerCount: controllers.length,
    routeCount: controllers.reduce(
      (count, controller) =>
        count + controller.routes.length,
      0,
    ),
    controllers,
  };

  fs.mkdirSync(path.dirname(outputPath), {
    recursive: true,
  });

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        outputPath: normaliseSlashes(
          path.relative(repositoryRoot, outputPath),
        ),
        controllerCount: manifest.controllerCount,
        routeCount: manifest.routeCount,
      },
      null,
      2,
    ),
  );
}

main();
