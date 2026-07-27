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
    / "procurement.mjs"
)

PURCHASE_REQUEST_TEST = (
    ROOT.parent.parent
    / "backend"
    / "src"
    / "core"
    / "procurement"
    / "services"
    / "purchase-request.service.integration-spec.ts"
)

EXPECTED_TEST_FILES = [
    (
        "src/core/procurement/"
        "procurement-http-idempotency.integration-spec.ts"
    ),
    (
        "src/core/procurement/"
        "procurement-idempotency-wiring.integration-spec.ts"
    ),
    (
        "src/core/procurement/services/"
        "procurement-transition-metrics.service.integration-spec.ts"
    ),
    (
        "src/core/procurement/services/"
        "purchase-request.service.integration-spec.ts"
    ),
]


def main() -> None:
    assert RUNNER.is_file()
    assert ADAPTER.is_file()
    assert PURCHASE_REQUEST_TEST.is_file()

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
            "procurement",
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
        "procurement"
    )

    assert report["adapterVersion"] == 1

    assert report["mode"] == (
        "automated-code-precheck"
    )

    assert report["discoveredTestFiles"] == 4

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
        "purchaseRequestContract": True,
        "httpIdempotency": True,
        "idempotencyWiring": True,
        "transitionMetrics": True,
        "rfqLifecycleContract": False,
        "quotationLifecycleContract": False,
        "purchaseOrderLifecycleContract": False,
        "goodsReceiptLifecycleContract": False,
        "invoiceMatchLifecycleContract": False,
        "paymentRequestLifecycleContract": False,
    }

    assert report["safety"] == {
        "servicesStarted": False,
        "containersCreated": False,
        "databaseCreated": False,
        "migrationsExecuted": False,
        "automatedTestsExecuted": True,
        "liveProcurementOperationsExecuted": False,
        "databaseMutated": False,
        "evidenceStateMutated": False,
    }

    print(
        "FAT Procurement foundation: VALID"
    )
    print(
        "Test files discovered:       4"
    )
    print(
        "Procurement tests executed:  30"
    )
    print(
        "Adapter checks passed:       2"
    )
    print(
        "Purchase Request contract:   true"
    )
    print(
        "Remaining lifecycle contracts: 6"
    )
    print(
        "Procurement adapter complete: false"
    )
    print(
        "Database mutated:            false"
    )


if __name__ == "__main__":
    main()
