# Plugin SDK Design

## PropertyOS Version 0.1

---

# Purpose

The Plugin SDK defines how plugins are built, packaged, installed and integrated into PropertyOS.

The goal is to allow developers to extend PropertyOS without modifying Core.

The SDK should provide:

* Consistency
* Predictability
* Security
* Upgradeability
* Plugin portability

---

# Design Principles

PropertyOS follows one fundamental rule:

```text
Core owns infrastructure.
Plugins own business logic.
```

Core provides:

```text
Identity
People
Property
Event Bus
Notification
Document
Audit
Plugin Engine
```

Plugins provide:

```text
Visitor Management
WhatsApp Messaging
Rent Collection
Maintenance
Community Features
Coworking Features
Commercial Features
```

---

# Plugin Structure

Every plugin must follow the same layout.

```text
plugin-name/
├── plugin.json
├── README.md
├── plugin.module.ts
├── plugin.service.ts
├── plugin.controller.ts
├── plugin.types.ts
├── dto/
├── entities/
└── migrations/
```

---

# Plugin Manifest

Every plugin must contain:

```text
plugin.json
```

Example:

```json
{
  "name": "visitor",
  "displayName": "Visitor Plugin",
  "version": "0.1.0",
  "description": "Visitor management plugin",
  "author": "PropertyOS",
  "type": "business",
  "main": "plugin.module.ts",
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
    "notification.sent"
  ],
  "dependencies": [
    "eventbus",
    "notification",
    "document",
    "audit"
  ]
}
```

---

# Required Manifest Fields

Mandatory:

```text
name
displayName
version
type
main
```

Optional:

```text
description
author
permissions
eventsPublished
eventsSubscribed
dependencies
configSchema
```

---

# Plugin Types

Initial types:

```text
business
integration
communication
workflow
analytics
utility
```

Examples:

```text
Visitor Plugin       → business
WhatsApp Plugin      → communication
Google Calendar      → integration
Reporting Plugin     → analytics
```

---

# Plugin Lifecycle

Supported lifecycle:

```text
Install
Activate
Deactivate
Update
Uninstall
```

Flow:

```text
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
```

---

# Plugin Context

Plugins receive a PropertyOS context.

Example:

```ts
export interface PluginContext {
  eventBus: EventBusService;
  notificationService: NotificationService;
  documentService: DocumentService;
  auditService: AuditService;
}
```

Plugins should use context services instead of creating their own implementations.

---

# Event Bus Integration

Plugins should communicate through events.

Publish:

```ts
eventBus.publish({
  name: "visitor.invited",
  source: "visitor-plugin",
  payload: {}
});
```

Subscribe:

```ts
eventBus.subscribe(
  "notification.sent",
  handler
);
```

---

# Notification Integration

Plugins should request notifications.

Example:

```ts
notificationService.send({
  channel: "whatsapp",
  templateKey: "visitor_invite"
});
```

Plugins should not directly call WhatsApp APIs.

---

# Document Integration

Plugins should use:

```ts
documentService.upload()
documentService.download()
documentService.listDocuments()
```

Plugins should not create separate file storage systems.

---

# Audit Integration

Plugins should publish events.

Audit Module records history.

Bad:

```text
Plugin writes directly to audit table.
```

Good:

```text
Plugin publishes event.
Audit module records event.
```

---

# Permission Integration

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

Permissions become available through Identity Module.

---

# Route Convention

Plugin routes should use:

```text
/plugins/{plugin-name}
```

Examples:

```text
/plugins/visitor
/plugins/whatsapp
```

Avoid:

```text
/api/visitor
/api/vms
```

Use a predictable structure.

---

# Database Strategy

Plugins may have their own tables.

Example:

```text
visitor_records
visitor_invites
visitor_history
```

Rules:

1. Plugin tables must be prefixed logically.
2. Plugin tables must not modify core tables directly.
3. Plugin migrations should be isolated.

---

# DTO Rule

Every incoming request must use DTOs.

Example:

```text
create-visitor.dto.ts
check-in-visitor.dto.ts
```

No raw request body processing.

---

# Entity Rule

Plugin entities should be isolated.

Example:

```text
visitor.entity.ts
visitor-history.entity.ts
visitor-invite.entity.ts
```

Do not place plugin entities inside Core modules.

---

# Service Rule

Business logic belongs in services.

Example:

```text
Invite visitor
Generate QR
Check-in visitor
Check-out visitor
```

Controllers remain thin.

---

# Configuration Schema

Plugins may expose configurable settings.

Example:

```json
{
  "allowQrInvite": true,
  "hostApprovalRequired": false,
  "defaultVisitDurationHours": 4
}
```

Configuration stored in Plugin Engine.

---

# Dependency Rules

Plugins may depend on:

```text
Core Modules
Other Plugins
```

Example:

```json
{
  "dependencies": [
    "eventbus",
    "notification"
  ]
}
```

Activation should fail if dependencies are unavailable.

---

# Security Rules

Plugins must not:

```text
Modify Core files
Bypass permissions
Read secrets directly
Delete unrelated data
Disable audit
Disable event logging
```

All plugins operate within PropertyOS boundaries.

---

# Plugin Packaging

Version 0.1:

```text
Local folder based plugins
```

Future:

```text
ZIP upload
Marketplace distribution
Signed packages
```

Do not implement ZIP installation now.

---

# Plugin Metadata API

Plugin Engine should expose:

```text
GET /core/plugin
GET /core/plugin/:name
POST /core/plugin/install
POST /core/plugin/:name/activate
POST /core/plugin/:name/deactivate
```

Plugins should not expose installation endpoints themselves.

---

# Plugin Example: Visitor Plugin

Publishes:

```text
visitor.invited
visitor.checked_in
visitor.checked_out
```

Permissions:

```text
visitor.create
visitor.read
visitor.check_in
visitor.check_out
```

Dependencies:

```text
eventbus
notification
document
audit
```

---

# Plugin Example: WhatsApp Plugin

Subscribes:

```text
notification.requested
visitor.invited
visitor.checked_in
```

Publishes:

```text
whatsapp.message_sent
whatsapp.message_failed
```

Dependencies:

```text
eventbus
notification
```

---

# Plugin Development Workflow

```text
1. Create plugin folder
2. Create plugin.json
3. Define permissions
4. Define events
5. Create DTOs
6. Create entities
7. Create services
8. Register routes
9. Test activation
10. Publish plugin events
```

---

# Plugin Versioning

Semantic versioning:

```text
MAJOR.MINOR.PATCH
```

Examples:

```text
0.1.0
0.2.0
1.0.0
```

---

# Future Enhancements

Later support:

```text
Plugin marketplace
ZIP installation
Plugin signatures
Dependency resolver
Plugin ratings
Plugin billing
Plugin sandboxing
Remote repository
```

Not required for Version 0.1.

---

# Version 0.1 Success Criteria

The SDK is successful when:

1. A plugin structure is defined.
2. Manifest format is defined.
3. Plugin lifecycle is defined.
4. Event integration is defined.
5. Notification integration is defined.
6. Document integration is defined.
7. Permission integration is defined.
8. Visitor Plugin can be built using the SDK.
9. WhatsApp Plugin can be built using the SDK.
10. Future plugins follow the same pattern.

---

# Simple Mental Model

Think of the SDK as the constitution for plugin developers.

Core says:

```text
Here are the rules.
```

Plugin developers say:

```text
I will build my feature using these rules.
```

As long as every plugin follows the SDK, PropertyOS remains modular, predictable and maintainable.

