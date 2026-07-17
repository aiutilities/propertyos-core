import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

interface SourceReference {
  path: string;
  line: number;
}

interface ImportedModuleReference {
  className: string;
  expression: string;
  sourcePath: string | null;
  external: boolean;
  source: SourceReference;
}

interface ExtractedModuleDependency {
  className: string;
  source: SourceReference;
  imports: ImportedModuleReference[];
}

interface ModuleDependencyManifest {
  schemaVersion: string;
  generator: string;
  moduleCount: number;
  importReferenceCount: number;
  modules: ExtractedModuleDependency[];
}

function normalisePath(value: string): string {
  return value.split(path.sep).join('/');
}

function relativePath(
  repositoryRoot: string,
  sourcePath: string,
): string {
  return normalisePath(
    path.relative(repositoryRoot, sourcePath),
  );
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

function decoratorsOf(
  node: ts.Node,
): readonly ts.Decorator[] {
  if (!ts.canHaveDecorators(node)) {
    return [];
  }

  return ts.getDecorators(node) ?? [];
}

function decoratorCall(
  decorator: ts.Decorator,
): ts.CallExpression | null {
  return ts.isCallExpression(decorator.expression)
    ? decorator.expression
    : null;
}

function decoratorName(
  expression: ts.LeftHandSideExpression,
): string | null {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }

  return null;
}

function moduleMetadataObject(
  classDeclaration: ts.ClassDeclaration,
): ts.ObjectLiteralExpression | null {
  for (const decorator of decoratorsOf(
    classDeclaration,
  )) {
    const call = decoratorCall(decorator);

    if (
      call === null ||
      decoratorName(call.expression) !== 'Module'
    ) {
      continue;
    }

    const argument = call.arguments[0];

    if (
      argument !== undefined &&
      ts.isObjectLiteralExpression(argument)
    ) {
      return argument;
    }
  }

  return null;
}

function propertyByName(
  objectLiteral: ts.ObjectLiteralExpression,
  name: string,
): ts.PropertyAssignment | null {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    const propertyName = property.name;

    if (
      ts.isIdentifier(propertyName) &&
      propertyName.text === name
    ) {
      return property;
    }

    if (
      ts.isStringLiteral(propertyName) &&
      propertyName.text === name
    ) {
      return property;
    }
  }

  return null;
}

function unwrapModuleExpression(
  expression: ts.Expression,
): ts.Expression {
  if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'forwardRef'
  ) {
    const callback = expression.arguments[0];

    if (
      callback !== undefined &&
      (
        ts.isArrowFunction(callback) ||
        ts.isFunctionExpression(callback)
      )
    ) {
      if (ts.isBlock(callback.body)) {
        for (const statement of callback.body.statements) {
          if (
            ts.isReturnStatement(statement) &&
            statement.expression !== undefined
          ) {
            return unwrapModuleExpression(
              statement.expression,
            );
          }
        }

        return expression;
      }

      return unwrapModuleExpression(
        callback.body,
      );
    }
  }

  if (ts.isCallExpression(expression)) {
    return unwrapModuleExpression(
      expression.expression,
    );
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return unwrapModuleExpression(
      expression.expression,
    );
  }

  if (ts.isParenthesizedExpression(expression)) {
    return unwrapModuleExpression(
      expression.expression,
    );
  }

  return expression;
}

function aliasedSymbol(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): ts.Symbol {
  if (
    symbol.flags & ts.SymbolFlags.Alias
  ) {
    return checker.getAliasedSymbol(symbol);
  }

  return symbol;
}

function sourcePathForExpression(
  repositoryRoot: string,
  checker: ts.TypeChecker,
  expression: ts.Expression,
): {
  sourcePath: string | null;
  external: boolean;
} {
  const unwrapped = unwrapModuleExpression(
    expression,
  );

  const symbol = checker.getSymbolAtLocation(
    unwrapped,
  );

  if (symbol === undefined) {
    return {
      sourcePath: null,
      external: false,
    };
  }

  const resolvedSymbol = aliasedSymbol(
    checker,
    symbol,
  );

  const declarations =
    resolvedSymbol.getDeclarations() ?? [];

  for (const declaration of declarations) {
    const declarationPath =
      declaration.getSourceFile().fileName;

    if (
      declarationPath.includes(
        `${path.sep}node_modules${path.sep}`,
      )
    ) {
      return {
        sourcePath: null,
        external: true,
      };
    }

    if (
      declarationPath.startsWith(repositoryRoot)
    ) {
      return {
        sourcePath: relativePath(
          repositoryRoot,
          declarationPath,
        ),
        external: false,
      };
    }
  }

  return {
    sourcePath: null,
    external: true,
  };
}

function classNameForExpression(
  expression: ts.Expression,
): string {
  const unwrapped = unwrapModuleExpression(
    expression,
  );

  if (ts.isIdentifier(unwrapped)) {
    return unwrapped.text;
  }

  if (ts.isPropertyAccessExpression(unwrapped)) {
    return unwrapped.name.text;
  }

  return unwrapped.getText();
}

