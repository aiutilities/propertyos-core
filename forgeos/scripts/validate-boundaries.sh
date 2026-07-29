#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FORGEOS_ROOT="$ROOT/forgeos"

fail() {
  echo "FORGEOS_BOUNDARY_ERROR: $1" >&2
  exit 1
}

test -d "$FORGEOS_ROOT" ||
  fail "ForgeOS workspace does not exist"

FORBIDDEN_IMPORTS="$(
  grep -RInE \
    --include='*.ts' \
    --include='*.tsx' \
    --include='*.js' \
    --include='*.mjs' \
    "(backend/src/plugins|src/plugins|@propertyos/)" \
    "$FORGEOS_ROOT" \
    2>/dev/null || true
)"

test -z "$FORBIDDEN_IMPORTS" || {
  echo "$FORBIDDEN_IMPORTS" >&2
  fail "ForgeOS contains a forbidden PropertyOS dependency"
}

echo "FORGEOS_BOUNDARY_VALIDATION_PASSED"
