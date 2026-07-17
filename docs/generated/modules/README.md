<!-- GENERATED FILE: DO NOT EDIT MANUALLY. -->

# PropertyOS Module Reference

This documentation is generated from the PropertyOS Knowledge Engine.

## Repository Summary

| Metric | Count |
|---|---:|
| Modules | 47 |
| Components | 179 |
| Controllers | 59 |
| Routes | 449 |
| Internal dependencies | 170 |
| Architecture violations | 16 |
| Critical modules | 4 |
| High-impact modules | 13 |

## Modules

| Module | Role | Location | Alignment | Criticality | Risk | Blast radius | Routes |
|---|---|---|---|---|---:|---:|---:|
| [`agreement`](agreement.md) | `business` | `core` | `violation` | `low` | 16.25 | 1 | 4 |
| [`communications`](communications.md) | `business` | `core` | `violation` | `medium` | 20.2 | 0 | 16 |
| [`facility`](facility.md) | `business` | `core` | `violation` | `low` | 19.45 | 0 | 9 |
| [`helpdesk`](helpdesk.md) | `business` | `core` | `violation` | `medium` | 20.35 | 0 | 17 |
| [`inventory`](inventory.md) | `business` | `core` | `violation` | `high` | 33.5 | 1 | 65 |
| [`invoice`](invoice.md) | `business` | `core` | `violation` | `low` | 14.85 | 1 | 3 |
| [`maintenance`](maintenance.md) | `business` | `core` | `violation` | `medium` | 21.75 | 0 | 9 |
| [`procurement`](procurement.md) | `business` | `core` | `violation` | `high` | 29.1 | 0 | 65 |
| [`receipt`](receipt.md) | `business` | `core` | `violation` | `low` | 14.5 | 1 | 3 |
| [`rent`](rent.md) | `business` | `core` | `violation` | `low` | 16.4 | 1 | 5 |
| [`report`](report.md) | `business` | `core` | `violation` | `medium` | 23.2 | 7 | 6 |
| [`reservation`](reservation.md) | `business` | `core` | `violation` | `medium` | 22.1 | 0 | 18 |
| [`staff`](staff.md) | `business` | `core` | `violation` | `medium` | 18.0 | 0 | 10 |
| [`tenant`](tenant.md) | `business` | `core` | `violation` | `low` | 16.75 | 1 | 5 |
| [`vehicle`](vehicle.md) | `business` | `core` | `violation` | `low` | 17.7 | 0 | 8 |
| [`vendor`](vendor.md) | `business` | `core` | `violation` | `high` | 20.25 | 0 | 40 |
| [`configuration:config`](configuration-config.md) | `configuration` | `configuration` | `aligned` | `low` | 0.25 | 0 | 0 |
| [`database:database`](database-database.md) | `database` | `database` | `aligned` | `critical` | 68.85 | 25 | 0 |
| [`database:postgres`](database-postgres.md) | `database` | `database` | `aligned` | `critical` | 136.75 | 43 | 0 |
| [`access-control`](access-control.md) | `platform` | `core` | `aligned` | `medium` | 13.65 | 0 | 12 |
| [`admin`](admin.md) | `platform` | `core` | `aligned` | `low` | 13.0 | 0 | 4 |
| [`ai`](ai.md) | `platform` | `core` | `aligned` | `low` | 2.5 | 0 | 2 |
| [`audit`](audit.md) | `platform` | `core` | `aligned` | `high` | 54.35 | 11 | 2 |
| [`auth`](auth.md) | `platform` | `core` | `aligned` | `high` | 51.85 | 11 | 1 |
| [`authorization`](authorization.md) | `platform` | `core` | `aligned` | `low` | 0.25 | 0 | 0 |
| [`bootstrap`](bootstrap.md) | `platform` | `core` | `aligned` | `low` | 2.5 | 0 | 2 |
| [`configuration`](configuration.md) | `platform` | `core` | `aligned` | `high` | 40.45 | 19 | 5 |
| [`credential`](credential.md) | `platform` | `core` | `aligned` | `low` | 9.95 | 1 | 6 |
| [`distribution`](distribution.md) | `platform` | `core` | `aligned` | `low` | 3.25 | 0 | 7 |
| [`document`](document.md) | `platform` | `core` | `aligned` | `low` | 6.2 | 0 | 7 |
| [`eventbus`](eventbus.md) | `platform` | `core` | `aligned` | `critical` | 144.1 | 33 | 0 |
| [`forms`](forms.md) | `platform` | `core` | `aligned` | `low` | 4.6 | 0 | 7 |
| [`health`](health.md) | `platform` | `core` | `aligned` | `low` | 13.65 | 0 | 4 |
| [`identity`](identity.md) | `platform` | `core` | `aligned` | `critical` | 124.55 | 34 | 18 |
| [`integration`](integration.md) | `platform` | `core` | `aligned` | `low` | 3.25 | 0 | 7 |
| [`metrics`](metrics.md) | `platform` | `core` | `aligned` | `low` | 8.3 | 1 | 4 |
| [`notification`](notification.md) | `platform` | `core` | `aligned` | `low` | 12.6 | 1 | 2 |
| [`platform`](platform.md) | `platform` | `core` | `aligned` | `medium` | 13.5 | 7 | 0 |
| [`plugin`](plugin.md) | `platform` | `core` | `aligned` | `high` | 85.1 | 16 | 21 |
| [`property`](property.md) | `platform` | `core` | `aligned` | `low` | 10.85 | 1 | 8 |
| [`scheduler`](scheduler.md) | `platform` | `core` | `aligned` | `medium` | 35.6 | 6 | 5 |
| [`search`](search.md) | `platform` | `core` | `aligned` | `high` | 87.85 | 22 | 2 |
| [`storage`](storage.md) | `platform` | `core` | `aligned` | `high` | 41.5 | 18 | 4 |
| [`theme`](theme.md) | `platform` | `core` | `aligned` | `medium` | 4.45 | 0 | 10 |
| [`upload`](upload.md) | `platform` | `core` | `aligned` | `low` | 4.4 | 0 | 1 |
| [`workflow`](workflow.md) | `platform` | `core` | `aligned` | `medium` | 28.45 | 4 | 11 |
| [`plugin:visitor`](plugin-visitor.md) | `plugin` | `plugin` | `aligned` | `medium` | 13.3 | 0 | 14 |

