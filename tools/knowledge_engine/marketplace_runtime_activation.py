from __future__ import annotations

import json
import os
import tempfile
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, Mapping, Optional, Sequence, Tuple


class MarketplaceRuntimePluginState(str, Enum):
    INSTALLED = "installed"
    ACTIVATING = "activating"
    ACTIVE = "active"
    DEACTIVATING = "deactivating"
    INACTIVE = "inactive"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceRuntimePluginRecord:
    plugin_id: str
    version: str
    install_path: str
    state: MarketplaceRuntimePluginState
    activation_order: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "activationOrder": self.activation_order,
            "installPath": self.install_path,
            "pluginId": self.plugin_id,
            "state": self.state.value,
            "version": self.version,
        }

    @classmethod
    def from_dict(
        cls,
        value: Mapping[str, Any],
    ) -> "MarketplaceRuntimePluginRecord":
        return cls(
            plugin_id=str(value["pluginId"]),
            version=str(value["version"]),
            install_path=str(value["installPath"]),
            state=MarketplaceRuntimePluginState(
                str(value["state"])
            ),
            activation_order=int(
                value["activationOrder"]
            ),
        )


class MarketplaceRuntimeRegistry:
    """
    Atomic JSON registry for installed and active marketplace plugins.
    """

    SCHEMA_VERSION = "1.0.0"

    def __init__(
        self,
        path: Path,
    ) -> None:
        self.path = path

    def load(
        self,
    ) -> Dict[str, MarketplaceRuntimePluginRecord]:
        if not self.path.exists():
            return {}

        raw = json.loads(
            self.path.read_text(
                encoding="utf-8"
            )
        )

        if raw.get("schemaVersion") != self.SCHEMA_VERSION:
            raise ValueError(
                "Unsupported runtime registry schema."
            )

        plugins = raw.get(
            "plugins",
            [],
        )

        if not isinstance(
            plugins,
            list,
        ):
            raise ValueError(
                "Runtime registry plugins must be an array."
            )

        result = {}

        for item in plugins:
            record = (
                MarketplaceRuntimePluginRecord
                .from_dict(item)
            )

            if record.plugin_id in result:
                raise ValueError(
                    "Duplicate plugin in runtime registry: "
                    + record.plugin_id
                )

            result[
                record.plugin_id
            ] = record

        return result

    def write(
        self,
        records: Mapping[
            str,
            MarketplaceRuntimePluginRecord,
        ],
    ) -> None:
        self.path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        payload = {
            "plugins": [
                records[plugin_id].to_dict()
                for plugin_id in sorted(records)
            ],
            "schemaVersion": self.SCHEMA_VERSION,
        }

        descriptor, temporary_name = tempfile.mkstemp(
            prefix=(
                self.path.name
                + "."
            ),
            suffix=".tmp",
            dir=str(
                self.path.parent
            ),
        )

        temporary = Path(
            temporary_name
        )

        try:
            with os.fdopen(
                descriptor,
                "w",
                encoding="utf-8",
            ) as stream:
                stream.write(
                    json.dumps(
                        payload,
                        indent=2,
                        sort_keys=True,
                    )
                    + "\n"
                )
                stream.flush()
                os.fsync(
                    stream.fileno()
                )

            os.replace(
                temporary,
                self.path,
            )
        finally:
            if temporary.exists():
                temporary.unlink()


class MarketplaceRuntimeActivationState(str, Enum):
    CREATED = "created"
    VALIDATING = "validating"
    ACTIVATING = "activating"
    COMMITTING = "committing"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceRuntimeActivationItem:
    sequence: int
    plugin_id: str
    version: str
    install_path: Path
    dependencies: Tuple[str, ...] = ()


