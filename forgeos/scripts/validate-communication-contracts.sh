#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT"

test -x backend/node_modules/.bin/tsc || {
  echo "ERROR: backend TypeScript compiler is unavailable." >&2
  exit 1
}

rm -rf forgeos/packages/communication-contracts/dist

backend/node_modules/.bin/tsc \
  -p forgeos/packages/communication-contracts/tsconfig.json

test -f forgeos/packages/communication-contracts/dist/index.js
test -f forgeos/packages/communication-contracts/dist/index.d.ts

echo "FORGEOS_COMMUNICATION_CONTRACTS_VALIDATION_PASSED"
