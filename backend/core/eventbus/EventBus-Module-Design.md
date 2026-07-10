# Event Bus Module Design

## 1. Purpose

The Event Bus Module is the internal communication backbone of PropertyOS.

It allows core modules and plugins to communicate without directly depending on each other.

PropertyOS must remain:

* Modular
* Plugin-friendly
* API-first
* Event-driven
* Easy to extend

The Event Bus makes this possible.

---

## 2. Why Event Bus Is Needed

Without an event bus, modules will call each other directly.

Example:

```text
Visitor Plugin → Notification Module
Visitor Plugin → Audit Module
Visitor Plugin → WhatsApp Plugin
Visitor Plugin → Document Module
```

This creates tight coupling.

With Event Bus:

```text
Visitor Plugin publishes event:
visitor.invited

Other modules listen:
Notification Module
Audit Module
WhatsApp Plugin
Document Module
```

The Visitor Plugin does not need to know who is listening.

---

## 3. Core Responsibilities

The Event Bus Module is responsible for:

1. Publishing events
2. Subscribing to events
3. Delivering events to handlers
4. Recording event history
5. Supporting plugin events
6. Supporting core module events
7. Supporting future async processing
8. Supporting retry and failure tracking later

---

## 4. Initial Scope

For the first version, keep the Event Bus simple.

Version 0.1 should support:

* In-process event publishing
* Event name
* Event payload
* Event source
* Event timestamp
* Event metadata
* Basic event log table
* Module-level handlers

Do not build complex message queues now.

Do not add Kafka, RabbitMQ, NATS, or Redis Streams in version 0.1.

---

## 5. Event Naming Convention

Use dot-separated event names.

Format:

```text
domain.action
```

Examples:

```text
property.created
zone.created
space.created
person.created
visitor.invited
visitor.checked_in
visitor.checked_out
notification.sent
plugin.installed
plugin.activated
plugin.deactivated
document.uploaded
audit.recorded
```

For plugin events:

```text
plugin.<pluginName>.<action>
```

Example:

```text
plugin.visitor.invited
plugin.whatsapp.message_sent
```

---

## 6. Event Object Structure

Each event should follow a standard structure.

```ts
export interface PropertyOSEvent<TPayload = any> {
  id: string;
  name: string;
  source: string;
  payload: TPayload;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

Example:

```json
{
  "id": "evt_123456",
  "name": "visitor.invited",
  "source": "visitor-plugin",
  "payload": {
    "visitorId": "vis_001",
    "hostPersonId": "person_001",
    "propertyId": "property_001",
    "visitDate": "2026-07-01"
  },
  "metadata": {
    "triggeredBy": "admin",
    "requestId": "req_001"
  },
  "createdAt": "2026-07-01T10:00:00Z"
}
```

---

## 7. Event Sources

Event source identifies where the event came from.

Examples:

```text
property-core
identity-core
people-core
visitor-plugin
whatsapp-plugin
notification-core
document-core
plugin-engine
audit-core
```

Source names must be simple and predictable.

---

## 8. Event Categories

PropertyOS events can be grouped into the following categories:

### 8.1 Core Events

Events created by core modules.

Examples:

```text
property.created
space.updated
person.created
role.assigned
permission.updated
```

### 8.2 Plugin Events

Events created by installed plugins.

Examples:

```text
visitor.invited
visitor.checked_in
visitor.checked_out
```

### 8.3 System Events

Events created by platform operations.

Examples:

```text
plugin.installed
plugin.activated
plugin.deactivated
system.backup_completed
system.error_detected
```

### 8.4 Notification Events

Events related to communication.

Examples:

```text
notification.requested
notification.sent
notification.failed
whatsapp.message_sent
email.sent
```

### 8.5 Audit Events

Events related to recording system activity.

Examples:

```text
audit.recorded
security.access_denied
login.failed
```

---

## 9. Event Flow

Basic flow:

```text
Module or Plugin
      ↓
EventBus.publish()
      ↓
Event Log
      ↓
Registered Handlers
      ↓
Other Modules / Plugins react
```

Example:

```text
Visitor Plugin invites visitor
      ↓
Publishes visitor.invited
      ↓
Notification Module sends WhatsApp
      ↓
Audit Module records action
      ↓
Document Module may attach invite document later
```

---

## 10. Backend Folder Structure

Recommended folder:

```text
backend/core/eventbus/
├── README.md
├── EventBus-Module-Design.md
├── eventbus.module.ts
├── eventbus.service.ts
├── eventbus.types.ts
├── eventbus.constants.ts
├── eventbus.controller.ts
├── eventbus.repository.ts
└── dto/
    └── publish-event.dto.ts
```

---

## 11. Main Service Design

The main service should expose:

```ts
publish(event: PropertyOSEvent): Promise<void>

subscribe(eventName: string, handler: EventHandler): void

unsubscribe(eventName: string, handlerId: string): void

