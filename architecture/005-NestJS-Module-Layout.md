# NestJS Module Layout

## PropertyOS Backend Version 0.1

---

# Purpose

This document defines the backend folder and module structure for PropertyOS Core using NestJS.

The goal is to make the backend:

* Modular
* Plugin-friendly
* Event-driven
* Easy for AI agents to scaffold
* Easy for humans to understand
* Ready for future plugins and distributions

---

# Backend Root Structure

```text
backend/
├── README.md
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── database/
│   ├── common/
│   ├── core/
│   └── plugins/
└── test/
```

---

# Source Folder Structure

```text
backend/src/
├── main.ts
├── app.module.ts
├── config/
├── database/
├── common/
├── core/
└── plugins/
```

---

# Config Module

```text
backend/src/config/
├── config.module.ts
├── config.service.ts
└── env.validation.ts
```

Responsibilities:

* Read environment variables
* Validate required configuration
* Provide config values to modules

---

# Database Module

```text
backend/src/database/
├── database.module.ts
├── database.provider.ts
├── migrations/
└── seeds/
```

Responsibilities:

* PostgreSQL connection
* Migration support
* Seed data
* Future backup hooks

---

# Common Module

```text
backend/src/common/
├── decorators/
├── filters/
├── guards/
├── interceptors/
├── middleware/
├── pipes/
├── types/
└── utils/
```

Responsibilities:

* Shared decorators
* Guards
* Error filters
* Validation pipes
* Utility functions
* Common response format

---

# Core Modules

```text
backend/src/core/
├── identity/
├── people/
├── property/
├── eventbus/
├── notification/
├── document/
├── plugin/
├── audit/
└── ai/
```

---

# Identity Module

```text
backend/src/core/identity/
├── identity.module.ts
├── identity.service.ts
├── identity.controller.ts
├── identity.repository.ts
├── identity.types.ts
├── dto/
└── entities/
```

Responsibilities:

* User accounts
* Login
* Roles
* Permissions
* Auth guards
* Access control

---

# People Module

```text
backend/src/core/people/
├── people.module.ts
├── people.service.ts
├── people.controller.ts
├── people.repository.ts
├── people.types.ts
├── dto/
└── entities/
```

Responsibilities:

* Person records
* Organization members
* Property members
* Contact information

---

# Property Module

```text
backend/src/core/property/
├── property.module.ts
├── property.service.ts
├── property.controller.ts
├── property.repository.ts
├── property.types.ts
├── dto/
└── entities/
```

Responsibilities:

* Organizations
* Properties
* Zones
* Spaces
* Assets

---

# Event Bus Module

```text
backend/src/core/eventbus/
├── eventbus.module.ts
├── eventbus.service.ts
├── eventbus.controller.ts
├── eventbus.repository.ts
├── eventbus.types.ts
├── eventbus.constants.ts
├── dto/
└── entities/
```

Responsibilities:

* Event publishing
* Event subscription
* Event logging
* Internal communication backbone

---

# Notification Module

```text
backend/src/core/notification/
├── notification.module.ts
├── notification.service.ts
├── notification.controller.ts
├── notification.repository.ts
├── notification.types.ts
├── notification.constants.ts
├── notification-template.service.ts
├── providers/
├── dto/
└── entities/
```

Responsibilities:

* Notification requests
* WhatsApp-first channel
* Email placeholder
* SMS placeholder
* Notification logs
* Event-based notification handling

---

# Document Module

```text
backend/src/core/document/
├── document.module.ts
├── document.service.ts
├── document.controller.ts
├── document.repository.ts
├── document.types.ts
├── document.constants.ts
├── storage/
├── dto/
└── entities/
```

Responsibilities:

* Upload
* Download
* Metadata
* Entity attachment
* Storage providers
* Document events

---

# Plugin Engine Module

```text
backend/src/core/plugin/
├── plugin.module.ts
├── plugin.service.ts
├── plugin.controller.ts
├── plugin.repository.ts
├── plugin.types.ts
├── plugin.constants.ts
├── plugin-manifest.validator.ts
├── plugin-loader.service.ts
├── plugin-config.service.ts
├── dto/
└── entities/
```

Responsibilities:

* Plugin manifest
* Install
* Activate
* Deactivate
* Config
* Plugin lifecycle events

---

# Audit Module

```text
backend/src/core/audit/
├── audit.module.ts
├── audit.service.ts
├── audit.controller.ts
├── audit.repository.ts
├── audit.types.ts
├── audit.constants.ts
├── dto/
└── entities/
```

Responsibilities:

* Audit logs
* Event-based audit recording
* Search
* Immutable history

---

# AI Module

```text
backend/src/core/ai/
├── ai.module.ts
├── ai.service.ts
├── ai-provider.interface.ts
├── providers/
└── dto/
```

Responsibilities:

* AI provider abstraction
* Future agent layer
* OpenAI / Claude / Qwen / DeepSeek compatibility later

