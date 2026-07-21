import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  Dirent,
  readFileSync,
  readdirSync,
} from 'node:fs';
import {
  join,
  relative,
  sep,
} from 'node:path';

interface SourceViolation {
  file: string;
  reason: string;
  evidence: string;
}

const BACKEND_SOURCE_ROOT =
  join(process.cwd(), 'src');

const AI_SOURCE_ROOT =
  join(
    BACKEND_SOURCE_ROOT,
    'core',
    'ai',
  );

const SOURCE_FILE_PATTERN =
  /\.ts$/;

const TEST_FILE_PATTERN =
  /(?:\.spec|\.integration-spec|\.architecture-spec)\.ts$/;

const IMPORT_SOURCE_PATTERN =
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;

const normalizePath = (
  value: string,
): string =>
  value.split(sep).join('/');

const walkSourceFiles = (
  directory: string,
): string[] => {
  const entries =
    readdirSync(
      directory,
      {
        withFileTypes: true,
      },
    );

  return entries.flatMap(
    (
      entry: Dirent,
    ): string[] => {
      const absolutePath =
        join(
          directory,
          entry.name,
        );

      if (entry.isDirectory()) {
        return walkSourceFiles(
          absolutePath,
        );
      }

      if (
        !entry.isFile() ||
        !SOURCE_FILE_PATTERN.test(
          entry.name,
        ) ||
        TEST_FILE_PATTERN.test(
          entry.name,
        )
      ) {
        return [];
      }

      return [
        absolutePath,
      ];
    },
  );
};

const isInsideAiSubsystem = (
  absolutePath: string,
): boolean => {
  const relativePath =
    relative(
      AI_SOURCE_ROOT,
      absolutePath,
    );

  return (
    relativePath === '' ||
    (
      !relativePath.startsWith('..') &&
      !relativePath.startsWith(
        `..${sep}`,
      )
    )
  );
};

const isAiInternalImport = (
  importSource: string,
): boolean => {
  const normalized =
    importSource.replace(
      /\\/g,
      '/',
    );

  return (
    normalized.includes(
      '/core/ai/',
    ) ||
    /(?:^|\/)ai\/.+/.test(
      normalized,
    )
  );
};

const collectViolations =
  (): SourceViolation[] => {
    const violations:
      SourceViolation[] = [];

    for (
      const absolutePath
      of walkSourceFiles(
        BACKEND_SOURCE_ROOT,
      )
    ) {
      if (
        isInsideAiSubsystem(
          absolutePath,
        )
      ) {
        continue;
      }

      const relativeFile =
        normalizePath(
          relative(
            process.cwd(),
            absolutePath,
          ),
        );

      const source =
        readFileSync(
          absolutePath,
          'utf-8',
        );

      if (
        /\bAiOrchestratorService\b/.test(
          source,
        )
      ) {
        violations.push({
          file:
            relativeFile,
          reason:
            'Direct AiOrchestratorService usage outside core/ai',
          evidence:
            'AiOrchestratorService',
        });
      }

      for (
        const match
        of source.matchAll(
          IMPORT_SOURCE_PATTERN,
        )
      ) {
        const importSource =
          match[1];

        if (
          isAiInternalImport(
            importSource,
          )
        ) {
          violations.push({
            file:
              relativeFile,
            reason:
              'Import bypasses the public AI package boundary',
            evidence:
              importSource,
          });
        }
      }
    }

    return violations;
  };

describe(
  'PropertyOS AI SDK architecture boundary',
  () => {
    it(
      'prevents business modules from depending on AiOrchestratorService',
      () => {
        const violations =
          collectViolations().filter(
            violation =>
              violation.reason.includes(
                'AiOrchestratorService',
              ),
          );

        expect(
          violations,
        ).toEqual([]);
      },
    );

    it(
      'prevents imports from AI internal subdirectories',
      () => {
        const violations =
          collectViolations().filter(
            violation =>
              violation.reason.includes(
                'public AI package boundary',
              ),
          );

        expect(
          violations,
        ).toEqual([]);
      },
    );
  },
);
