import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const adapterPath = fileURLToPath(import.meta.url);

const repositoryRoot = path.resolve(
  path.dirname(adapterPath),
  "..",
  "..",
  "..",
);

const backendRoot = path.join(
  repositoryRoot,
  "backend",
);

const authenticationTests = [
  "src/core/auth/global-auth-wiring.integration-spec.ts",
  "src/core/auth/guards/global-auth-guard-contract.integration-spec.ts",
  "src/core/auth/guards/platform-permission-coverage.integration-spec.ts",
];

function runCommand({
  command,
  args,
  cwd,
  label,
}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let completed = false;

    function finish(result) {
      if (completed) {
        return;
      }

      completed = true;
      resolve(result);
    }

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      finish({
        id: label,
        passed: false,
        durationMs: Date.now() - startedAt,
        command: [command, ...args].join(" "),
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });

    child.on("close", (code) => {
      finish({
        id: label,
        passed: code === 0,
        durationMs: Date.now() - startedAt,
        command: [command, ...args].join(" "),
        stdout,
        stderr,
        exitCode: code,
        error:
          code === 0
            ? null
            : `exit code ${code}`,
      });
    });
  });
}

async function fileCheck(
  relativePath,
  label,
) {
  const startedAt = Date.now();
  const absolutePath = path.join(
    repositoryRoot,
    relativePath,
  );

  try {
    const stat = await fs.stat(absolutePath);

    return {
      id: label,
      passed:
        stat.isFile() &&
        stat.size > 0,
      durationMs:
        Date.now() - startedAt,
      path: relativePath,
      sizeBytes: stat.size,
      error: null,
    };
  } catch (error) {
    return {
      id: label,
      passed: false,
      durationMs:
        Date.now() - startedAt,
      path: relativePath,
      sizeBytes: 0,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

async function runAuthenticationSuite() {
  const startedAt =
    new Date().toISOString();

  const checks = [];

  checks.push(
    await fileCheck(
      "backend/package.json",
      "backend-package",
    ),
  );

  checks.push(
    await fileCheck(
      "backend/package-lock.json",
      "backend-lockfile",
    ),
  );

  for (const testPath of authenticationTests) {
    checks.push(
      await fileCheck(
        `backend/${testPath}`,
        `test-file-${path.basename(
          testPath,
          ".ts",
        )}`,
      ),
    );
  }

  checks.push(
    await runCommand({
      command: "npm",
      args: [
        "test",
        "--",
        "--runInBand",
        "--runTestsByPath",
        ...authenticationTests,
      ],
      cwd: backendRoot,
      label:
        "authentication-test-execution",
    }),
  );

  checks.push(
    await runCommand({
      command: "npm",
      args: [
        "run",
        "typecheck",
      ],
      cwd: backendRoot,
      label: "backend-typecheck",
    }),
  );

  const failed = checks.filter(
    (check) => !check.passed,
  );

  return {
    suiteId: "authentication",
    adapterVersion: 1,
    mode: "automated-code-precheck",
    startedAt,
    completedAt:
      new Date().toISOString(),
    discoveredTestFiles:
      authenticationTests.length,
    testFiles: authenticationTests,
    checks,
    summary: {
      checksTotal: checks.length,
      checksPassed:
        checks.length - failed.length,
      checksFailed: failed.length,
      checksBlocked: 0,
    },
    passed: failed.length === 0,
    safety: {
      servicesStarted: false,
      containersCreated: false,
      databaseCreated: false,
      migrationsExecuted: false,
      automatedTestsExecuted: true,
      liveAuthenticationExecuted: false,
      databaseMutated: false,
      evidenceStateMutated: false,
    },
  };
}

export {
  runAuthenticationSuite,
};