getEventLog(): Promise<PropertyOSEvent[]>
```

Handler type:

```ts
export type EventHandler = (event: PropertyOSEvent) => Promise<void>;
```

---

## 12. Publishing Events

Example usage:

```ts
await eventBus.publish({
  id: randomUUID(),
  name: 'visitor.invited',
  source: 'visitor-plugin',
  payload: {
    visitorId,
    hostPersonId,
    propertyId,
  },
  metadata: {
    triggeredBy: currentUserId,
  },
  createdAt: new Date(),
});
```

---

## 13. Subscribing To Events

Example:

```ts
eventBus.subscribe('visitor.invited', async (event) => {
  await notificationService.sendVisitorInvite(event.payload);
});
```

Another example:

```ts
eventBus.subscribe('visitor.checked_in', async (event) => {
  await auditService.record({
    action: 'Visitor checked in',
    data: event.payload,
  });
});
```

---

## 14. Event Log Table

Initial database table:

```sql
CREATE TABLE event_logs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Initial statuses:

```text
published
handled
failed
```

In version 0.1, status can remain `published`.

More advanced delivery tracking can come later.

---

## 15. Event Delivery Rules

Version 0.1 rules:

1. Event must be saved before handlers run.
2. Handler failure must not stop the whole system.
3. Failed handlers should be logged.
4. Event payload should not contain passwords or secrets.
5. Events should be small.
6. Large files must not be passed through events.
7. Events should contain IDs and context, not full database dumps.

---

## 16. Plugin Usage

Plugins must not directly call unrelated core modules when an event is enough.

Example:

Visitor Plugin should publish:

```text
visitor.invited
```

Then Notification Module or WhatsApp Plugin can react.

This keeps plugins clean and installable.

---

## 17. Event Bus And Plugin Engine

The Plugin Engine will use Event Bus for:

```text
plugin.installed
plugin.activated
plugin.deactivated
plugin.updated
plugin.rollback_completed
```

Plugins can also register handlers during activation.

Example:

```text
WhatsApp Plugin subscribes to visitor.invited
```

When Visitor Plugin publishes `visitor.invited`, WhatsApp Plugin sends the message.

---

## 18. Event Bus And Notification Module

Notification Module listens to events such as:

```text
notification.requested
visitor.invited
visitor.checked_in
visitor.checked_out
```

It may publish:

```text
notification.sent
notification.failed
```

---

## 19. Event Bus And Audit Module

Audit Module can listen to important events and record them.

Examples:

```text
property.created
person.created
visitor.invited
visitor.checked_in
plugin.activated
login.failed
permission.updated
```

Audit should not block the main event flow.

If audit fails, the event should still continue.

---

## 20. Security Considerations

Events must not expose sensitive information.

Do not include:

* Passwords
* Access tokens
* Private keys
* Full identity documents
* Payment card details
* Unmasked personal secrets

Use IDs instead.

Example:

Good:

```json
{
  "personId": "person_001"
}
```

Bad:

```json
{
  "aadhaarNumber": "1234-5678-9999",
  "password": "secret"
}
```

---

## 21. Future Enhancements

Later versions may support:

* Redis queue
* RabbitMQ
* Kafka
* Retry policy
* Dead letter queue
* Event replay
* Webhook subscriptions
* External integrations
* Event schema registry
* Event versioning
* Admin event viewer
* Plugin event permissions

Do not build these now.

---

## 22. Version 0.1 Success Criteria

The Event Bus Module is successful when:

1. Core module can publish an event.
2. Plugin can publish an event.
3. Another module can subscribe to that event.
4. Event is saved in database.
5. Handler can process the event.
6. Handler failure does not crash the system.
7. Event log can be viewed through backend API.
8. Visitor Plugin can publish `visitor.invited`.
9. Notification Module can react to `visitor.invited`.
10. Audit Module can record important events.

---

## 23. First Events To Support

Initial required events:

```text
property.created
zone.created
space.created
person.created
organization.created
plugin.installed
plugin.activated
plugin.deactivated
visitor.invited
visitor.checked_in
visitor.checked_out
notification.sent
notification.failed
audit.recorded
```

---

## 24. API Endpoints

Initial admin/debug endpoints:

```text
POST /core/eventbus/publish
GET  /core/eventbus/events
GET  /core/eventbus/events/:id
```

These endpoints are mainly for development and admin visibility.

Production plugins should normally use internal service calls, not public event publishing APIs.

---

## 25. Non-Goals

The Event Bus Module should not:

* Send WhatsApp messages directly
* Send emails directly
* Store documents
* Manage plugins
* Manage permissions
* Replace audit logs
* Replace notification service
* Become a business workflow engine

It is only the communication backbone.

---

## 26. Simple Mental Model

Think of Event Bus as the announcement system inside PropertyOS.

A module says:

```text
“Visitor invited.”
```

Other modules decide what to do.

Notification says:

```text
“I will send WhatsApp.”
```

Audit says:

```text
“I will record this.”
```

Plugin Engine says:

```text
“I will notify active plugins.”
```

The original module does not need to manage all of this.

That is the purpose of the Event Bus.

