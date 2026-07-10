# Plugin Engine Module Design

## 1. Purpose

The Plugin Engine Module is responsible for managing plugins inside PropertyOS.

It allows PropertyOS to work like a WordPress-style platform where new business features can be added without changing the core system.

The Plugin Engine makes it possible to install, activate, deactivate, configure, update and remove plugins.

---

## 2. Why Plugin Engine Is Needed

PropertyOS Core must stay clean and industry-neutral.

Business features should live inside plugins.

Examples:

```text
Visitor Plugin
WhatsApp Plugin
RentOps Plugin
CommunityOS Plugin
CommercialOS Plugin
CoworkOS Plugin
Marketplace Plugin
```

Core should provide infrastructure.

Plugins should provide business capability.

---

## 3. Core Responsibilities

The Plugin Engine is responsible for:

1. Discovering plugins
2. Installing plugins
3. Activating plugins
4. Deactivating plugins
5. Updating plugins
6. Rolling back plugins
7. Storing plugin metadata
8. Storing plugin configuration
9. Registering plugin events
10. Registering plugin permissions
11. Registering plugin API routes
12. Registering plugin UI menu entries later

---

## 4. Initial Scope

Version 0.1 should support:

* Plugin metadata
* Plugin manifest file
* Plugin installation record
* Plugin activation
* Plugin deactivation
* Plugin configuration
* Plugin status
* Event Bus integration
* Admin visibility through backend API

Do not build marketplace now.

Do not build paid plugins now.

Do not build remote plugin repository now.

Do not build advanced rollback now.

---

## 5. Plugin Philosophy

PropertyOS should follow this rule:

```text
Core owns infrastructure.
Plugins own business logic.
```

Core examples:

```text
Identity
People
Property
Zone
Space
Event Bus
Notification
Document
Audit
Plugin Engine
```

Plugin examples:

```text
Visitor Management
WhatsApp Messaging
Rent Collection
Maintenance Ticketing
Community Polling
Coworking Desk Booking
Commercial Lease Management
```

---

## 6. Plugin Manifest

Every plugin must have a manifest file.

File name:

```text
plugin.json
```

Example:

```json
{
  "name": "visitor",
  "displayName": "Visitor Plugin",
  "version": "0.1.0",
  "description": "Visitor invitation, QR pass, check-in and check-out plugin.",
  "author": "PropertyOS",
  "type": "business",
  "main": "visitor.module.ts",
  "permissions": [
    "visitor.create",
    "visitor.read",
    "visitor.update",
    "visitor.delete"
  ],
  "eventsPublished": [
    "visitor.invited",
    "visitor.checked_in",
    "visitor.checked_out"
  ],
  "eventsSubscribed": [
    "notification.sent",
    "notification.failed"
  ],
  "dependencies": [
    "eventbus",
    "notification",
    "document",
    "audit"
  ],
  "configSchema": {
    "allowQrInvite": true,
    "defaultVisitDurationHours": 4,
    "notifyHostOnCheckIn": true
  }
}
```

---

## 7. Plugin Statuses

Supported statuses:

```text
installed
active
inactive
failed
uninstalled
```

Future statuses:

```text
updating
rollback_available
disabled_by_system
incompatible
```

---

## 8. Plugin Lifecycle

Basic lifecycle:

```text
Upload / Discover
      ↓
Install
      ↓
Inactive
      ↓
Activate
      ↓
Active
      ↓
Deactivate
      ↓
Inactive
      ↓
Uninstall
```

---

## 9. Plugin Installation Flow

```text
Admin uploads or selects plugin
      ↓
Plugin Engine reads plugin.json
      ↓
Validates manifest
      ↓
Checks dependencies
      ↓
Stores plugin metadata
      ↓
Marks plugin as installed
      ↓
Publishes plugin.installed
```

Version 0.1 can use local plugin folders instead of ZIP upload.

---

## 10. Plugin Activation Flow

```text
Admin activates plugin
      ↓
Plugin Engine checks plugin exists
      ↓
Checks dependencies
      ↓
Registers events
      ↓
Registers permissions
      ↓
Marks plugin as active
      ↓
Publishes plugin.activated
```

---

## 11. Plugin Deactivation Flow

```text
Admin deactivates plugin
      ↓
Plugin Engine disables plugin handlers
      ↓
Keeps plugin data
      ↓
Marks plugin as inactive
      ↓
Publishes plugin.deactivated
```

Important:

Deactivation should not delete plugin data.

---

