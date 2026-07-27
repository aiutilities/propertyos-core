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

const procurementTests = [
  "src/core/procurement/procurement-idempotency-wiring.integration-spec.ts",
  "src/core/procurement/services/procurement-transition-metrics.service.integration-spec.ts",
  "src/core/procurement/services/purchase-request.service.integration-spec.ts",
  "src/core/procurement/services/procurement-rfq.service.integration-spec.ts",
  "src/core/procurement/services/procurement-quotation.service.integration-spec.ts",
  "src/core/procurement/services/procurement-purchase-order.service.integration-spec.ts",
  "src/core/procurement/services/procurement-goods-receipt.service.integration-spec.ts",
  "src/core/procurement/services/procurement-goods-receipt-posting.integration-spec.ts",
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

async function runProcurementSuite() {
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
        ...procurementTests,
      ],
      cwd: backendRoot,
      label:
        "procurement-test-execution",
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
    suiteId: "procurement",
    adapterVersion: 1,
    mode:
      "automated-code-precheck",
    startedAt,
    completedAt:
      new Date().toISOString(),
    discoveredTestFiles:
      procurementTests.length,
    testFiles:
      procurementTests,
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
      purchaseRequestContract:
        true,
      httpIdempotency:
        false,
      idempotencyWiring:
        true,
      transitionMetrics:
        true,
      rfqLifecycleContract:
        true,
      quotationLifecycleContract:
        true,
      purchaseOrderLifecycleContract:
        true,
      goodsReceiptLifecycleContract:
        false,
      invoiceMatchLifecycleContract:
        false,
      paymentRequestLifecycleContract:
        false,
    },
    safety: {
      servicesStarted: false,
      containersCreated: false,
      databaseCreated: false,
      migrationsExecuted: false,
      automatedTestsExecuted: true,
      liveProcurementOperationsExecuted:
        false,
      databaseMutated: false,
      evidenceStateMutated: false,
    },
  };
}

export {
  runProcurementSuite,
};