Version 0.1 can keep this as a placeholder.

---

# Plugins Folder

```text
backend/src/plugins/
├── visitor/
└── whatsapp/
```

Initial plugins:

```text
visitor
whatsapp
```

Each plugin should have:

```text
plugin.json
plugin.module.ts
plugin.service.ts
plugin.controller.ts
plugin.types.ts
dto/
entities/
```

---

# Visitor Plugin Folder

```text
backend/src/plugins/visitor/
├── plugin.json
├── visitor.module.ts
├── visitor.service.ts
├── visitor.controller.ts
├── visitor.repository.ts
├── visitor.types.ts
├── dto/
└── entities/
```

Responsibilities:

* Invite visitor
* Generate QR
* Check-in
* Check-out
* Visitor history
* Publish visitor events

---

# WhatsApp Plugin Folder

```text
backend/src/plugins/whatsapp/
├── plugin.json
├── whatsapp.module.ts
├── whatsapp.service.ts
├── whatsapp.controller.ts
├── whatsapp.provider.ts
├── whatsapp.types.ts
├── dto/
└── entities/
```

Responsibilities:

* Send WhatsApp messages
* Listen to notification requests
* Publish WhatsApp message events

---

# App Module Composition

```ts
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,

    IdentityModule,
    PeopleModule,
    PropertyModule,
    EventBusModule,
    NotificationModule,
    DocumentModule,
    PluginModule,
    AuditModule,
    AiModule,
  ],
})
export class AppModule {}
```

Plugins should not be hardcoded forever.

For version 0.1, Visitor and WhatsApp plugins can be manually imported or registered through Plugin Engine.

---

# Module Dependency Rules

Allowed dependency direction:

```text
Core Infrastructure
      ↓
Core Modules
      ↓
Plugins
```

Plugins may use Core.

Core should not depend on plugins.

Bad:

```text
Notification Core directly imports Visitor Plugin
```

Good:

```text
Visitor Plugin publishes visitor.invited
Notification Core listens and reacts
```

---

# Event-Driven Rule

Modules should communicate through Event Bus wherever direct dependency is not required.

Example:

```text
Visitor Plugin
   ↓ publishes visitor.invited
Event Bus
   ↓
Notification Module
   ↓
WhatsApp Plugin
   ↓
Audit Module
```

---

# API Route Convention

Use this pattern:

```text
/core/{module}
```

Examples:

```text
/core/property
/core/people
/core/eventbus
/core/notification
/core/document
/core/plugin
/core/audit
```

Plugin routes:

```text
/plugins/{pluginName}
```

Examples:

```text
/plugins/visitor
/plugins/whatsapp
```

---

# DTO Rule

All incoming request payloads must use DTO files.

Example:

```text
create-property.dto.ts
update-person.dto.ts
send-notification.dto.ts
activate-plugin.dto.ts
```

No raw request body should be passed directly to services.

---

# Entity Rule

Each table should have an entity/model representation.

Example:

```text
property.entity.ts
person.entity.ts
event-log.entity.ts
notification-log.entity.ts
plugin.entity.ts
audit-log.entity.ts
```

---

# Repository Rule

Database access should go through repository layer.

Controller should not directly query database.

Service should not contain raw SQL unless required.

Preferred flow:

```text
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
```

---

# Controller Rule

Controllers should be thin.

They should:

* Accept request
* Validate DTO
* Call service
* Return response

They should not contain business logic.

---

# Service Rule

Services contain business logic.

Examples:

* Create property
* Invite visitor
* Send notification
* Activate plugin
* Record audit

---

# Constants Rule

Event names, statuses and permission codes should live in constants files.

Examples:

```text
eventbus.constants.ts
plugin.constants.ts
notification.constants.ts
audit.constants.ts
```

---

# Version 0.1 Backend Build Order

Recommended implementation order:

```text
1. Config Module
2. Database Module
3. Common Module
4. Identity Module
5. People Module
6. Property Module
7. Event Bus Module
8. Notification Module
9. Document Module
10. Plugin Engine Module
11. Audit Module
12. Visitor Plugin
13. WhatsApp Plugin
```

---

# Version 0.1 Success Criteria

NestJS backend layout is successful when:

1. Backend starts successfully.
2. All core modules are registered.
3. Database connects.
4. Basic health endpoint works.
5. Core routes follow `/core/*`.
6. Plugin routes follow `/plugins/*`.
7. Event Bus can be injected into modules.
8. Notification can listen to events.
9. Audit can record events.
10. Visitor Plugin can publish events.
11. WhatsApp Plugin can send placeholder messages.
12. Code layout is understandable by AI agents and human developers.

---

# Simple Mental Model

Think of NestJS backend as the engine room of PropertyOS.

Core modules are the permanent machines.

Plugins are add-on machines.

Event Bus is the wiring.

Database is the storage.

Notification is the communication line.

Audit is the black box recorder.

Plugin Engine is the installer.

Everything should have a clear place.

