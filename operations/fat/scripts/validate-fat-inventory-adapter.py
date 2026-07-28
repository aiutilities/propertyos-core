#!/usr/bin/env python3

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

RUNNER = (
    ROOT
    / "scripts"
    / "fat-runner.mjs"
)

ADAPTER = (
    ROOT
    / "adapters"
    / "inventory.mjs"
)

EXPECTED_TEST_FILES = [
    (
        "src/core/inventory/"
        "inventory-idempotency-wiring.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-posting-metrics.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-unit-of-measure.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-category.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-brand.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-item.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-store.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-bin.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-stock-balance.service.integration-spec.ts"
    ),
    (
        "src/core/procurement/services/"
        "procurement-inventory-posting.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-stock-transfer-foundation.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-stock-transfer-dispatch.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-stock-transfer-receive.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-material-issue-foundation.service.integration-spec.ts"
    ),
    (
        "src/core/inventory/services/"
        "inventory-material-issue-posting.service.integration-spec.ts"
    ),
]


def main() -> None:
    assert RUNNER.is_file()
    assert ADAPTER.is_file()

    for relative_path in EXPECTED_TEST_FILES:
        test_path = (
            ROOT.parent.parent
            / "backend"
            / relative_path
        )

        assert test_path.is_file(), test_path

    for script in [
        RUNNER,
        ADAPTER,
    ]:
        syntax = subprocess.run(
            [
                "node",
                "--check",
                str(script),
            ],
            check=False,
            capture_output=True,
            text=True,
        )

        assert syntax.returncode == 0, (
            syntax.stderr
        )

    result = subprocess.run(
        [
            "node",
            str(RUNNER),
            "precheck",
            "inventory",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        result.stderr or result.stdout
    )

    report = json.loads(
        result.stdout
    )

    assert report["suiteId"] == (
        "inventory"
    )

    assert report["adapterVersion"] == 1

    assert report["mode"] == (
        "automated-code-precheck"
    )

    assert (
        report["discoveredTestFiles"]
        == 15
    )

    assert report["testFiles"] == (
        EXPECTED_TEST_FILES
    )

    assert report["summary"] == {
        "checksTotal": 2,
        "checksPassed": 2,
        "checksFailed": 0,
        "checksBlocked": 0,
    }

    assert report["passed"] is True

    assert report["coverage"] == {
        "unitOfMeasureLifecycleContract": True,
        "categoryLifecycleContract": True,
        "brandLifecycleContract": True,
        "itemLifecycleContract": True,
        "storeLifecycleContract": True,
        "binLifecycleContract": True,
        "storeAndBinContract": True,
        "stockBalanceContract": True,
        "goodsReceiptPostingContract": True,
        "stockTransferFoundationContract": True,
        "stockTransferDispatchContract": True,
        "stockTransferReceiveContract": True,
        "stockTransferContract": True,
        "materialIssueFoundationContract": True,
        "materialIssuePostingContract": True,
        "materialIssueContract": True,
        "materialReturnContract": False,
        "stockAdjustmentContract": False,
        "reservationAllocationContract": False,
        "batchTrackingContract": False,
        "insufficientStockRejection": False,
        "httpIdempotency": False,
        "idempotencyWiring": True,
        "postingMetrics": True,
    }

    assert report["safety"] == {
        "servicesStarted": False,
        "containersCreated": False,
        "databaseCreated": False,
        "migrationsExecuted": False,
        "automatedTestsExecuted": True,
        "liveInventoryOperationsExecuted": False,
        "databaseMutated": False,
        "evidenceStateMutated": False,
    }

    print(
        "FAT Inventory foundation: VALID"
    )
    print(
        "Test files discovered:    15"
    )
    print(
        "Adapter checks passed:    2"
    )
    print(
        "Idempotency wiring:        true"
    )
    print(
        "Posting metrics:           true"
    )
    print(
        "Unit of Measure contract:  true"
    )
    print(
        "Category contract:         true"
    )
    print(
        "Brand contract:            true"
    )
    print(
        "Item contract:             true"
    )
    print(
        "Store contract:            true"
    )
    print(
        "Bin contract:              true"
    )
    print(
        "Store and Bin contract:    true"
    )
    print(
        "Stock Balance contract:    true"
    )
    print(
        "Goods Receipt posting:     true"
    )
    print(
        "Transfer foundation:       true"
    )
    print(
        "Transfer dispatch:         true"
    )
    print(
        "Transfer receive:          true"
    )
    print(
        "Transfer lifecycle:        true"
    )
    print(
        "Material Issue foundation: true"
    )
    print(
        "Material Issue posting:    true"
    )
    print(
        "Material Issue lifecycle:  true"
    )
    print(
        "Lifecycle contracts done:  13"
    )
    print(
        "Database mutated:          false"
    )


if __name__ == "__main__":
    main()
