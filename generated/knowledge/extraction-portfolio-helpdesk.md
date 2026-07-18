# PropertyOS Module Extraction Portfolio

## Summary

- Modules: `1`
- Passed: `1`
- Failed: `0`
- Blocked: `0`
- Pending: `0`
- Portfolio result: `passed`

## Module: `helpdesk`

- Package: `@propertyos/plugin-helpdesk`
- Workspace: `generated/plugin-staging/helpdesk`
- Result: `passed`

| Stage | Status | Seconds | Exit | Detail | Command |
|---|---|---:|---:|---|---|
| blueprint | passed | 0.000 | - | Extraction blueprint generated. | - |
| materialization | passed | 0.082 | 0 | Command completed successfully. | /Users/anandnataraj/aiutilities/PropertyOS/propertyos-core/.venv/bin/python -m tools.knowledge_engine.materialization_cli --repository-root /Users/anandnataraj/aiutilities/PropertyOS/propertyos-core --output-root generated/plugin-staging --overwrite module helpdesk |
| closure | passed | 0.092 | 0 | Command completed successfully. | /Users/anandnataraj/aiutilities/PropertyOS/propertyos-core/.venv/bin/python -m tools.knowledge_engine.dependency_closure_cli --repository-root /Users/anandnataraj/aiutilities/PropertyOS/propertyos-core --staging-root generated/plugin-staging --apply --overwrite module helpdesk |
| rewrite | passed | 0.110 | 0 | Command completed successfully. | /Users/anandnataraj/aiutilities/PropertyOS/propertyos-core/.venv/bin/python -m tools.knowledge_engine.import_rewrite_cli --repository-root /Users/anandnataraj/aiutilities/PropertyOS/propertyos-core --staging-root generated/plugin-staging --apply module helpdesk |
| install | skipped | 0.000 | - | Dependency installation skipped. | - |
| compile | skipped | 0.000 | - | TypeScript compilation skipped. | - |