@dataclass(frozen=True)
class MarketplaceRuntimeActivationIssue:
    code: str
    plugin_id: str
    step: str
    message: str

    def sort_key(
        self,
    ) -> Tuple[str, str, str, str]:
        return (
            self.step,
            self.plugin_id,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceRuntimeActivationRequest:
    items: Tuple[
        MarketplaceRuntimeActivationItem,
        ...,
    ]
    registry_path: Path
    journal_root: Path


@dataclass(frozen=True)
class MarketplaceRuntimeActivationResult:
    transaction_id: str
    state: MarketplaceRuntimeActivationState
    journal_path: Path
    activated_plugins: Tuple[str, ...]
    issues: Tuple[
        MarketplaceRuntimeActivationIssue,
        ...,
    ]

    @property
    def succeeded(
        self,
    ) -> bool:
        return (
            self.state
            == MarketplaceRuntimeActivationState.COMMITTED
        )


class MarketplaceRuntimeActivationTransaction:
    """
    Activation boundary for an already-installed plugin portfolio.

    The transaction validates installation paths and dependency order,
    invokes activation hooks in certified order, writes the runtime registry
    atomically, and deactivates already-activated plugins in reverse order
    when any activation or registry commit fails.
    """

    def __init__(
        self,
        request: MarketplaceRuntimeActivationRequest,
        *,
        transaction_id: Optional[str] = None,
        activate_hook: Optional[
            Callable[
                [MarketplaceRuntimeActivationItem],
                None,
            ]
        ] = None,
        deactivate_hook: Optional[
            Callable[
                [MarketplaceRuntimeActivationItem],
                None,
            ]
        ] = None,
        health_hook: Optional[
            Callable[
                [MarketplaceRuntimeActivationItem],
                bool,
            ]
        ] = None,
        fault_hook: Optional[
            Callable[
                [str, Optional[str]],
                None,
            ]
        ] = None,
    ) -> None:
        self.request = request
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._activate_hook = (
            activate_hook
            or (lambda item: None)
        )
        self._deactivate_hook = (
            deactivate_hook
            or (lambda item: None)
        )
        self._health_hook = (
            health_hook
            or (lambda item: True)
        )
        self._fault_hook = fault_hook

        self._state = (
            MarketplaceRuntimeActivationState.CREATED
        )
        self._issues = []
        self._activated = []
        self._registry = (
            MarketplaceRuntimeRegistry(
                request.registry_path
            )
        )
        self._previous_registry = None

        self._journal_path = (
            request.journal_root
            / (
                "activation-"
                + self.transaction_id
                + ".jsonl"
            )
        )

    def execute(
        self,
    ) -> MarketplaceRuntimeActivationResult:
        self.request.journal_root.mkdir(
            parents=True,
            exist_ok=True,
        )
        self._record(
            "activation-transaction-created"
        )

        try:
            self._transition(
                MarketplaceRuntimeActivationState.VALIDATING,
                "activation-validation-started",
            )
            items = self._validate()
            self._record(
                "activation-validation-complete"
            )

            self._previous_registry = (
                self._registry.load()
            )

            self._transition(
                MarketplaceRuntimeActivationState.ACTIVATING,
                "activation-started",
            )

            for item in items:
                self._invoke_fault(
                    "before-activate",
                    item.plugin_id,
                )
                self._activate_hook(
                    item
                )

                if not self._health_hook(
                    item
                ):
                    raise RuntimeError(
                        "Health validation failed: "
                        + item.plugin_id
                    )

                self._activated.append(
                    item
                )
                self._record(
                    "plugin-activated",
                    {
                        "pluginId": (
                            item.plugin_id
                        ),
                        "sequence": (
                            item.sequence
                        ),
                    },
                )
                self._invoke_fault(
                    "after-activate",
                    item.plugin_id,
                )

            self._transition(
                MarketplaceRuntimeActivationState.COMMITTING,
                "activation-registry-commit-started",
            )

            records = dict(
                self._previous_registry
            )

            for item in items:
                records[
                    item.plugin_id
                ] = MarketplaceRuntimePluginRecord(
                    plugin_id=(
                        item.plugin_id
                    ),
                    version=item.version,
                    install_path=str(
                        item.install_path
                    ),
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=(
                        item.sequence
                    ),
                )

            self._invoke_fault(
                "before-registry-write",
                None,
            )
            self._registry.write(
                records
            )
            self._invoke_fault(
                "after-registry-write",
                None,
            )

            self._transition(
                MarketplaceRuntimeActivationState.COMMITTED,
                "activation-committed",
            )
        except Exception as error:
            self._issues.append(
                MarketplaceRuntimeActivationIssue(
                    code="ACTIVATION_FAILED",
                    plugin_id="",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "activation-error",
                {
                    "error": str(error),
                },
            )
            self._rollback()

        return self.result()

    def result(
        self,
    ) -> MarketplaceRuntimeActivationResult:
        return MarketplaceRuntimeActivationResult(
            transaction_id=(
                self.transaction_id
            ),
            state=self._state,
            journal_path=(
                self._journal_path
            ),
            activated_plugins=tuple(
                item.plugin_id
                for item in self._activated
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
    ) -> Tuple[
        MarketplaceRuntimeActivationItem,
        ...,
    ]:
        items = tuple(
            sorted(
                self.request.items,
                key=(
                    lambda item:
                    item.sequence
                ),
            )
        )

        if not items:
            raise ValueError(
                "Activation plan is empty."
            )

        sequences = tuple(
            item.sequence
            for item in items
        )

        if sequences != tuple(
            range(
                1,
                len(items) + 1,
            )
        ):
            raise ValueError(
                "Activation sequences must be contiguous."
            )

        plugin_ids = tuple(
            item.plugin_id
            for item in items
        )

        if len(plugin_ids) != len(
            set(plugin_ids)
        ):
            raise ValueError(
                "Activation plan contains duplicate plugins."
            )

        positions = {
            plugin_id: index
            for index, plugin_id
            in enumerate(plugin_ids)
        }

        for item in items:
            if not item.install_path.is_dir():
                raise ValueError(
                    "Installed plugin directory is missing: "
                    + item.plugin_id
                )

            if not (
                item.install_path
                / "plugin.json"
            ).is_file():
                raise ValueError(
                    "Installed plugin manifest is missing: "
                    + item.plugin_id
                )

            if not (
                item.install_path
                / "dist"
                / "index.js"
            ).is_file():
                raise ValueError(
                    "Installed runtime entrypoint is missing: "
                    + item.plugin_id
                )

            for dependency in item.dependencies:
                if dependency not in positions:
                    raise ValueError(
                        item.plugin_id
                        + " depends on missing plugin "
                        + dependency
                    )

                if (
                    positions[dependency]
                    >= positions[item.plugin_id]
                ):
                    raise ValueError(
                        item.plugin_id
                        + " has a forward dependency on "
                        + dependency
                    )

        return items

    def _rollback(
        self,
    ) -> None:
        self._state = (
            MarketplaceRuntimeActivationState.ROLLING_BACK
        )
        self._record(
            "activation-rollback-started"
        )

        try:
            for item in reversed(
                self._activated
            ):
                try:
                    self._deactivate_hook(
                        item
                    )
                    self._record(
                        "plugin-deactivated",
                        {
                            "pluginId": (
                                item.plugin_id
                            ),
                        },
                    )
                except Exception as error:
                    self._issues.append(
                        MarketplaceRuntimeActivationIssue(
                            code="DEACTIVATION_FAILED",
                            plugin_id=(
                                item.plugin_id
                            ),
                            step="rollback",
                            message=str(error),
                        )
                    )

            if self._previous_registry is not None:
                self._registry.write(
                    self._previous_registry
                )
                self._record(
                    "runtime-registry-restored"
                )

            self._state = (
                MarketplaceRuntimeActivationState.ROLLED_BACK
            )
            self._record(
                "activation-rollback-complete"
            )
        except Exception as error:
            self._issues.append(
                MarketplaceRuntimeActivationIssue(
                    code="ACTIVATION_ROLLBACK_FAILED",
                    plugin_id="",
                    step="rollback",
                    message=str(error),
                )
            )
            self._state = (
                MarketplaceRuntimeActivationState.FAILED
            )
            self._record(
                "activation-rollback-error",
                {
                    "error": str(error),
                },
            )

    def _transition(
        self,
        state: MarketplaceRuntimeActivationState,
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
        plugin_id: Optional[str],
    ) -> None:
        if self._fault_hook is not None:
            self._fault_hook(
                point,
                plugin_id,
            )


__all__ = [
    "MarketplaceRuntimeActivationIssue",
    "MarketplaceRuntimeActivationItem",
    "MarketplaceRuntimeActivationRequest",
    "MarketplaceRuntimeActivationResult",
    "MarketplaceRuntimeActivationState",
    "MarketplaceRuntimeActivationTransaction",
    "MarketplaceRuntimePluginRecord",
    "MarketplaceRuntimePluginState",
    "MarketplaceRuntimeRegistry",
]
