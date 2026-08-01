from __future__ import annotations

import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_install_transaction import (
    MarketplaceInstallTransaction,
    MarketplaceInstallTransactionRequest,
    MarketplaceInstallTransactionState,
)


class MarketplaceInstallTransactionTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.source = self.root / "source"
        self.install_root = self.root / "installed"
        self.work_root = self.root / "transactions"

        self.source.mkdir()
        (self.source / "plugin.json").write_text(
            '{"id":"agreement"}\n',
            encoding="utf-8",
        )
        (self.source / "dist").mkdir()
        (self.source / "dist" / "index.js").write_text(
            "module.exports = {};\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def request(self, *, overwrite: bool = False):
        return MarketplaceInstallTransactionRequest(
            plugin_id="agreement",
            version="0.1.0",
            source_directory=self.source,
            install_root=self.install_root,
            work_root=self.work_root,
            expected_files=(
                "plugin.json",
                "dist/index.js",
            ),
            overwrite=overwrite,
        )

    def test_installs_plugin_atomically(self) -> None:
        result = MarketplaceInstallTransaction(
            self.request(),
            transaction_id="transaction-1",
        ).execute()

        self.assertTrue(result.succeeded)
        self.assertEqual(
            result.state,
            MarketplaceInstallTransactionState.COMMITTED,
        )
        self.assertTrue(
            (result.install_directory / "dist" / "index.js").is_file()
        )
        self.assertEqual(result.issues, ())

    def test_journal_contains_ordered_lifecycle(self) -> None:
        result = MarketplaceInstallTransaction(
            self.request(),
            transaction_id="transaction-2",
        ).execute()

        events = [
            json.loads(line)["event"]
            for line in result.journal_path.read_text(
                encoding="utf-8"
            ).splitlines()
        ]

        self.assertEqual(
            events,
            [
                "transaction-created",
                "preflight-passed",
                "staging-started",
                "staging-complete",
                "commit-started",
                "commit-complete",
            ],
        )

    def test_rejects_missing_required_file(self) -> None:
        (self.source / "dist" / "index.js").unlink()

        result = MarketplaceInstallTransaction(
            self.request(),
            transaction_id="transaction-3",
        ).execute()

        self.assertEqual(
            result.state,
            MarketplaceInstallTransactionState.ROLLED_BACK,
        )
        self.assertFalse(result.install_directory.exists())
        self.assertTrue(result.issues)

    def test_rejects_existing_install_without_overwrite(self) -> None:
        installed = self.install_root / "agreement"
        installed.mkdir(parents=True)
        (installed / "old.txt").write_text("old", encoding="utf-8")

        result = MarketplaceInstallTransaction(
            self.request(),
            transaction_id="transaction-4",
        ).execute()

        self.assertEqual(
            result.state,
            MarketplaceInstallTransactionState.ROLLED_BACK,
        )
        self.assertTrue((installed / "old.txt").is_file())

        events = [
            json.loads(line)["event"]
            for line in result.journal_path.read_text(
                encoding="utf-8"
            ).splitlines()
        ]
        self.assertNotIn("partial-installation-removed", events)
        self.assertNotIn("backup-restored", events)

    def test_overwrite_replaces_existing_install(self) -> None:
        installed = self.install_root / "agreement"
        installed.mkdir(parents=True)
        (installed / "old.txt").write_text("old", encoding="utf-8")

        result = MarketplaceInstallTransaction(
            self.request(overwrite=True),
            transaction_id="transaction-5",
        ).execute()

        self.assertTrue(result.succeeded)
        self.assertFalse((installed / "old.txt").exists())
        self.assertTrue((installed / "plugin.json").is_file())

    def test_failure_after_backup_restores_previous_install(self) -> None:
        installed = self.install_root / "agreement"
        installed.mkdir(parents=True)
        (installed / "old.txt").write_text("old", encoding="utf-8")

        def fault(point: str) -> None:
            if point == "after-backup":
                raise RuntimeError("injected failure")

        result = MarketplaceInstallTransaction(
            self.request(overwrite=True),
            transaction_id="transaction-6",
            fault_hook=fault,
        ).execute()

        self.assertEqual(
            result.state,
            MarketplaceInstallTransactionState.ROLLED_BACK,
        )
        self.assertTrue((installed / "old.txt").is_file())
        self.assertFalse((installed / "plugin.json").exists())

    def test_failure_after_promote_removes_new_install_and_restores_old(self) -> None:
        installed = self.install_root / "agreement"
        installed.mkdir(parents=True)
        (installed / "old.txt").write_text("old", encoding="utf-8")

        def fault(point: str) -> None:
            if point == "after-promote":
                raise RuntimeError("injected post-promote failure")

        result = MarketplaceInstallTransaction(
            self.request(overwrite=True),
            transaction_id="transaction-7",
            fault_hook=fault,
        ).execute()

        self.assertEqual(
            result.state,
            MarketplaceInstallTransactionState.ROLLED_BACK,
        )
        self.assertTrue((installed / "old.txt").is_file())
        self.assertFalse((installed / "plugin.json").exists())

    def test_rejects_symlink_payload(self) -> None:
        target = self.root / "outside.txt"
        target.write_text("outside", encoding="utf-8")
        (self.source / "link.txt").symlink_to(target)

        result = MarketplaceInstallTransaction(
            self.request(),
            transaction_id="transaction-8",
        ).execute()

        self.assertEqual(
            result.state,
            MarketplaceInstallTransactionState.ROLLED_BACK,
        )
        self.assertFalse(result.install_directory.exists())

    def test_result_is_deterministic_except_journal_time(self) -> None:
        first_root = self.root / "first-installed"
        second_root = self.root / "second-installed"

        first = MarketplaceInstallTransaction(
            MarketplaceInstallTransactionRequest(
                plugin_id="agreement",
                version="0.1.0",
                source_directory=self.source,
                install_root=first_root,
                work_root=self.root / "first-work",
                expected_files=("plugin.json", "dist/index.js"),
            ),
            transaction_id="fixed-a",
        ).execute()

        second = MarketplaceInstallTransaction(
            MarketplaceInstallTransactionRequest(
                plugin_id="agreement",
                version="0.1.0",
                source_directory=self.source,
                install_root=second_root,
                work_root=self.root / "second-work",
                expected_files=("plugin.json", "dist/index.js"),
            ),
            transaction_id="fixed-b",
        ).execute()

        self.assertEqual(first.state, second.state)
        self.assertEqual(first.issues, second.issues)
        self.assertEqual(
            sorted(
                str(path.relative_to(first.install_directory))
                for path in first.install_directory.rglob("*")
            ),
            sorted(
                str(path.relative_to(second.install_directory))
                for path in second.install_directory.rglob("*")
            ),
        )


if __name__ == "__main__":
    unittest.main()
