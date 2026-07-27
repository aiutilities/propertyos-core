import fs from "node:fs/promises";
import net from "node:net";
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

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        id: label,
        passed: false,
        durationMs: Date.now() - startedAt,
        command: [command, ...args].join(" "),
        stdout,
        stderr,
        error: error.message,
      });
    });

    child.on("close", (code) => {
      resolve({
        id: label,
        passed: code === 0,
        durationMs: Date.now() - startedAt,
        command: [command, ...args].join(" "),
        exitCode: code,
        stdout,
        stderr,
        error: code === 0 ? null : `exit code ${code}`,
      });
    });
  });
}

async function fileCheck(relativePath, label) {
  const startedAt = Date.now();
  const absolutePath = path.join(
    repositoryRoot,
    relativePath,
  );

  try {
    const stat = await fs.stat(absolutePath);

    return {
      id: label,
      passed: stat.isFile() && stat.size > 0,
      durationMs: Date.now() - startedAt,
      path: relativePath,
      sizeBytes: stat.size,
      error: null,
    };
  } catch (error) {
    return {
      id: label,
      passed: false,
      durationMs: Date.now() - startedAt,
      path: relativePath,
      sizeBytes: 0,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

function checkPortAvailable(port, label) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const server = net.createServer();

    server.unref();

    server.once("error", (error) => {
      resolve({
        id: label,
        passed: false,
        durationMs: Date.now() - startedAt,
        port,
        error: error.message,
      });
    });

    server.listen(
      {
        host: "127.0.0.1",
        port,
        exclusive: true,
      },
      () => {
        server.close(() => {
          resolve({
            id: label,
            passed: true,
            durationMs: Date.now() - startedAt,
            port,
            error: null,
          });
        });
      },
    );
  });
}

async function runInstallationSuite() {
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

  checks.push(
    await fileCheck(
      "frontend/package.json",
      "frontend-package",
    ),
  );

  checks.push(
    await fileCheck(
      "frontend/package-lock.json",
      "frontend-lockfile",
    ),
  );

  checks.push(
    await runCommand({
      command: "npm",
      args: ["run", "build"],
      cwd: path.join(repositoryRoot, "backend"),
      label: "backend-build",
    }),
  );

  checks.push(
    await fileCheck(
      "backend/dist/main.js",
      "backend-entry-point",
    ),
  );

  checks.push(
    await fileCheck(
      "backend/dist/scheduler-worker.js",
      "scheduler-entry-point",
    ),
  );

  checks.push(
    await runCommand({
      command: "npm",
      args: ["run", "build"],
      cwd: path.join(repositoryRoot, "frontend"),
      label: "frontend-build",
    }),
  );

  for (const validator of [
    "validate-fat-contract.py",
    "validate-fat-checklists.py",
    "validate-fat-evidence.py",
    "validate-fat-execution.py",
    "validate-fat-runtime.py",
    "validate-fat-preflight.py",
    "validate-fat-runner.py",
  ]) {
    checks.push(
      await runCommand({
        command: path.join(
          repositoryRoot,
          "operations",
          "fat",
          "scripts",
          validator,
        ),
        args: [],
        cwd: repositoryRoot,
        label: validator.replace(".py", ""),
      }),
    );
  }

  checks.push(
    await checkPortAvailable(
      3019,
      "fat-api-port-available",
    ),
  );

  checks.push(
    await checkPortAvailable(
      3020,
      "fat-frontend-port-available",
    ),
  );

  checks.push(
    await checkPortAvailable(
      5439,
      "fat-postgres-port-available",
    ),
  );

  const failed = checks.filter(
    (check) => !check.passed,
  );

  return {
    suiteId: "installation",
    adapterVersion: 1,
    mode: "read-only-precheck",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
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
      testsExecuted: true,
      databaseMutated: false,
      evidenceStateMutated: false,
    },
  };
}

export {
  runInstallationSuite,
};
