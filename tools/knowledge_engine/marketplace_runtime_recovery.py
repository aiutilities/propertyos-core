from __future__ import annotations

import json
import os
import tempfile
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Mapping, Optional, Sequence, Tuple

from .marketplace_runtime_activation import (
    MarketplaceRuntimePluginRecord,
    MarketplaceRuntimePluginState,
    MarketplaceRuntimeRegistry,
)


class MarketplaceRuntimeRecoveryAction(str, Enum):
    NONE = "none"
    RESTORE_REGISTRY = "restore-registry"
    MARK_INACTIVE = "mark-inactive"
    REMOVE_STALE = "remove-stale"
    REBUILD_REGISTRY = "rebuild-registry"
    FAIL = "fail"


@dataclass(frozen=True)
class MarketplaceRuntimeRecoveryIssue:
    code: str
    plugin_id: str
    message: str

    def sort_key(self) -> tuple[str, str, str]:
        return (
            self.plugin_id,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceRuntimeRecoveryDecision:
    plugin_id: str
    action: MarketplaceRuntimeRecoveryAction
    reason: str


@dataclass(frozen=True)
class MarketplaceRuntimeRecoveryRequest:
    install_root: Path
    registry_path: Path
    journal_root: Path
    allow_remove_stale: bool = False
    allow_rebuild: bool = True


@dataclass(frozen=True)
class MarketplaceRuntimeRecoveryResult:
    transaction_id: str
    succeeded: bool
    registry_path: Path
    journal_path: Path
    decisions: Tuple[
        MarketplaceRuntimeRecoveryDecision,
        ...,
    ]
    issues: Tuple[
        MarketplaceRuntimeRecoveryIssue,
        ...,
    ]


class MarketplaceRuntimeRecoveryCoordinator:
    """
    Reconciles installed plugin directories, runtime registry state, and
    interrupted activation journals after process restart.

    Recovery is deterministic and default-deny:
    - installed plugins missing from registry are reconstructed as inactive;
    - active registry entries with missing files are rejected by default;
    - stale registry entries may be removed only when explicitly allowed;
    - activating/deactivating states are normalized to inactive;
    - registry writes are atomic through MarketplaceRuntimeRegistry.
    """

    def __init__(
        self,
        request: MarketplaceRuntimeRecoveryRequest,
        *,
        transaction_id: Optional[str] = None,
    ) -> None:
        self.request = request
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._registry = MarketplaceRuntimeRegistry(
            request.registry_path
        )
        self._decisions = []
        self._issues = []
        self._journal_path = (
            request.journal_root
            / (
                "recovery-"
                + self.transaction_id
                + ".jsonl"
            )
        )

    def execute(
        self,
    ) -> MarketplaceRuntimeRecoveryResult:
        self.request.journal_root.mkdir(
            parents=True,
            exist_ok=True,
        )
        self._record(
            "runtime-recovery-started"
        )

        try:
            installed = self._scan_installed()
            current = self._registry.load()
            recovered = self._reconcile(
                installed,
                current,
            )

            if self._issues:
                self._record(
                    "runtime-recovery-rejected",
                    {
                        "issueCount": len(
                            self._issues
                        ),
                    },
                )
                return self.result(
                    succeeded=False
                )

            self._registry.write(
                recovered
            )
            self._record(
                "runtime-registry-recovered",
                {
                    "pluginCount": len(
                        recovered
                    ),
                },
            )
            self._record(
                "runtime-recovery-complete"
            )
            return self.result(
                succeeded=True
            )
        except Exception as error:
            self._issues.append(
                MarketplaceRuntimeRecoveryIssue(
                    code="RECOVERY_FAILED",
                    plugin_id="",
                    message=str(error),
                )
            )
            self._record(
                "runtime-recovery-error",
                {
                    "error": str(error),
                },
            )
            return self.result(
                succeeded=False
            )

    def result(
        self,
        *,
        succeeded: bool,
    ) -> MarketplaceRuntimeRecoveryResult:
        return MarketplaceRuntimeRecoveryResult(
            transaction_id=(
                self.transaction_id
            ),
            succeeded=succeeded,
            registry_path=(
                self.request.registry_path
            ),
            journal_path=(
                self._journal_path
            ),
            decisions=tuple(
                sorted(
                    self._decisions,
                    key=(
                        lambda item: (
                            item.plugin_id,
                            item.action.value,
                            item.reason,
                        )
                    ),
                )
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

    def _scan_installed(
        self,
    ) -> Dict[
        str,
        MarketplaceRuntimePluginRecord,
    ]:
        if not self.request.install_root.exists():
            return {}

        result = {}

        for directory in sorted(
            self.request.install_root.iterdir()
        ):
            if not directory.is_dir():
                continue

            manifest_path = (
                directory
                / "plugin.json"
            )
            entrypoint = (
                directory
                / "dist"
                / "index.js"
            )

            if not manifest_path.is_file():
                self._issues.append(
                    MarketplaceRuntimeRecoveryIssue(
                        code="INSTALLED_MANIFEST_MISSING",
                        plugin_id=directory.name,
                        message=(
                            "Installed plugin directory "
                            "has no plugin.json."
                        ),
                    )
                )
                continue

            if not entrypoint.is_file():
                self._issues.append(
                    MarketplaceRuntimeRecoveryIssue(
                        code="INSTALLED_ENTRYPOINT_MISSING",
                        plugin_id=directory.name,
                        message=(
                            "Installed plugin directory "
                            "has no dist/index.js."
                        ),
                    )
                )
                continue

            manifest = json.loads(
                manifest_path.read_text(
                    encoding="utf-8"
                )
            )

            plugin_id = str(
                manifest.get(
                    "id",
                    directory.name,
                )
            )
            version = str(
                manifest.get(
                    "version",
                    "0.0.0",
                )
            )

            if plugin_id != directory.name:
                self._issues.append(
                    MarketplaceRuntimeRecoveryIssue(
                        code="INSTALLED_ID_MISMATCH",
                        plugin_id=directory.name,
                        message=(
                            "Installed directory name "
                            "does not match manifest ID."
                        ),
                    )
                )
                continue

            result[
                plugin_id
            ] = MarketplaceRuntimePluginRecord(
                plugin_id=plugin_id,
                version=version,
                install_path=str(
                    directory
                ),
                state=(
                    MarketplaceRuntimePluginState.INACTIVE
                ),
                activation_order=0,
            )

        return result

    def _reconcile(
        self,
        installed: Mapping[
            str,
            MarketplaceRuntimePluginRecord,
        ],
        current: Mapping[
            str,
            MarketplaceRuntimePluginRecord,
        ],
    ) -> Dict[
        str,
        MarketplaceRuntimePluginRecord,
    ]:
        recovered = {}

        all_ids = sorted(
            set(installed)
            | set(current)
        )

        next_order = 1

        for plugin_id in all_ids:
            installed_record = installed.get(
                plugin_id
            )
            current_record = current.get(
                plugin_id
            )

            if (
                installed_record is not None
                and current_record is None
            ):
                if not self.request.allow_rebuild:
                    self._issues.append(
                        MarketplaceRuntimeRecoveryIssue(
                            code="REGISTRY_ENTRY_MISSING",
                            plugin_id=plugin_id,
                            message=(
                                "Installed plugin is "
                                "missing from registry."
                            ),
                        )
                    )
                    continue

                recovered[
                    plugin_id
                ] = MarketplaceRuntimePluginRecord(
                    plugin_id=plugin_id,
                    version=(
                        installed_record.version
                    ),
                    install_path=(
                        installed_record.install_path
                    ),
                    state=(
                        MarketplaceRuntimePluginState.INACTIVE
                    ),
                    activation_order=(
                        next_order
                    ),
                )
                next_order += 1
                self._decisions.append(
                    MarketplaceRuntimeRecoveryDecision(
                        plugin_id=plugin_id,
                        action=(
                            MarketplaceRuntimeRecoveryAction.REBUILD_REGISTRY
                        ),
                        reason=(
                            "Installed plugin was absent "
                            "from runtime registry."
                        ),
                    )
                )
                continue

            if (
                installed_record is None
                and current_record is not None
            ):
                if not self.request.allow_remove_stale:
                    self._issues.append(
                        MarketplaceRuntimeRecoveryIssue(
                            code="STALE_REGISTRY_ENTRY",
                            plugin_id=plugin_id,
                            message=(
                                "Registry entry has no "
                                "installed plugin directory."
                            ),
                        )
                    )
                    continue

                self._decisions.append(
                    MarketplaceRuntimeRecoveryDecision(
                        plugin_id=plugin_id,
                        action=(
                            MarketplaceRuntimeRecoveryAction.REMOVE_STALE
                        ),
                        reason=(
                            "Registry entry had no "
                            "installed plugin."
                        ),
                    )
                )
                continue

            assert installed_record is not None
            assert current_record is not None

            if (
                installed_record.version
                != current_record.version
            ):
                self._issues.append(
                    MarketplaceRuntimeRecoveryIssue(
                        code="VERSION_MISMATCH",
                        plugin_id=plugin_id,
                        message=(
                            "Installed version does not "
                            "match runtime registry."
                        ),
                    )
                )
                continue

            state = current_record.state
            action = MarketplaceRuntimeRecoveryAction.NONE
            reason = "Registry entry is consistent."

            if state in {
                MarketplaceRuntimePluginState.ACTIVATING,
                MarketplaceRuntimePluginState.DEACTIVATING,
                MarketplaceRuntimePluginState.FAILED,
            }:
                state = (
                    MarketplaceRuntimePluginState.INACTIVE
                )
                action = (
                    MarketplaceRuntimeRecoveryAction.MARK_INACTIVE
                )
                reason = (
                    "Interrupted runtime state was "
                    "normalized to inactive."
                )

            recovered[
                plugin_id
            ] = MarketplaceRuntimePluginRecord(
                plugin_id=plugin_id,
                version=(
                    installed_record.version
                ),
                install_path=(
                    installed_record.install_path
                ),
                state=state,
                activation_order=(
                    current_record.activation_order
                    if current_record.activation_order > 0
                    else next_order
                ),
            )

            if (
                current_record.activation_order
                <= 0
            ):
                next_order += 1

            self._decisions.append(
                MarketplaceRuntimeRecoveryDecision(
                    plugin_id=plugin_id,
                    action=action,
                    reason=reason,
                )
            )

        return recovered

    def _record(
        self,
        event: str,
        details: Optional[
            Mapping[str, Any]
        ] = None,
    ) -> None:
        record = {
            "event": event,
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


__all__ = [
    "MarketplaceRuntimeRecoveryAction",
    "MarketplaceRuntimeRecoveryCoordinator",
    "MarketplaceRuntimeRecoveryDecision",
    "MarketplaceRuntimeRecoveryIssue",
    "MarketplaceRuntimeRecoveryRequest",
    "MarketplaceRuntimeRecoveryResult",
]
