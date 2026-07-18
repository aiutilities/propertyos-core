"use strict";

const fs = require("fs");
const path = require("path");

function findBackendRoot() {
  const candidates = [
    path.resolve(__dirname, "../../.."),
    path.resolve(__dirname, ".."),
  ];

  for (const candidate of candidates) {
    if (
      fs.existsSync(
        path.join(candidate, "package.json"),
      ) &&
      fs.existsSync(
        path.join(candidate, "src"),
      )
    ) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to locate the PropertyOS backend root " +
      "for @propertyos/core-contracts.",
  );
}

const backendRoot = findBackendRoot();

const compiledFacade = path.join(
  backendRoot,
  "dist",
  "core",
  "plugin",
  "runtime",
  "core-contracts.js",
);

const sourceFacade = path.join(
  backendRoot,
  "src",
  "core",
  "plugin",
  "runtime",
  "core-contracts.ts",
);

const typescriptRuntimeActive =
  process.env.JEST_WORKER_ID !== undefined ||
  typeof require.extensions[".ts"] === "function" ||
  Boolean(
    process[
      Symbol.for("ts-node.register.instance")
    ],
  );

if (
  typescriptRuntimeActive &&
  fs.existsSync(sourceFacade)
) {
  module.exports = require(sourceFacade);
} else if (fs.existsSync(compiledFacade)) {
  module.exports = require(compiledFacade);
} else if (fs.existsSync(sourceFacade)) {
  throw new Error(
    "PropertyOS is running from TypeScript source, but no " +
      "TypeScript runtime hook is active for " +
      "@propertyos/core-contracts.",
  );
} else {
  throw new Error(
    "PropertyOS core-contract runtime facade was not found.",
  );
}