## 12. Plugin Uninstall Flow

```text
Admin uninstalls plugin
      ↓
Plugin Engine checks safety rules
      ↓
Deactivates plugin if active
      ↓
Keeps or removes plugin data based on policy
      ↓
Marks plugin as uninstalled
      ↓
Publishes plugin.uninstalled
```

Version 0.1 can avoid hard delete.

Use soft uninstall.

---

## 13. Plugin Metadata Table

```sql
CREATE TABLE plugins (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  author VARCHAR(255),
  type VARCHAR(50) NOT NULL DEFAULT 'business',
  status VARCHAR(50) NOT NULL DEFAULT 'installed',
  manifest JSONB NOT NULL,
  config JSONB,
  installed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMP,
  deactivated_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 14. Plugin Configuration

Plugins may need configuration.

Examples:

```text
WhatsApp API key
Default visitor pass expiry
Enable QR code
Enable host approval
Default notification channel
```

Configuration should be stored as JSONB.

Sensitive values should be encrypted later.

Do not store secrets in plain text in production.

---

## 15. Plugin Permissions

Plugins may define permissions.

Example:

```text
visitor.create
visitor.read
visitor.update
visitor.delete
visitor.check_in
visitor.check_out
```

Plugin Engine should register these permissions with Identity/Permission module later.

Version 0.1 can store them in manifest only.

---

## 16. Plugin Events

Plugins may publish events.

Example:

```text
visitor.invited
visitor.checked_in
visitor.checked_out
```

Plugins may subscribe to events.

Example:

```text
visitor.invited
notification.sent
notification.failed
```

Plugin Engine should connect plugin event subscriptions to Event Bus.

---

## 17. Plugin Dependencies

Plugin dependencies are core modules or other plugins.

Example:

```json
{
  "dependencies": [
    "eventbus",
    "notification",
    "document",
    "audit"
  ]
}
```

Before activation, dependencies must be available.

If dependency is missing, activation should fail safely.

---

## 18. Backend Folder Structure

Recommended folder:

```text
backend/core/plugin/
├── README.md
├── Plugin-Engine-Module-Design.md
├── plugin.module.ts
├── plugin.service.ts
├── plugin.controller.ts
├── plugin.repository.ts
├── plugin.types.ts
├── plugin.constants.ts
├── plugin-manifest.validator.ts
├── plugin-loader.service.ts
├── plugin-config.service.ts
└── dto/
    ├── install-plugin.dto.ts
    ├── activate-plugin.dto.ts
    ├── deactivate-plugin.dto.ts
    └── update-plugin-config.dto.ts
```

---

## 19. Main Service Design

```ts
installPlugin(pluginPath: string): Promise<PluginRecord>

activatePlugin(pluginName: string): Promise<PluginRecord>

deactivatePlugin(pluginName: string): Promise<PluginRecord>

uninstallPlugin(pluginName: string): Promise<PluginRecord>

getPlugin(pluginName: string): Promise<PluginRecord | null>

listPlugins(): Promise<PluginRecord[]>

updatePluginConfig(pluginName: string, config: Record<string, any>): Promise<PluginRecord>
```

---

## 20. Plugin Record Type

```ts
export interface PluginRecord {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  type: PluginType;
  status: PluginStatus;
  manifest: PluginManifest;
  config?: Record<string, any>;
  installedAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
  updatedAt: Date;
}
```

---

## 21. Plugin Manifest Type

```ts
export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  type: PluginType;
  main: string;
  permissions?: string[];
  eventsPublished?: string[];
  eventsSubscribed?: string[];
  dependencies?: string[];
  configSchema?: Record<string, any>;
}
```

---

## 22. API Endpoints

Initial backend endpoints:

```text
GET    /core/plugin
GET    /core/plugin/:name
POST   /core/plugin/install
POST   /core/plugin/:name/activate
POST   /core/plugin/:name/deactivate
POST   /core/plugin/:name/uninstall
PATCH  /core/plugin/:name/config
```

Admin only.

---

## 23. Event Bus Integration

Plugin Engine should publish:

```text
plugin.installed
plugin.activated
plugin.deactivated
plugin.uninstalled
plugin.config_updated
plugin.failed
```

Plugin Engine may listen to:

```text
system.started
dependency.failed
```

---

## 24. Audit Integration

Audit Module should record:

```text
plugin.installed
plugin.activated
plugin.deactivated
plugin.uninstalled
plugin.config_updated
```

Plugin Engine should not directly write audit records.

It should publish events.

Audit Module should listen and record.

---

## 25. Notification Integration

Notification Module may notify admin when:

```text
Plugin activated
Plugin failed
Plugin deactivated
Plugin dependency missing
```

Plugin Engine should publish events.

Notification Module should react.

---

## 26. Admin Installable Requirement

Eventually, admin should be able to:

```text
Browse plugins
Upload plugin ZIP
Install plugin
Activate plugin
Deactivate plugin
Update plugin
Roll back plugin
Configure plugin
```

No server login should be required.

Version 0.1 may start with local plugin folder activation.

Admin-installable ZIP support can come later.

---

## 27. Local Plugin Folder Strategy

Initial plugins may live under:

```text
plugins/
├── visitor/
│   └── plugin.json
└── whatsapp/
    └── plugin.json