## Highest-Risk Modules

- [`eventbus`](eventbus.md): risk `144.1`, tier `critical`, blast radius `33`
- [`database:postgres`](database-postgres.md): risk `136.75`, tier `critical`, blast radius `43`
- [`identity`](identity.md): risk `124.55`, tier `critical`, blast radius `34`
- [`search`](search.md): risk `87.85`, tier `high`, blast radius `22`
- [`plugin`](plugin.md): risk `85.1`, tier `high`, blast radius `16`
- [`database:database`](database-database.md): risk `68.85`, tier `critical`, blast radius `25`
- [`audit`](audit.md): risk `54.35`, tier `high`, blast radius `11`
- [`auth`](auth.md): risk `51.85`, tier `high`, blast radius `11`
- [`storage`](storage.md): risk `41.5`, tier `high`, blast radius `18`
- [`configuration`](configuration.md): risk `40.45`, tier `high`, blast radius `19`

## Architecture Migration Candidates

- [`inventory`](inventory.md): risk `33.5`, tier `high`
- [`procurement`](procurement.md): risk `29.1`, tier `high`
- [`report`](report.md): risk `23.2`, tier `medium`
- [`reservation`](reservation.md): risk `22.1`, tier `medium`
- [`maintenance`](maintenance.md): risk `21.75`, tier `medium`
- [`helpdesk`](helpdesk.md): risk `20.35`, tier `medium`
- [`vendor`](vendor.md): risk `20.25`, tier `high`
- [`communications`](communications.md): risk `20.2`, tier `medium`
- [`facility`](facility.md): risk `19.45`, tier `low`
- [`staff`](staff.md): risk `18.0`, tier `medium`
- [`vehicle`](vehicle.md): risk `17.7`, tier `low`
- [`tenant`](tenant.md): risk `16.75`, tier `low`
- [`rent`](rent.md): risk `16.4`, tier `low`
- [`agreement`](agreement.md): risk `16.25`, tier `low`
- [`invoice`](invoice.md): risk `14.85`, tier `low`
- [`receipt`](receipt.md): risk `14.5`, tier `low`
