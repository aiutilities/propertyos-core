import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const adapterPath =
  fileURLToPath(import.meta.url);

const repositoryRoot =
  path.resolve(
    path.dirname(adapterPath),
    "..",
    "..",
    "..",
  );

const backendRoot =
  path.join(
    repositoryRoot,
    "backend",
  );

const inventoryTests = [
  "src/core/inventory/" +
    "inventory-idempotency-wiring.integration-spec.ts",
  "src/core/inventory/services/" +
    "inventory-posting-metrics.service.integration-spec.ts",
];

function runCommand({
  command,
  args,
  cwd,
  label,
}) {
  return new Promise((resolve) => {
    const startedAt =
      Date.now();

    const child =
      spawn(
        command,
        args,
        {
          cwd,
          env: process.env,
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        },
      );

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

    child.stdout.on(
      "data",
      (chunk) => {
        stdout +=
          chunk.toString();
      },
    );

    child.stderr.on(
      "data",
      (chunk) => {
        stderr +=
          chunk.toString();
      },
    );

    child.on(
      "error",
      (error) => {
        finish({
          id: label,
          passed: false,
          durationMs:
            Date.now() -
            startedAt,
          command:
            [
              command,
              ...args,
            ].join(" "),
          exitCode: null,
          stdout,
          stderr,
          error: error.message,
        });
      },
    );

    child.on(
      "close",
      (code) => {
        finish({
          id: label,
          passed: code === 0,
          durationMs:
            Date.now() -
            startedAt,
          command:
            [
              command,
              ...args,
            ].join(" "),
          exitCode: code,
          stdout,
          stderr,
          error:
            code === 0
              ? null
              : `exit code ${code}`,
        });
      },
    );
  });
}

async function runInventorySuite() {
  const startedAt =
    new Date().toISOString();

  const checks = [];

  checks.push(
    await runCommand({
      command: "npm",
      args: [
        "test",
        "--",
        "--runInBand",
        "--runTestsByPath",
        ...inventoryTests,
      ],
      cwd: backendRoot,
      label:
        "inventory-test-execution",
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
      label:
        "backend-typecheck",
    }),
  );

  const failed =
    checks.filter(
      (check) =>
        !check.passed,
    );

  return {
    suiteId: "inventory",
    adapterVersion: 1,
    mode:
      "automated-code-precheck",
    startedAt,
    completedAt:
      new Date().toISOString(),
    discoveredTestFiles:
      inventoryTests.length,
    testFiles:
      inventoryTests,
    checks,
    summary: {
      checksTotal:
        checks.length,
      checksPassed:
        checks.length -
        failed.length,
      checksFailed:
        failed.length,
      checksBlocked: 0,
    },
    passed:
      failed.length === 0,
    coverage: {
      itemLifecycleContract:
        false,
      storeAndBinContract:
        false,
      goodsReceiptPostingContract:
        false,
      stockTransferContract:
        false,
      materialIssueContract:
        false,
      materialReturnContract:
        false,
      stockAdjustmentContract:
        false,
      reservationAllocationContract:
        false,
      batchTrackingContract:
        false,
      insufficientStockRejection:
        false,
      httpIdempotency:
        false,
      idempotencyWiring:
        true,
      postingMetrics:
        true,
    },
    safety: {
      servicesStarted: false,
      containersCreated: false,
      databaseCreated: false,
      migrationsExecuted: false,
      automatedTestsExecuted: true,
      liveInventoryOperationsExecuted:
        false,
      databaseMutated: false,
      evidenceStateMutated: false,
    },
  };
}

export {
  runInventorySuite,
};
