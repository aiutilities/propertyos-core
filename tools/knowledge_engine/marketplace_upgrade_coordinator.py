from __future__ import annotations

import json
import os
import shutil
import tempfile
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, Mapping, Optional, Tuple

from packaging.version import InvalidVersion, Version

from .marketplace_install_transaction import (
    MarketplaceInstallTransaction,
    MarketplaceInstallTransactionRequest,
)
from .marketplace_runtime_activation import (
    MarketplaceRuntimePluginRecord,
    MarketplaceRuntimePluginState,
    MarketplaceRuntimeRegistry,
)


class MarketplaceUpgradeState(str, Enum):
    CREATED = "created"
    VALIDATING = "validating"
    DEACTIVATING = "deactivating"
    INSTALLING = "installing"
    ACTIVATING = "activating"
    COMMITTING = "committing"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceUpgradeRequest:
    plugin_id: str
    target_version: str
    source_directory: Path
    install_root: Path
    work_root: Path
    registry_path: Path
    journal_root: Path
    expected_files: Tuple[str, ...] = (
        "plugin.json",
        "dist/index.js",
    )
    allow_downgrade: bool = False


@dataclass(frozen=True)
class MarketplaceUpgradeIssue:
    code: str
    step: str
    message: str

    def sort_key(
        self,
    ) -> tuple[str, str, str]:
        return (
            self.step,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceUpgradeResult:
    transaction_id: str
    state: MarketplaceUpgradeState
    plugin_id: str
    previous_version: Optional[str]
    target_version: str
    journal_path: Path
    issues: Tuple[
        MarketplaceUpgradeIssue,
        ...,
    ]

    @property
    def succeeded(
        self,
    ) -> bool:
        return (
            self.state
            == MarketplaceUpgradeState.COMMITTED
        )


class MarketplaceUpgradeCoordinator:
    """
    Coordinates one installed plugin upgrade across:
    - installed files;
    - runtime activation state;
    - runtime registry;
    - rollback to the exact previous version on failure.

    The coordinator reuses the D1 install transaction for filesystem
    replacement and uses atomic runtime-registry writes.
    """

    def __init__(
        self,
        request: MarketplaceUpgradeRequest,
        *,
        transaction_id: Optional[str] = None,
        deactivate_hook: Optional[
            Callable[[str], None]
        ] = None,
        activate_hook: Optional[
            Callable[[str, str], None]
        ] = None,
        health_hook: Optional[
            Callable[[str, str], bool]
        ] = None,
        fault_hook: Optional[
            Callable[[str], None]
        ] = None,
    ) -> None:
        self.request = request
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._deactivate_hook = (
            deactivate_hook
            or (lambda plugin_id: None)
        )
        self._activate_hook = (
            activate_hook
            or (
                lambda plugin_id, version: None
            )
        )
        self._health_hook = (
            health_hook
            or (
                lambda plugin_id, version: True
            )
        )
        self._fault_hook = fault_hook

        self._state = MarketplaceUpgradeState.CREATED
        self._issues = []
        self._registry = MarketplaceRuntimeRegistry(
            request.registry_path
        )
        self._previous_registry = None
        self._previous_record = None
        self._previous_backup = None
        self._new_install_committed = False
        self._old_plugin_was_active = False

        self._transaction_root = (
            request.work_root
            / (
                "upgrade-"
                + self.transaction_id
            )
        )
        self._backup_root = (
            self._transaction_root
            / "previous-installation"
        )
        self._journal_path = (
            request.journal_root
            / (
                "upgrade-"
                + self.transaction_id
                + ".jsonl"
            )
        )

    def execute(
        self,
    ) -> MarketplaceUpgradeResult:
        self.request.work_root.mkdir(
            parents=True,
            exist_ok=True,
        )
        self.request.journal_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        if self._transaction_root.exists():
            raise RuntimeError(
                "Upgrade workspace already exists."
            )

        self._transaction_root.mkdir()
        self._record(
            "upgrade-transaction-created"
        )

        previous_version = None

        try:
            self._transition(
                MarketplaceUpgradeState.VALIDATING,
                "upgrade-validation-started",
            )

            previous_version = self._validate()
            self._record(
                "upgrade-validation-complete",
                {
                    "previousVersion": (
                        previous_version
                    ),
                    "targetVersion": (
                        self.request
                        .target_version
                    ),
                },
            )

            self._previous_registry = (
                self._registry.load()
            )
            self._previous_record = (
                self._previous_registry[
                    self.request.plugin_id
                ]
            )
            self._old_plugin_was_active = (
                self._previous_record.state
                == MarketplaceRuntimePluginState.ACTIVE
            )

            if self._old_plugin_was_active:
                self._transition(
                    MarketplaceUpgradeState.DEACTIVATING,
                    "upgrade-deactivation-started",
                )
                self._deactivate_hook(
                    self.request.plugin_id
                )
                self._record(
                    "previous-plugin-deactivated"
                )

            self._backup_previous_installation()

            self._transition(
                MarketplaceUpgradeState.INSTALLING,
                "upgrade-installation-started",
            )

            install_result = (
                MarketplaceInstallTransaction(
                    MarketplaceInstallTransactionRequest(
                        plugin_id=(
                            self.request.plugin_id
                        ),
                        version=(
                            self.request
                            .target_version
                        ),
                        source_directory=(
                            self.request
                            .source_directory
                        ),
                        install_root=(
                            self.request
                            .install_root
                        ),
                        work_root=(
                            self._transaction_root
                            / "install-transaction"
                        ),
                        expected_files=(
                            self.request
                            .expected_files
                        ),
                        overwrite=True,
                    ),
                    transaction_id=(
                        self.transaction_id
                        + "-install"
                    ),
                )
                .execute()
            )

            if not install_result.succeeded:
                raise RuntimeError(
                    "Upgrade install transaction failed."
                )

            self._new_install_committed = True
            self._invoke_fault(
                "after-install"
            )

            self._transition(
                MarketplaceUpgradeState.ACTIVATING,
                "upgrade-activation-started",
            )

            self._activate_hook(
                self.request.plugin_id,
                self.request.target_version,
            )

            if not self._health_hook(
                self.request.plugin_id,
                self.request.target_version,
            ):
                raise RuntimeError(
                    "Upgraded plugin health check failed."
                )

            self._record(
                "upgraded-plugin-activated"
            )
            self._invoke_fault(
                "after-activate"
            )

            self._transition(
                MarketplaceUpgradeState.COMMITTING,
                "upgrade-registry-commit-started",
            )

            updated = dict(
                self._previous_registry
            )
            updated[
                self.request.plugin_id
            ] = MarketplaceRuntimePluginRecord(
                plugin_id=(
                    self.request.plugin_id
                ),
                version=(
                    self.request.target_version
                ),
                install_path=str(
                    self.request.install_root
                    / self.request.plugin_id
                ),
                state=(
                    MarketplaceRuntimePluginState.ACTIVE
                    if self._old_plugin_was_active
                    else MarketplaceRuntimePluginState.INACTIVE
                ),
                activation_order=(
                    self._previous_record
                    .activation_order
                ),
            )

            self._invoke_fault(
                "before-registry-write"
            )
            self._registry.write(
                updated
            )
            self._invoke_fault(
                "after-registry-write"
            )

            self._transition(
                MarketplaceUpgradeState.COMMITTED,
                "upgrade-committed",
            )
        except Exception as error:
            self._issues.append(
                MarketplaceUpgradeIssue(
                    code="UPGRADE_FAILED",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "upgrade-error",
                {
                    "error": str(error),
                },
            )
            self._rollback()

        return MarketplaceUpgradeResult(
            transaction_id=(
                self.transaction_id
            ),
            state=self._state,
            plugin_id=(
                self.request.plugin_id
            ),
            previous_version=(
                previous_version
            ),
            target_version=(
                self.request.target_version
            ),
            journal_path=(
                self._journal_path
            ),
            issues=tuple(
                sorted(
                    self._issues,
                    key=(
                        lambda issue:
                        issue.sort_key()
                    ),
                )
            ),
        )

    def _validate(
        self,
    ) -> str:
        installed_path = (
            self.request.install_root
            / self.request.plugin_id
        )

        if not installed_path.is_dir():
            raise ValueError(
                "Installed plugin does not exist."
            )

        source_manifest = (
            self.request.source_directory
            / "plugin.json"
        )

        if not source_manifest.is_file():
            raise ValueError(
                "Upgrade source manifest is missing."
            )

        source_data = json.loads(
            source_manifest.read_text(
                encoding="utf-8"
            )
        )

        if (
            str(
                source_data.get(
                    "id",
                    "",
                )
            )
            != self.request.plugin_id
        ):
            raise ValueError(
                "Upgrade source plugin ID mismatch."
            )

        source_version = str(
            source_data.get(
                "version",
                self.request.target_version,
            )
        )

        if (
            source_version
            != self.request.target_version
        ):
            raise ValueError(
                "Upgrade source version mismatch."
            )

        registry = self._registry.load()

        if self.request.plugin_id not in registry:
            raise ValueError(
                "Installed plugin is absent from runtime registry."
            )

        previous = registry[
            self.request.plugin_id
        ]

        try:
            previous_version = Version(
                previous.version
            )
            target_version = Version(
                self.request.target_version
            )
        except InvalidVersion as error:
            raise ValueError(
                str(error)
            )

        if (
            target_version
            < previous_version
            and not self.request.allow_downgrade
        ):
            raise ValueError(
                "Downgrade is not allowed."
            )

        if target_version == previous_version:
            raise ValueError(
                "Target version equals installed version."
            )

        for relative in (
            self.request.expected_files
        ):
            if not (
                self.request.source_directory
                / relative
            ).is_file():
                raise ValueError(
                    "Upgrade source is missing required file: "
                    + relative
                )

        return previous.version

    def _backup_previous_installation(
        self,
    ) -> None:
        source = (
            self.request.install_root
            / self.request.plugin_id
        )

        shutil.copytree(
            source,
            self._backup_root,
            copy_function=shutil.copy2,
        )

        self._previous_backup = (
            self._backup_root
        )
        self._record(
            "previous-installation-backed-up",
            {
                "backup": str(
                    self._backup_root
                ),
            },
        )

    def _rollback(
        self,
    ) -> None:
        self._state = (
            MarketplaceUpgradeState.ROLLING_BACK
        )
        self._record(
            "upgrade-rollback-started"
        )

        try:
            installed = (
                self.request.install_root
                / self.request.plugin_id
            )

            if (
                self._new_install_committed
                and installed.exists()
            ):
                shutil.rmtree(
                    installed
                )
                self._record(
                    "failed-upgrade-removed"
                )

            if (
                self._previous_backup is not None
                and self._previous_backup.exists()
            ):
                shutil.copytree(
                    self._previous_backup,
                    installed,
                    copy_function=shutil.copy2,
                )
                self._record(
                    "previous-installation-restored"
                )

            if (
                self._previous_registry
                is not None
            ):
                self._registry.write(
                    self._previous_registry
                )
                self._record(
                    "previous-registry-restored"
                )

            if (
                self._old_plugin_was_active
                and self._previous_record
                is not None
            ):
                self._activate_hook(
                    self.request.plugin_id,
                    self._previous_record.version,
                )

                if not self._health_hook(
                    self.request.plugin_id,
                    self._previous_record.version,
                ):
                    raise RuntimeError(
                        "Previous plugin failed health after rollback."
                    )

                self._record(
                    "previous-plugin-reactivated"
                )

            self._state = (
                MarketplaceUpgradeState.ROLLED_BACK
            )
            self._record(
                "upgrade-rollback-complete"
            )
        except Exception as error:
            self._issues.append(
                MarketplaceUpgradeIssue(
                    code="UPGRADE_ROLLBACK_FAILED",
                    step="rollback",
                    message=str(error),
                )
            )
            self._state = (
                MarketplaceUpgradeState.FAILED
            )
            self._record(
                "upgrade-rollback-error",
                {
                    "error": str(error),
                },
            )

    def _transition(
        self,
        state: MarketplaceUpgradeState,
        event: str,
    ) -> None:
        self._state = state
        self._record(
            event
        )

    def _record(
        self,
        event: str,
        details: Optional[
            Mapping[str, Any]
        ] = None,
    ) -> None:
        record = {
            "event": event,
            "state": self._state.value,
            "timestamp": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
            "transactionId": (
                self.transaction_id
            ),
        }

        if details:
            record["details"] = dict(
                details
            )

        with self._journal_path.open(
            "a",
            encoding="utf-8",
        ) as stream:
            stream.write(
                json.dumps(
                    record,
                    sort_keys=True,
                    separators=(
                        ",",
                        ":",
                    ),
                )
                + "\n"
            )
            stream.flush()
            os.fsync(
                stream.fileno()
            )

    def _invoke_fault(
        self,
        point: str,
    ) -> None:
        if self._fault_hook is not None:
            self._fault_hook(
                point
            )


__all__ = [
    "MarketplaceUpgradeCoordinator",
    "MarketplaceUpgradeIssue",
    "MarketplaceUpgradeRequest",
    "MarketplaceUpgradeResult",
    "MarketplaceUpgradeState",
]
