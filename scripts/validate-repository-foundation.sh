#!/usr/bin/env bash

set -euo pipefail

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.." &&
  pwd
)"

cd "$ROOT"

REQUIRED_FILES=(
  README.md
  LICENSE
  NOTICE
  TRADEMARKS.md
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  SUPPORT.md
  GOVERNANCE.md
  MAINTAINERS.md
  CHANGELOG.md
  ROADMAP.md
  .github/PULL_REQUEST_TEMPLATE.md
  .github/ISSUE_TEMPLATE/bug_report.yml
  .github/ISSUE_TEMPLATE/feature_request.yml
  .github/ISSUE_TEMPLATE/documentation.yml
  .github/ISSUE_TEMPLATE/question.yml
  .github/ISSUE_TEMPLATE/config.yml
  .github/labels.yml
  .github/DISCUSSIONS.md
)

for file in "${REQUIRED_FILES[@]}"
do
  test -f "$file" || fail "Required repository file missing: $file"
done

test -d .github/DISCUSSION_TEMPLATE \
  || fail "Discussion template directory missing"

DISCUSSION_COUNT="$(
  find .github/DISCUSSION_TEMPLATE \
    -maxdepth 1 \
    -type f \
    -name '*.yml' |
  wc -l |
  tr -d ' '
)"

[ "$DISCUSSION_COUNT" -eq 8 ] \
  || fail "Expected 8 Discussion templates, found $DISCUSSION_COUNT"

grep -q 'Mozilla Public License' LICENSE \
  || fail "MPL licence identity missing"

grep -q '^# PropertyOS Governance$' GOVERNANCE.md \
  || fail "Governance heading missing"

grep -q '^# PropertyOS Maintainers$' MAINTAINERS.md \
  || fail "Maintainers heading missing"

grep -q '^# PropertyOS Security Policy$' SECURITY.md \
  || fail "Security heading missing"

grep -q '^# PropertyOS Support Policy$' SUPPORT.md \
  || fail "Support heading missing"

grep -q '^# Changelog$' CHANGELOG.md \
  || fail "Changelog heading missing"

grep -q '^# PropertyOS Roadmap$' ROADMAP.md \
  || fail "Roadmap heading missing"

grep -q 'v1.0.1' README.md \
  || fail "README release reference missing"

grep -q 'v1.0.1' CHANGELOG.md \
  || fail "CHANGELOG release reference missing"

grep -q 'v1.0.1' ROADMAP.md \
  || fail "ROADMAP release reference missing"

grep -q 'Cogzidel Technologies Pvt. Ltd.' NOTICE \
  || fail "NOTICE stewardship missing"

grep -q 'Cogzidel Technologies Pvt. Ltd.' GOVERNANCE.md \
  || fail "Governance stewardship missing"

grep -q 'Product freeze remains active' .github/DISCUSSIONS.md \
  || fail "Discussion product-freeze boundary missing"

grep -q 'unauthorized product feature' \
  .github/PULL_REQUEST_TEMPLATE.md \
  || fail "Pull-request freeze boundary missing"

DUPLICATE_LABELS="$(
  awk -F'"' '/^- name: "/ { print $2 }' .github/labels.yml |
  sort |
  uniq -d
)"

test -z "$DUPLICATE_LABELS" \
  || fail "Duplicate GitHub labels: $DUPLICATE_LABELS"

LABEL_COUNT="$(
  awk '/^- name: "/ { count++ } END { print count + 0 }' \
    .github/labels.yml
)"

[ "$LABEL_COUNT" -eq 58 ] \
  || fail "Expected 58 GitHub labels, found $LABEL_COUNT"

FOUNDATION_PATHS=(
  README.md
  LICENSE
  NOTICE
  TRADEMARKS.md
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  SECURITY.md
  SUPPORT.md
  GOVERNANCE.md
  MAINTAINERS.md
  CHANGELOG.md
  ROADMAP.md
  .github/ISSUE_TEMPLATE
  .github/DISCUSSION_TEMPLATE
  .github/PULL_REQUEST_TEMPLATE.md
  .github/DISCUSSIONS.md
  .github/labels.yml
  .github/dependabot.yml
  .github/workflows/repository-governance.yml
  .github/workflows/codeql.yml
  scripts/validate-repository-foundation.sh
)

EXISTING_FOUNDATION_PATHS=()

for item in "${FOUNDATION_PATHS[@]}"
do
  test -e "$item" || continue
  EXISTING_FOUNDATION_PATHS+=("$item")
done

if grep -RInE '[[:blank:]]$' "${EXISTING_FOUNDATION_PATHS[@]}"
then
  fail "Trailing whitespace detected in Repository Foundation files"
fi

if grep -RIn $'\r$' "${EXISTING_FOUNDATION_PATHS[@]}"
then
  fail "CRLF line endings detected in Repository Foundation files"
fi

git diff --check \
  || fail "Git whitespace validation failed"

echo
echo "============================================================"
echo "PROPERTYOS REPOSITORY FOUNDATION VALIDATION PASSED"
echo "============================================================"
echo "Required files       : ${#REQUIRED_FILES[@]}"
echo "Discussion templates : $DISCUSSION_COUNT"
echo "GitHub labels        : $LABEL_COUNT"
echo "Product source       : NOT MODIFIED"
echo "============================================================"
