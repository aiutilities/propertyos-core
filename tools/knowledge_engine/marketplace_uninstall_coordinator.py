from __future__ import annotations

import json
import os
import shutil
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Mapping, Optional, Tuple

from .marketplace_runtime_activation import (
    MarketplaceRuntimePluginRecord,
    MarketplaceRuntimePluginState,
    MarketplaceRuntimeRegistry,
)


class MarketplaceUninstallState(str, Enum):
    CREATED = "created"
    VALIDATING = "validating"
    DEACTIVATING = "deactivating"
    REMOVING = "removing"
    COMMITTING = "committing"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceUninstallRequest:
    plugin_id: str
    install_root: Path
    work_root: Path
    registry_path: Path
    journal_root: Path
    dependency_map: Mapping[str, Tuple[str, ...]]
    preserve_data: bool = True
    data_subdirectory: str = "data"


@dataclass(frozen=True)
class MarketplaceUninstallIssue:
    code: str
    step: str
    message: str

    def sort_key(self) -> tuple[str, str, str]:
        return (
            self.step,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceUninstallResult:
    transaction_id: str
    state: MarketplaceUninstallState
    plugin_id: str
    journal_path: Path
    preserved_data_path: Optional[Path]
    issues: Tuple[
        MarketplaceUninstallIssue,
        ...,
    ]

    @property
    def succeeded(self) -> bool:
        return (
            self.state
            == MarketplaceUninstallState.COMMITTED
        )


class MarketplaceUninstallCoordinator:
    """
    Safely removes one installed plugin while protecting:
    - reverse dependencies;
    - runtime registry consistency;
    - prior active state;
    - plugin data;
    - rollback to the exact previous installation on failure.
    """

    def __init__(
        self,
        request: MarketplaceUninstallRequest,
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

        self._state = (
            MarketplaceUninstallState.CREATED
        )
        self._issues = []
        self._registry = MarketplaceRuntimeRegistry(
            request.registry_path
        )
        self._previous_registry = None
        self._previous_record = None
        self._plugin_was_active = False
        self._installation_moved = False
        self._data_preserved_path = None

        self._transaction_root = (
            request.work_root
            / (
                "uninstall-"
                + self.transaction_id
            )
        )
        self._backup_path = (
            self._transaction_root
            / "plugin-backup"
        )
        self._preserved_data_root = (
            self._transaction_root
            / "preserved-data"
        )
        self._journal_path = (
            request.journal_root
            / (
                "uninstall-"
                + self.transaction_id
                + ".jsonl"
            )
        )

    def execute(
        self,
    ) -> MarketplaceUninstallResult:
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
                "Uninstall workspace already exists."
            )

        self._transaction_root.mkdir()
        self._record(
            "uninstall-transaction-created"
        )

        try:
            self._transition(
                MarketplaceUninstallState.VALIDATING,
                "uninstall-validation-started",
            )
            self._validate()
            self._record(
                "uninstall-validation-complete"
            )

            self._previous_registry = (
                self._registry.load()
            )
            self._previous_record = (
                self._previous_registry[
                    self.request.plugin_id
                ]
            )
            self._plugin_was_active = (
                self._previous_record.state
                == MarketplaceRuntimePluginState.ACTIVE
            )

            if self._plugin_was_active:
                self._transition(
                    MarketplaceUninstallState.DEACTIVATING,
                    "uninstall-deactivation-started",
                )
                self._deactivate_hook(
                    self.request.plugin_id
                )
                self._record(
                    "plugin-deactivated"
                )

            self._transition(
                MarketplaceUninstallState.REMOVING,
                "uninstall-removal-started",
            )

            self._preserve_data_if_required()
            self._move_installation_to_backup()
            self._invoke_fault(
                "after-remove"
            )

            self._transition(
                MarketplaceUninstallState.COMMITTING,
                "uninstall-registry-commit-started",
            )

            updated = dict(
                self._previous_registry
            )
            updated.pop(
                self.request.plugin_id,
                None,
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
                MarketplaceUninstallState.COMMITTED,
                "uninstall-committed",
            )
        except Exception as error:
            self._issues.append(
                MarketplaceUninstallIssue(
                    code="UNINSTALL_FAILED",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "uninstall-error",
                {
                    "error": str(error),
                },
            )
            self._rollback()

        return MarketplaceUninstallResult(
            transaction_id=(
                self.transaction_id
            ),
            state=self._state,
            plugin_id=(
                self.request.plugin_id
            ),
            journal_path=(
                self._journal_path
            ),
            preserved_data_path=(
                self._data_preserved_path
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

    def _validate(self) -> None:
        installed = (
            self.request.install_root
            / self.request.plugin_id
        )

        if not installed.is_dir():
            raise ValueError(
                "Installed plugin does not exist."
            )

        registry = self._registry.load()

        if self.request.plugin_id not in registry:
            raise ValueError(
                "Installed plugin is absent from runtime registry."
            )

        dependents = sorted(
            plugin_id
            for plugin_id, dependencies
            in self.request.dependency_map.items()
            if (
                self.request.plugin_id
                in dependencies
                and plugin_id
                in registry
            )
        )

        if dependents:
            raise ValueError(
                "Plugin has installed dependents: "
                + ", ".join(dependents)
            )

        if not (
            installed
            / "plugin.json"
        ).is_file():
            raise ValueError(
                "Installed plugin manifest is missing."
            )

    def _preserve_data_if_required(
        self,
    ) -> None:
        if not self.request.preserve_data:
            return

        source = (
            self.request.install_root
            / self.request.plugin_id
            / self.request.data_subdirectory
        )

        if not source.exists():
            return

        self._preserved_data_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        destination = (
            self._preserved_data_root
            / self.request.plugin_id
        )

        if source.is_dir():
            shutil.copytree(
                source,
                destination,
                copy_function=shutil.copy2,
            )
        else:
            destination.parent.mkdir(
                parents=True,
                exist_ok=True,
            )
            shutil.copy2(
                source,
                destination,
            )

        self._data_preserved_path = (
            destination
        )
        self._record(
            "plugin-data-preserved",
            {
                "path": str(
                    destination
                ),
            },
        )

    def _move_installation_to_backup(
        self,
    ) -> None:
        source = (
            self.request.install_root
            / self.request.plugin_id
        )

        os.replace(
            source,
            self._backup_path,
        )
        self._installation_moved = True
        self._record(
            "plugin-installation-removed",
            {
                "backup": str(
                    self._backup_path
                ),
            },
        )

    def _rollback(self) -> None:
        self._state = (
            MarketplaceUninstallState.ROLLING_BACK
        )
        self._record(
            "uninstall-rollback-started"
        )

        try:
            installed = (
                self.request.install_root
                / self.request.plugin_id
            )

            if (
                self._installation_moved
                and self._backup_path.exists()
            ):
                if installed.exists():
                    shutil.rmtree(
                        installed
                    )

                os.replace(
                    self._backup_path,
                    installed,
                )
                self._record(
                    "plugin-installation-restored"
                )

            if self._previous_registry is not None:
                self._registry.write(
                    self._previous_registry
                )
                self._record(
                    "runtime-registry-restored"
                )

            if (
                self._plugin_was_active
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
                        "Restored plugin failed health check."
                    )

                self._record(
                    "plugin-reactivated"
                )

            self._state = (
                MarketplaceUninstallState.ROLLED_BACK
            )
            self._record(
                "uninstall-rollback-complete"
            )
        except Exception as error:
            self._issues.append(
                MarketplaceUninstallIssue(
                    code="UNINSTALL_ROLLBACK_FAILED",
                    step="rollback",
                    message=str(error),
                )
            )
            self._state = (
                MarketplaceUninstallState.FAILED
            )
            self._record(
                "uninstall-rollback-error",
                {
                    "error": str(error),
                },
            )

    def _transition(
        self,
        state: MarketplaceUninstallState,
        event: str,
    ) -> None:
        self._state = state
        self._record(event)

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
    "MarketplaceUninstallCoordinator",
    "MarketplaceUninstallIssue",
    "MarketplaceUninstallRequest",
    "MarketplaceUninstallResult",
    "MarketplaceUninstallState",
]
