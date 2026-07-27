#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { runInstallationSuite } from "../adapters/installation.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const fatRoot = path.resolve(path.dirname(scriptPath), "..");

const files = {
  contract: path.join(
    fatRoot,
    "contracts",
    "founder-acceptance-contract.json",
  ),
  manifest: path.join(
    fatRoot,
    "contracts",
    "founder-acceptance-suite-manifest.json",
  ),
  plan: path.join(
    fatRoot,
    "plans",
    "execution-plan.json",
  ),
  results: path.join(
    fatRoot,
    "evidence",
    "founder-acceptance-results.json",
  ),
  runtime: path.join(
    fatRoot,
    "runtime",
    "isolated-runtime-contract.json",
  ),
};

async function readJson(filePath) {
  try {
    return JSON.parse(
      await fs.readFile(filePath, "utf8"),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    throw new Error(
      `Unable to read FAT file ${filePath}: ${message}`,
    );
  }
}

async function loadContext() {
  const [
    contract,
    manifest,
    plan,
    results,
    runtime,
  ] = await Promise.all([
    readJson(files.contract),
    readJson(files.manifest),
    readJson(files.plan),
    readJson(files.results),
    readJson(files.runtime),
  ]);

  const requiredSuites = contract.requiredSuites;
  const manifestIds = manifest.suites.map(
    (suite) => suite.id,
  );

  if (
    JSON.stringify(requiredSuites) !==
    JSON.stringify(manifestIds)
  ) {
    throw new Error(
      "FAT suite manifest does not match the acceptance contract",
    );
  }

  if (
    JSON.stringify(requiredSuites) !==
    JSON.stringify(plan.executionOrder)
  ) {
    throw new Error(
      "FAT execution plan does not match the acceptance contract",
    );
  }

  return {
    contract,
    manifest,
    plan,
    results,
    runtime,
  };
}

function printUsage() {
  console.log(`
PropertyOS Founder Acceptance Runner

Usage:
  fat-runner.mjs list
  fat-runner.mjs status
  fat-runner.mjs precheck installation
  fat-runner.mjs run <suite-id>
  fat-runner.mjs run all

Current runner mode:
  Contract and authorization validation only.
  Suite execution remains blocked until explicitly authorized.
`.trim());
}

function printSuites(context) {
  const resultMap = new Map(
    context.results.suites.map(
      (result) => [result.suiteId, result],
    ),
  );

  console.log("PropertyOS Founder Acceptance Suites");
  console.log();

  context.manifest.suites.forEach((suite, index) => {
    const result = resultMap.get(suite.id);

    console.log(
      [
        `${String(index + 1).padStart(2, "0")}.`,
        suite.id.padEnd(24),
        suite.name.padEnd(34),
        `status=${result?.status ?? "UNKNOWN"}`,
      ].join(" "),
    );
  });

  console.log();
  console.log(
    `Total suites: ${context.manifest.suites.length}`,
  );
}

function printStatus(context) {
  const authorization = context.plan.authorization;
  const runtimeExecution = context.runtime.execution;
  const summary = context.results.summary;

  console.log("PropertyOS FAT Status");
  console.log();
  console.log(
    `Required suites:            ${summary.requiredSuites}`,
  );
  console.log(
    `Not-started suites:         ${summary.notStartedSuites}`,
  );
  console.log(
    `Passed suites:              ${summary.passedSuites}`,
  );
  console.log(
    `Failed suites:              ${summary.failedSuites}`,
  );
  console.log(
    `Blocked suites:             ${summary.blockedSuites}`,
  );
  console.log(
    `Execution authorized:       ${authorization.executionAuthorized}`,
  );
  console.log(
    `Database writes authorized: ${authorization.databaseWritesAuthorized}`,
  );
  console.log(
    `Runtime started:            ${runtimeExecution.servicesStarted}`,
  );
  console.log(
    `Database created:           ${runtimeExecution.databaseCreated}`,
  );
  console.log(
    `Migrations executed:        ${runtimeExecution.migrationsExecuted}`,
  );
  console.log(
    `Production authorized:      ${authorization.productionExecutionAuthorized}`,
  );
}

function validateSuiteId(context, suiteId) {
  const validIds = new Set(
    context.contract.requiredSuites,
  );

  if (suiteId !== "all" && !validIds.has(suiteId)) {
    throw new Error(
      `Unknown FAT suite: ${suiteId}`,
    );
  }
}

function assertExecutionAuthorized(context) {
  const planAuthorization = context.plan.authorization;
  const runtimeAuthorization =
    context.runtime.authorization;

  const blockers = [];

  if (!planAuthorization.executionAuthorized) {
    blockers.push(
      "execution-plan authorization is false",
    );
  }

  if (!planAuthorization.databaseWritesAuthorized) {
    blockers.push(
      "execution-plan database-write authorization is false",
    );
  }

  if (!runtimeAuthorization.runtimeStartAuthorized) {
    blockers.push(
      "runtime-start authorization is false",
    );
  }

  if (
    !runtimeAuthorization.acceptanceExecutionAuthorized
  ) {
    blockers.push(
      "runtime acceptance authorization is false",
    );
  }

  if (blockers.length > 0) {
    throw new Error(
      [
        "FAT execution is blocked by contract:",
        ...blockers.map((blocker) => `- ${blocker}`),
      ].join("\n"),
    );
  }
}

async function main() {
  const [, , command = "help", argument] =
    process.argv;

  if (
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    printUsage();
    return;
  }

  const context = await loadContext();

  if (command === "list") {
    printSuites(context);
    return;
  }

  if (command === "status") {
    printStatus(context);
    return;
  }

  if (command === "precheck") {
    if (!argument) {
      throw new Error(
        "Suite ID is required: precheck <suite-id>",
      );
    }

    validateSuiteId(context, argument);

    if (argument !== "installation") {
      throw new Error(
        `No read-only precheck adapter installed for: ${argument}`,
      );
    }

    const report = await runInstallationSuite();

    console.log(
      JSON.stringify(report, null, 2),
    );

    if (!report.passed) {
      process.exitCode = 1;
    }

    return;
  }

  if (command === "run") {
    if (!argument) {
      throw new Error(
        "Suite ID is required: run <suite-id|all>",
      );
    }

    validateSuiteId(context, argument);
    assertExecutionAuthorized(context);

    throw new Error(
      "Executable suite adapters have not yet been installed",
    );
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error();
  console.error("FAT RUNNER ERROR");
  console.error(
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
