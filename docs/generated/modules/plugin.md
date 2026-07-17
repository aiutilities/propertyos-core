<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# Plugin

> Module ID: `plugin`

## Overview

| Field | Value |
|---|---|
| Class | `PluginModule` |
| Physical location | `core` |
| Architectural role | `platform` |
| Expected location | `core` |
| Alignment | `aligned` |
| Criticality | `high` |
| Risk score | `85.1` |
| Blast radius | `16` |
| Dependency surface | `7` |
| Source | `backend/src/core/plugin/plugin.module.ts` |

## Repository Surface

| Entity | Count |
|---|---:|
| Components | 22 |
| Controllers | 4 |
| Routes | 21 |
| Direct dependencies | 5 |
| Direct dependents | 15 |
| Transitive dependencies | 7 |
| Transitive dependents | 16 |

## Direct Dependencies

- `database:postgres`
- `eventbus`
- `identity`
- `search`
- `storage`

## Direct Dependents

- `access-control`
- `admin`
- `communications`
- `facility`
- `health`
- `helpdesk`
- `inventory`
- `maintenance`
- `notification`
- `procurement`
- `reservation`
- `staff`
- `vehicle`
- `vendor`
- `workflow`

## Transitive Impact

A change to `plugin` can potentially affect **16** modules transitively.

- `access-control`
- `admin`
- `communications`
- `facility`
- `health`
- `helpdesk`
- `inventory`
- `maintenance`
- `notification`
- `plugin:visitor`
- `procurement`
- `reservation`
- `staff`
- `vehicle`
- `vendor`
- `workflow`


## Controllers

| Controller | Base path | Routes | Auth | Source |
|---|---|---:|---|---|
| `PluginInstallerController` | `/plugin-installer` | 1 | Bearer | `backend/src/core/plugin/installer/controllers/plugin-installer.controller.ts:8` |
| `PluginMarketplaceController` | `/plugin-marketplace` | 4 | Bearer | `backend/src/core/plugin/marketplace/controllers/plugin-marketplace.controller.ts:9` |
| `PluginPackageController` | `/plugin-packages` | 4 | Bearer | `backend/src/core/plugin/package/controllers/plugin-package.controller.ts:8` |
| `PluginController` | `/plugins` | 12 | Bearer | `backend/src/core/plugin/controllers/plugin.controller.ts:11` |

## Routes

| Method | Path | Handler | Permissions | Source |
|---|---|---|---|---|
| `POST` | `/plugin-installer/install` | `install` |  | `backend/src/core/plugin/installer/controllers/plugin-installer.controller.ts:14` |
| `GET` | `/plugin-marketplace` | `list` |  | `backend/src/core/plugin/marketplace/controllers/plugin-marketplace.controller.ts:21` |
| `POST` | `/plugin-marketplace` | `register` |  | `backend/src/core/plugin/marketplace/controllers/plugin-marketplace.controller.ts:13` |
| `GET` | `/plugin-marketplace/:id` | `get` |  | `backend/src/core/plugin/marketplace/controllers/plugin-marketplace.controller.ts:37` |
| `POST` | `/plugin-marketplace/search` | `search` |  | `backend/src/core/plugin/marketplace/controllers/plugin-marketplace.controller.ts:29` |
| `GET` | `/plugin-packages` | `list` |  | `backend/src/core/plugin/package/controllers/plugin-package.controller.ts:20` |
| `POST` | `/plugin-packages` | `register` |  | `backend/src/core/plugin/package/controllers/plugin-package.controller.ts:12` |
| `GET` | `/plugin-packages/:id` | `get` |  | `backend/src/core/plugin/package/controllers/plugin-package.controller.ts:28` |
| `POST` | `/plugin-packages/:id/validate` | `validate` |  | `backend/src/core/plugin/package/controllers/plugin-package.controller.ts:36` |
| `GET` | `/plugins` | `list` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:15` |
| `POST` | `/plugins` | `install` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:25` |
| `DELETE` | `/plugins/:id` | `remove` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:91` |
| `GET` | `/plugins/:id` | `getInstalled` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:30` |
| `GET` | `/plugins/:id/capabilities` | `capabilities` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:35` |
| `GET` | `/plugins/:id/diagnostics` | `diagnostics` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:40` |
| `GET` | `/plugins/:id/lifecycle` | `lifecycleStatus` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:55` |
| `POST` | `/plugins/:id/lifecycle` | `lifecycle` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:76` |
| `GET` | `/plugins/:id/load-report` | `loadReport` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:45` |
| `POST` | `/plugins/:id/rollback` | `rollback` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:68` |
| `POST` | `/plugins/:id/upgrade` | `upgrade` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:60` |
| `GET` | `/plugins/installed` | `installed` |  | `backend/src/core/plugin/controllers/plugin.controller.ts:20` |

## Components

| Kind | Class | Source |
|---|---|---|
| bootstrap-service | `PermissionBootstrapService` | `backend/src/core/plugin/bootstrap/permission-bootstrap.service.ts` |
| controller | `PluginController` | `backend/src/core/plugin/controllers/plugin.controller.ts` |
| controller | `PluginInstallerController` | `backend/src/core/plugin/installer/controllers/plugin-installer.controller.ts` |
| controller | `PluginMarketplaceController` | `backend/src/core/plugin/marketplace/controllers/plugin-marketplace.controller.ts` |
| controller | `PluginPackageController` | `backend/src/core/plugin/package/controllers/plugin-package.controller.ts` |
| search-provider | `PluginSearchProviderService` | `backend/src/core/plugin/plugin-search-provider.service.ts` |
| service | `PluginDependencyResolverService` | `backend/src/core/plugin/installer/dependency/plugin-dependency-resolver.service.ts` |
| service | `PluginDiscoveryService` | `backend/src/core/plugin/installer/discovery/plugin-discovery.service.ts` |
| service | `PluginInstallationManifestService` | `backend/src/core/plugin/installer/manifest/plugin-installation-manifest.service.ts` |
| service | `PluginInstallationRollbackService` | `backend/src/core/plugin/installer/rollback/plugin-installation-rollback.service.ts` |
| service | `PluginInstallerService` | `backend/src/core/plugin/installer/services/plugin-installer.service.ts` |
| service | `PluginLifecycleService` | `backend/src/core/plugin/lifecycle/plugin-lifecycle.service.ts` |
| service | `PluginLoaderService` | `backend/src/core/plugin/loader/plugin-loader.service.ts` |
| service | `PluginMarketplaceService` | `backend/src/core/plugin/marketplace/services/plugin-marketplace.service.ts` |
| service | `PluginMigrationRunnerService` | `backend/src/core/plugin/installer/migration/plugin-migration-runner.service.ts` |
| service | `PluginPackageArchiveService` | `backend/src/core/plugin/package/archive/plugin-package-archive.service.ts` |
| service | `PluginPackageExtractorService` | `backend/src/core/plugin/installer/archive/plugin-package-extractor.service.ts` |
| service | `PluginPackageService` | `backend/src/core/plugin/package/services/plugin-package.service.ts` |
| service | `PluginPackageValidatorService` | `backend/src/core/plugin/installer/validator/plugin-package-validator.service.ts` |
| service | `PluginService` | `backend/src/core/plugin/services/plugin.service.ts` |
| service | `PluginSignatureVerifierService` | `backend/src/core/plugin/installer/signature/plugin-signature-verifier.service.ts` |
| service | `PluginZipExtractorService` | `backend/src/core/plugin/installer/extractor/plugin-zip-extractor.service.ts` |
