#!/usr/bin/env node

import {
  randomBytes,
} from "node:crypto";
import {
  spawnSync,
} from "node:child_process";
import {
  chmod,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  resolve,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";

const currentFile =
  fileURLToPath(import.meta.url);

const root = resolve(
  dirname(currentFile),
  "../../..",
);

const authorizationPath = resolve(
  root,
  "operations/fat/authorization/" +
    "procurement-runtime-authorization.json",
);

const planPath = resolve(
  root,
  "operations/fat/plans/execution-plan.json",
);

const runtimePath = resolve(
  root,
  "operations/fat/runtime/" +
    "isolated-runtime-contract.json",
);

const readinessPath = resolve(
  root,
  "operations/fat/readiness/" +
    "isolated-execution-readiness.json",
);

const composePath = resolve(
  root,
  "operations/fat/templates/" +
    "docker-compose.fat.template.yml",
);

const backendRoot = resolve(
  root,
  "backend",
);

const testPath =
  "src/core/procurement/" +
  "procurement-http-idempotency.integration-spec.ts";

const evidencePath = resolve(
  root,
  "operations/fat/evidence/" +
    "procurement-runtime-results.json",
);

const temporaryEnvPath =
  "/tmp/propertyos-fat-procurement.env";

const composeProject =
  "propertyos-fat-procurement";

async function loadJson(path) {
  return JSON.parse(
    await readFile(
      path,
      "utf8",
    ),
  );
}

async function saveJson(
  path,
  value,
) {
  await writeFile(
    path,
    JSON.stringify(
      value,
      null,
      2,
    ) + "\n",
  );
}

function runCommand({
  command,
  args,
  cwd = root,
  env = process.env,
  label,
  allowFailure = false,
}) {
  const startedAt =
    new Date().toISOString();

  const started =
    Date.now();

  const result = spawnSync(
    command,
    args,
    {
      cwd,
      env,
      encoding: "utf8",
      maxBuffer:
        32 * 1024 * 1024,
    },
  );

  const completedAt =
    new Date().toISOString();

  const exitCode =
    result.status ?? 1;

  const record = {
    label,
    command:
      [command, ...args].join(" "),
    cwd,
    startedAt,
    completedAt,
    durationMs:
      Date.now() - started,
    exitCode,
    passed:
      exitCode === 0,
    stdout:
      result.stdout ?? "",
    stderr:
      result.stderr ?? "",
    error:
      result.error
        ? String(
            result.error.message ??
              result.error,
          )
        : null,
  };

  if (
    !record.passed &&
    !allowFailure
  ) {
    const error =
      new Error(
        `${label} failed with exit code ${exitCode}`,
      );

    error.commandRecord =
      record;

    throw error;
  }

  return record;
}

function composeArgs(
  envPath,
  additional,
) {
  return [
    "compose",
    "--project-name",
    composeProject,
    "--env-file",
    envPath,
    "-f",
    composePath,
    ...additional,
  ];
}

async function assertAuthorization() {
  const authorization =
    await loadJson(
      authorizationPath,
    );

  const plan =
    await loadJson(
      planPath,
    );

  const runtime =
    await loadJson(
      runtimePath,
    );

  const readiness =
    await loadJson(
      readinessPath,
    );

  if (
    authorization.status !==
    "AUTHORIZED_FOR_ISOLATED_EXECUTION"
  ) {
    throw new Error(
      "Procurement runtime authorization is not active",
    );
  }

  const requiredAuthorization = [
    "founderAuthorizationRecorded",
    "runtimeStartAuthorized",
    "databaseCreationAuthorized",
    "migrationExecutionAuthorized",
    "databaseWritesAuthorized",
    "acceptanceExecutionAuthorized",
  ];

  for (
    const key
    of requiredAuthorization
  ) {
    if (
      authorization.authorization[
        key
      ] !== true
    ) {
      throw new Error(
        `Authorization is false: ${key}`,
      );
    }
  }

  if (
    authorization.authorization
      .productionExecutionAuthorized !==
      false ||
    authorization.authorization
      .publicReleaseAuthorized !==
      false
  ) {
    throw new Error(
      "Production or public-release authorization detected",
    );
  }

  if (
    plan.authorization
      .executionAuthorized !== true ||
    plan.authorization
      .databaseWritesAuthorized !==
      true ||
    plan.activeAuthorization
      ?.suiteId !== "procurement"
  ) {
    throw new Error(
      "Execution plan is not authorized for Procurement",
    );
  }

  if (
    runtime.authorization
      .runtimeStartAuthorized !==
      true ||
    runtime.authorization
      .databaseCreationAuthorized !==
      true ||
    runtime.authorization
      .migrationExecutionAuthorized !==
      true ||
    runtime.authorization
      .databaseWritesAuthorized !==
      true ||
    runtime.authorization
      .acceptanceExecutionAuthorized !==
      true ||
    runtime.activeAuthorization
      ?.suiteId !== "procurement"
  ) {
    throw new Error(
      "Runtime contract is not authorized for Procurement",
    );
  }

  if (
    readiness.authorization
      .acceptanceExecutionAuthorized !==
      true ||
    readiness.authorization
      .databaseWritesAuthorized !==
      true ||
    readiness.activeAuthorization
      ?.suiteId !== "procurement"
  ) {
    throw new Error(
      "Execution readiness is not authorized for Procurement",
    );
  }

  return {
    authorization,
    plan,
    runtime,
    readiness,
  };
}

function buildExecutionPlan() {
  return {
    suiteId:
      "procurement",
    mode:
      "isolated-runtime",
    expectedTests:
      13,
    composeProject,
    composeFile:
      composePath,
    database: {
      host:
        "127.0.0.1",
      port:
        5439,
      name:
        "propertyos_fat",
      user:
        "propertyos_fat",
    },
    sequence: [
      "verify-authorization",
      "verify-docker",
      "verify-empty-runtime-scope",
      "create-temporary-environment",
      "start-postgres-fat",
      "wait-for-postgres-health",
      "run-migrate-fat",
      "run-procurement-http-idempotency-tests",
      "capture-evidence",
      "teardown-runtime",
      "delete-temporary-environment",
    ],
    safety: {
      productionExecution:
        false,
      publicRelease:
        false,
      syntheticDataOnly:
        true,
      persistentDatabase:
        false,
      teardownRequired:
        true,
      authorizationRevocationRequired:
        true,
    },
  };
}

async function createTemporaryEnvironment() {
  const password =
    randomBytes(24)
      .toString("hex");

  const authSecret =
    randomBytes(32)
      .toString("hex");

  const content = [
    "POSTGRES_DB=propertyos_fat",
    "POSTGRES_USER=propertyos_fat",
    `POSTGRES_PASSWORD=${password}`,
    `AUTH_SECRET=${authSecret}`,
    "",
  ].join("\n");

  await writeFile(
    temporaryEnvPath,
    content,
    {
      mode:
        0o600,
    },
  );

  await chmod(
    temporaryEnvPath,
    0o600,
  );

  return {
    password,
    authSecret,
  };
}

function verifyNoExistingResources() {
  const containers =
    runCommand({
      command:
        "docker",
      args: [
        "ps",
        "-a",
        "--filter",
        "name=propertyos-fat-",
        "--format",
        "{{.Names}}",
      ],
      label:
        "verify-no-fat-containers",
    });

  if (
    containers.stdout.trim() !== ""
  ) {
    throw new Error(
      "Pre-existing FAT containers detected",
    );
  }

  const projectContainers =
    runCommand({
      command:
        "docker",
      args: [
        "ps",
        "-a",
        "--filter",
        `label=com.docker.compose.project=${composeProject}`,
        "--format",
        "{{.Names}}",
      ],
      label:
        "verify-no-project-containers",
    });

  if (
    projectContainers.stdout.trim() !==
      ""
  ) {
    throw new Error(
      "Pre-existing Procurement FAT project detected",
    );
  }

  return [
    containers,
    projectContainers,
  ];
}

async function waitForPostgres() {
  const checks = [];

  for (
    let attempt = 1;
    attempt <= 60;
    attempt += 1
  ) {
    const check =
      runCommand({
        command:
          "docker",
        args: [
          "inspect",
          "--format",
          "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
          "propertyos-fat-postgres",
        ],
        label:
          `postgres-health-${attempt}`,
        allowFailure:
          true,
      });

    checks.push(
      check,
    );

    if (
      check.exitCode === 0 &&
      check.stdout.trim() ===
        "healthy"
    ) {
      return checks;
    }

    await new Promise(
      (resolvePromise) =>
        setTimeout(
          resolvePromise,
          2000,
        ),
    );
  }

  throw new Error(
    "PostgreSQL did not become healthy",
  );
}

async function teardown(
  records,
) {
  if (
    await fileExists(
      temporaryEnvPath,
    )
  ) {
    records.push(
      runCommand({
        command:
          "docker",
        args:
          composeArgs(
            temporaryEnvPath,
            [
              "down",
              "--volumes",
              "--remove-orphans",
            ],
          ),
        label:
          "teardown-fat-runtime",
        allowFailure:
          true,
      }),
    );
  }

  await rm(
    temporaryEnvPath,
    {
      force:
        true,
    },
  );
}

async function fileExists(path) {
  try {
    await readFile(
      path,
    );

    return true;
  } catch {
    return false;
  }
}

async function writeEvidence(
  evidence,
) {
  await mkdir(
    dirname(
      evidencePath,
    ),
    {
      recursive:
        true,
    },
  );

  await saveJson(
    evidencePath,
    evidence,
  );
}

async function runProcurementRuntimeSuite({
  execute = false,
} = {}) {
  const plan =
    buildExecutionPlan();

  const context =
    await assertAuthorization();

  if (!execute) {
    return {
      ...plan,
      executable:
        true,
      executed:
        false,
      authorizationVerified:
        true,
      productionAuthorized:
        false,
      databaseMutated:
        false,
    };
  }

  const startedAt =
    new Date().toISOString();

  const records = [];

  let testsPassed =
    false;

  let migrationsExecuted =
    false;

  let databaseMutated =
    false;

  let runtimeError =
    null;

  try {
    records.push(
      runCommand({
        command:
          "docker",
        args: [
          "info",
        ],
        label:
          "docker-readiness",
      }),
    );

    records.push(
      ...verifyNoExistingResources(),
    );

    const secrets =
      await createTemporaryEnvironment();

    records.push(
      runCommand({
        command:
          "docker",
        args:
          composeArgs(
            temporaryEnvPath,
            [
              "up",
              "-d",
              "postgres-fat",
            ],
          ),
        label:
          "start-postgres-fat",
      }),
    );

    records.push(
      ...await waitForPostgres(),
    );

    records.push(
      runCommand({
        command:
          "docker",
        args:
          composeArgs(
            temporaryEnvPath,
            [
              "--profile",
              "authorized-fat-migration",
              "run",
              "--rm",
              "migrate-fat",
            ],
          ),
        label:
          "run-fat-migrations",
      }),
    );

    migrationsExecuted =
      true;

    databaseMutated =
      true;

    const testEnvironment = {
      ...process.env,
      NODE_ENV:
        "test",
      POSTGRES_HOST:
        "127.0.0.1",
      POSTGRES_PORT:
        "5439",
      POSTGRES_DB:
        "propertyos_fat",
      POSTGRES_USER:
        "propertyos_fat",
      POSTGRES_PASSWORD:
        secrets.password,
      AUTH_SECRET:
        secrets.authSecret,
    };

    const tests =
      runCommand({
        command:
          "npm",
        args: [
          "test",
          "--",
          "--runInBand",
          "--runTestsByPath",
          testPath,
        ],
        cwd:
          backendRoot,
        env:
          testEnvironment,
        label:
          "procurement-http-idempotency-tests",
      });

    records.push(
      tests,
    );

    testsPassed =
      true;
  } catch (error) {
    runtimeError = {
      name:
        error instanceof Error
          ? error.name
          : "Error",
      message:
        error instanceof Error
          ? error.message
          : String(error),
      commandRecord:
        error?.commandRecord ??
        null,
    };
  } finally {
    await teardown(
      records,
    );
  }

  const completedAt =
    new Date().toISOString();

  const evidence = {
    schemaVersion:
      1,
    phase:
      "19",
    artifact:
      "procurement-isolated-runtime-result",
    suiteId:
      "procurement",
    status:
      testsPassed
        ? "PASSED"
        : "FAILED",
    startedAt,
    completedAt,
    authorization: {
      authorizedAt:
        context.authorization
          .authorizationMetadata
          .authorizedAt,
      scope:
        "isolated-procurement-runtime-only",
      productionExecutionAuthorized:
        false,
      publicReleaseAuthorized:
        false,
    },
    runtime: {
      composeProject,
      postgresHost:
        "127.0.0.1",
      postgresPort:
        5439,
      databaseName:
        "propertyos_fat",
      migrationsExecuted,
      testsExecuted:
        records.some(
          (record) =>
            record.label ===
            "procurement-http-idempotency-tests",
        ),
      testsPassed,
      expectedTests:
        13,
      databaseMutated,
      teardownAttempted:
        true,
      temporaryEnvironmentRemoved:
        !await fileExists(
          temporaryEnvPath,
        ),
    },
    commands:
      records,
    error:
      runtimeError,
  };

  await writeEvidence(
    evidence,
  );

  if (!testsPassed) {
    const error =
      new Error(
        "Procurement isolated runtime acceptance failed",
      );

    error.evidence =
      evidence;

    throw error;
  }

  return evidence;
}

async function main() {
  const command =
    process.argv[2] ??
    "describe";

  if (
    command === "describe" ||
    command === "plan"
  ) {
    console.log(
      JSON.stringify(
        await runProcurementRuntimeSuite({
          execute:
            false,
        }),
        null,
        2,
      ),
    );

    return;
  }

  if (
    command === "execute"
  ) {
    console.log(
      JSON.stringify(
        await runProcurementRuntimeSuite({
          execute:
            true,
        }),
        null,
        2,
      ),
    );

    return;
  }

  throw new Error(
    `Unknown command: ${command}`,
  );
}

if (
  process.argv[1] &&
  resolve(
    process.argv[1],
  ) === currentFile
) {
  main().catch(
    (error) => {
      console.error();
      console.error(
        "PROCUREMENT RUNTIME ADAPTER ERROR",
      );
      console.error(
        error instanceof Error
          ? error.message
          : String(error),
      );
      process.exitCode =
        1;
    },
  );
}

export {
  buildExecutionPlan,
  runProcurementRuntimeSuite,
};