function extractImports(
  repositoryRoot: string,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  metadata: ts.ObjectLiteralExpression,
): ImportedModuleReference[] {
  const importsProperty = propertyByName(
    metadata,
    'imports',
  );

  if (importsProperty === null) {
    return [];
  }

  if (
    !ts.isArrayLiteralExpression(
      importsProperty.initializer,
    )
  ) {
    return [];
  }

  const references =
    importsProperty.initializer.elements.map(
      (element): ImportedModuleReference => {
        const expression = element as ts.Expression;

        const resolution = sourcePathForExpression(
          repositoryRoot,
          checker,
          expression,
        );

        return {
          className: classNameForExpression(
            expression,
          ),
          expression: expression.getText(
            sourceFile,
          ),
          sourcePath: resolution.sourcePath,
          external: resolution.external,
          source: {
            path: relativePath(
              repositoryRoot,
              sourceFile.fileName,
            ),
            line: lineNumber(
              sourceFile,
              expression,
            ),
          },
        };
      },
    );

  references.sort(
    (left, right) =>
      left.className.localeCompare(
        right.className,
      ) ||
      (left.sourcePath ?? '').localeCompare(
        right.sourcePath ?? '',
      ) ||
      left.expression.localeCompare(
        right.expression,
      ),
  );

  return references;
}

function discoverSourceFiles(
  repositoryRoot: string,
): string[] {
  const roots = [
    path.join(
      repositoryRoot,
      'backend/src/core',
    ),
    path.join(
      repositoryRoot,
      'backend/src/plugins',
    ),
    path.join(
      repositoryRoot,
      'backend/src/config',
    ),
    path.join(
      repositoryRoot,
      'backend/src/database',
    ),
  ];

  const results: string[] = [];

  function visit(directory: string): void {
    if (!fs.existsSync(directory)) {
      return;
    }

    for (
      const entry of fs.readdirSync(
        directory,
        { withFileTypes: true },
      )
    ) {
      const entryPath = path.join(
        directory,
        entry.name,
      );

      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      if (
        entry.isFile() &&
        entry.name.endsWith('.module.ts')
      ) {
        results.push(entryPath);
      }
    }
  }

  for (const root of roots) {
    visit(root);
  }

  results.sort();

  return results;
}

function buildManifest(
  repositoryRoot: string,
): ModuleDependencyManifest {
  const sourceFiles = discoverSourceFiles(
    repositoryRoot,
  );

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    moduleResolution:
      ts.ModuleResolutionKind.Node10,
    experimentalDecorators: true,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: true,
  };

  const program = ts.createProgram(
    sourceFiles,
    compilerOptions,
  );

  const checker = program.getTypeChecker();

  const modules: ExtractedModuleDependency[] = [];

  for (const sourcePath of sourceFiles) {
    const sourceFile = program.getSourceFile(
      sourcePath,
    );

    if (sourceFile === undefined) {
      continue;
    }

    for (const statement of sourceFile.statements) {
      if (
        !ts.isClassDeclaration(statement) ||
        statement.name === undefined
      ) {
        continue;
      }

      const metadata = moduleMetadataObject(
        statement,
      );

      if (metadata === null) {
        continue;
      }

      modules.push({
        className: statement.name.text,
        source: {
          path: relativePath(
            repositoryRoot,
            sourcePath,
          ),
          line: lineNumber(
            sourceFile,
            statement.name,
          ),
        },
        imports: extractImports(
          repositoryRoot,
          sourceFile,
          checker,
          metadata,
        ),
      });
    }
  }

  modules.sort(
    (left, right) =>
      left.source.path.localeCompare(
        right.source.path,
      ) ||
      left.className.localeCompare(
        right.className,
      ),
  );

  return {
    schemaVersion: '1.0.0',
    generator:
      'propertyos-typescript-module-dependency-extractor',
    moduleCount: modules.length,
    importReferenceCount: modules.reduce(
      (total, module) =>
        total + module.imports.length,
      0,
    ),
    modules,
  };
}

function main(): void {
  const repositoryRoot = path.resolve(
    process.argv[2] ?? '..',
  );

  const outputPath = path.resolve(
    process.argv[3] ??
      path.join(
        repositoryRoot,
        'generated/knowledge/' +
          'module-dependencies.ast.json',
      ),
  );

  const manifest = buildManifest(
    repositoryRoot,
  );

  fs.mkdirSync(
    path.dirname(outputPath),
    { recursive: true },
  );

  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(
      manifest,
      null,
      2,
    )}\n`,
    'utf-8',
  );

  console.log(
    JSON.stringify(
      {
        outputPath: relativePath(
          repositoryRoot,
          outputPath,
        ),
        moduleCount: manifest.moduleCount,
        importReferenceCount:
          manifest.importReferenceCount,
      },
      null,
      2,
    ),
  );
}

main();