```

Plugin Engine can scan this folder.

This is enough for early development.

---

## 28. Plugin Safety Rules

Plugin Engine must protect the core.

Rules:

1. Plugin cannot modify core files directly.
2. Plugin cannot bypass permission checks.
3. Plugin cannot access secrets without permission.
4. Plugin cannot directly delete unrelated data.
5. Plugin activation must fail safely.
6. Plugin deactivation must preserve data.
7. Plugin uninstall must not delete user data without approval.
8. Plugin must declare permissions and events.

---

## 29. Security Considerations

Plugin risk is high because plugins extend the platform.

Important risks:

```text
Unsafe plugin code
Permission bypass
Data leakage
Secret exposure
Malicious plugin update
Broken plugin crash
Dependency confusion
```

Version 0.1 should remain conservative.

Only trusted local plugins should be supported initially.

Marketplace plugins should come much later.

---

## 30. Version Compatibility

Plugin manifest should later support:

```json
{
  "propertyosVersion": ">=0.1.0"
}
```

Version 0.1 can skip strict compatibility rules.

---

## 31. Plugin Data Ownership

Plugin data belongs to the user/property owner.

Even if a plugin is deactivated:

```text
Plugin data must remain safe.
```

Uninstall must clearly define whether data is:

```text
kept
archived
deleted after approval
```

Version 0.1 should keep data.

---

## 32. Visitor Plugin Example

Visitor Plugin uses:

```text
People Core
Property Core
Space Core
Event Bus
Notification Module
Document Module
Audit Module
```

It publishes:

```text
visitor.invited
visitor.checked_in
visitor.checked_out
```

It may create:

```text
Visitor record
QR pass
Visitor history
```

---

## 33. WhatsApp Plugin Example

WhatsApp Plugin uses:

```text
Notification Module
Event Bus
```

It may subscribe to:

```text
notification.requested
visitor.invited
visitor.checked_in
visitor.checked_out
```

It may publish:

```text
whatsapp.message_sent
whatsapp.message_failed
```

---

## 34. Non-Goals

The Plugin Engine should not:

* Become a marketplace in version 0.1
* Manage payments
* Approve third-party plugins
* Execute untrusted remote code
* Replace Event Bus
* Replace Notification Module
* Replace Identity Module
* Contain visitor business logic
* Contain rent collection logic

It only manages plugin lifecycle and integration.

---

## 35. Future Enhancements

Later versions may support:

```text
Plugin ZIP upload
Plugin marketplace
Plugin signature verification
Plugin sandboxing
Plugin dependency resolver
Plugin update manager
Plugin rollback
Plugin health checks
Plugin billing
Plugin ratings
Plugin developer portal
Theme installation
Remote plugin repository
```

Do not build these now.

---

## 36. Version 0.1 Success Criteria

The Plugin Engine is successful when:

1. Plugin metadata can be stored.
2. Plugin manifest can be validated.
3. Plugin can be installed.
4. Plugin can be activated.
5. Plugin can be deactivated.
6. Plugin config can be saved.
7. Plugin events are registered.
8. Plugin status can be viewed through backend API.
9. Visitor Plugin can be represented as a plugin.
10. WhatsApp Plugin can be represented as a plugin.
11. Plugin Engine publishes lifecycle events.
12. Audit Module can record plugin lifecycle events.

---

## 37. Simple Mental Model

Think of Plugin Engine as the WordPress plugin manager of PropertyOS.

Core says:

```text
I provide the platform.
```

Plugin says:

```text
I provide one business feature.
```

Admin says:

```text
Install, activate, configure or deactivate this plugin.
```

Plugin Engine makes that possible safely.

That is the purpose of the Plugin Engine.

