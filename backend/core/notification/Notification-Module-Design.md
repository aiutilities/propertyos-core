# Notification Module Design

## 1. Purpose

The Notification Module is responsible for sending messages from PropertyOS to people.

It supports communication between:

* Admin and user
* Host and visitor
* Security and host
* System and admin
* Plugin and user

The Notification Module should not contain business logic.

It should only receive notification requests, choose the correct channel, send the message, and record the result.

---

## 2. Why Notification Module Is Needed

PropertyOS will support many communication channels.

Examples:

* WhatsApp
* Email
* SMS
* Push notification
* In-app notification

Instead of every module sending messages directly, all modules should request notification through one common module.

Example:

```text
Visitor Plugin → Notification Module → WhatsApp Plugin
```

This keeps the system clean and plugin-friendly.

---

## 3. Core Responsibilities

The Notification Module is responsible for:

1. Accepting notification requests
2. Choosing notification channel
3. Sending notification through available provider or plugin
4. Recording notification status
5. Supporting templates
6. Publishing notification events
7. Handling failures safely
8. Supporting future retries

---

## 4. Initial Scope

Version 0.1 should support:

* Notification request object
* WhatsApp-first notification flow
* Email placeholder
* SMS placeholder
* In-app placeholder
* Notification log table
* Status tracking
* Event Bus integration
* Template key support

Do not build complex campaigns now.

Do not build marketing automation now.

Do not build bulk broadcast now.

---

## 5. Channels

Supported channels for version 0.1:

```text
whatsapp
email
sms
in_app
```

Primary channel:

```text
whatsapp
```

WhatsApp is first-class because PropertyOS is built for emerging markets where WhatsApp is commonly used for property operations.

---

## 6. Notification Object Structure

Standard notification request:

```ts
export interface NotificationRequest<TData = any> {
  id: string;
  channel: NotificationChannel;
  recipientType: RecipientType;
  recipientId?: string;
  recipientAddress?: string;
  templateKey: string;
  data: TData;
  priority: NotificationPriority;
  source: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

Supporting types:

```ts
export type NotificationChannel =
  | 'whatsapp'
  | 'email'
  | 'sms'
  | 'in_app';

export type RecipientType =
  | 'person'
  | 'organization'
  | 'external';

export type NotificationPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';
```

---

## 7. Example Notification Request

```json
{
  "id": "noti_001",
  "channel": "whatsapp",
  "recipientType": "person",
  "recipientId": "person_001",
  "recipientAddress": "+919999999999",
  "templateKey": "visitor_invite",
  "data": {
    "visitorName": "Ravi",
    "hostName": "Anand",
    "propertyName": "Advaith's Nest",
    "visitDate": "2026-07-01",
    "qrCodeUrl": "https://example.com/qr/123"
  },
  "priority": "normal",
  "source": "visitor-plugin",
  "metadata": {
    "eventName": "visitor.invited"
  },
  "createdAt": "2026-07-01T10:00:00Z"
}
```

---

## 8. Notification Flow

Basic flow:

```text
Module or Plugin
      ↓
Requests notification
      ↓
Notification Module
      ↓
Finds channel
      ↓
Uses provider/plugin
      ↓
Records status
      ↓
Publishes event
```

Visitor example:

```text
Visitor Plugin publishes visitor.invited
      ↓
Notification Module listens
      ↓
Creates WhatsApp notification
      ↓
WhatsApp Plugin sends message
      ↓
Notification Module records sent/failed
      ↓
Event Bus publishes notification.sent or notification.failed
```

---

## 9. Event Bus Integration

Notification Module should listen to selected events.

Initial events to listen:

```text
visitor.invited
visitor.checked_in
visitor.checked_out
system.error_detected
plugin.activated
plugin.deactivated
```

Notification Module should publish:

```text
notification.requested
notification.sent
notification.failed
notification.skipped
```

---

## 10. First Notification Templates

Initial template keys:

```text
visitor_invite
visitor_checked_in_host_alert
visitor_checked_out_host_alert
plugin_activated_admin_alert
plugin_deactivated_admin_alert
system_error_admin_alert
```

Example template:

```text
visitor_invite

Hello {{visitorName}}, you are invited to visit {{propertyName}} on {{visitDate}}.
Please show this QR code at security: {{qrCodeUrl}}
```

---

## 11. Backend Folder Structure

Recommended folder:

```text
backend/core/notification/
├── README.md
├── Notification-Module-Design.md
├── notification.module.ts
├── notification.service.ts
├── notification.types.ts
├── notification.constants.ts
├── notification.controller.ts
├── notification.repository.ts
├── notification-template.service.ts
├── providers/
│   ├── notification-provider.interface.ts
│   ├── whatsapp.provider.ts
│   ├── email.provider.ts
│   ├── sms.provider.ts
│   └── in-app.provider.ts
└── dto/
    └── send-notification.dto.ts
```

---

## 12. Main Service Design

The main service should expose:

```ts
send(request: NotificationRequest): Promise<NotificationResult>

sendWhatsApp(request: NotificationRequest): Promise<NotificationResult>

sendEmail(request: NotificationRequest): Promise<NotificationResult>

getNotificationLog(): Promise<NotificationLog[]>

getNotificationById(id: string): Promise<NotificationLog | null>
```

Result type:

```ts
export interface NotificationResult {
  notificationId: string;
  status: NotificationStatus;
  provider?: string;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
}
```

---

## 13. Notification Statuses

Use simple statuses:

```text
pending
sent
failed
skipped
```

Future statuses:

```text
queued
retrying
cancelled
delivered
read
```

Do not build delivery/read tracking in version 0.1 unless the provider gives it easily.

---

## 14. Notification Log Table

Initial database table:

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY,
  channel VARCHAR(50) NOT NULL,
  recipient_type VARCHAR(50) NOT NULL,
  recipient_id UUID,
  recipient_address VARCHAR(255),
  template_key VARCHAR(255) NOT NULL,
  data JSONB,
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  source VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  provider VARCHAR(255),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP
);
```

---

## 15. Provider Design

Each channel should have a provider interface.

```ts
export interface NotificationProvider {
  channel: NotificationChannel;

  send(request: NotificationRequest): Promise<NotificationResult>;
}
```

WhatsApp provider can later connect to:

```text
WhatsApp Plugin
Meta WhatsApp API
360dialog
Gupshup
Personal WhatsApp bridge for local experiment
```

Version 0.1 can keep actual sending as placeholder if WhatsApp Plugin is not ready.

---

## 16. WhatsApp-First Rule

For PropertyOS version 0.1, WhatsApp is the preferred communication channel.

Examples:

```text
Visitor invite → WhatsApp
Host alert → WhatsApp
Security alert → WhatsApp
Admin system alert → WhatsApp
```

Email and SMS are secondary.

---

## 17. Template Rules

Templates must be:

* Simple
* Text-first
* Channel-independent where possible
* Easy to localize later

Templates should not contain hardcoded property names.

Bad:

```text
Welcome to Advaith's Nest
```

Good:

```text
Welcome to {{propertyName}}
```

---

## 18. Plugin Usage

Plugins should request notification instead of sending directly.

Example:

Visitor Plugin should not directly call WhatsApp API.

It should request:

```text
Send visitor_invite notification to visitor
```

Notification Module decides how to send it.

---

## 19. Notification Module And Event Bus

Notification Module should use Event Bus in two ways:

### 19.1 As Listener

It listens to events like:

```text
visitor.invited
```

### 19.2 As Publisher

It publishes result events like:

```text
notification.sent
notification.failed
```

This allows Audit Module and Admin Dashboard to react.

---

## 20. Notification Module And Audit Module

Audit Module should record important notification activity.

Examples:

```text
notification.sent
notification.failed
```

However, Notification Module should not directly write audit records.

It should publish events.

Audit Module should listen and record.

---

## 21. Security Considerations

Notification payloads must not expose secrets.

Do not send:

* Passwords
* Access tokens
* Private keys
* Full identity documents
* Sensitive internal notes
* Payment card details

For sensitive actions, send only a link or reference ID.

---

## 22. Failure Handling

If a notification fails:

1. Record status as `failed`.
2. Store safe error message.
3. Publish `notification.failed`.
4. Do not crash the main business flow.
5. Allow retry later.

Example:

```text
Visitor invite created successfully.
WhatsApp failed.
System records failure.
Admin can retry later.
```

---

## 23. API Endpoints

Initial endpoints:

```text
POST /core/notification/send
GET  /core/notification/logs
GET  /core/notification/logs/:id
```

These are admin/internal endpoints.

Public users should not directly call notification APIs unless explicitly allowed.

---

## 24. Admin Visibility

Admin should eventually be able to see:

* Message sent
* Message failed
* Recipient
* Channel
* Template
* Source module/plugin
* Time sent
* Error reason

In version 0.1, backend API log is enough.

Full UI can come later.

---

## 25. Non-Goals

The Notification Module should not:

* Become a marketing campaign system
* Manage WhatsApp templates fully
* Replace WhatsApp Plugin
* Replace Email Plugin
* Store documents
* Manage visitor logic
* Manage user permissions
* Become a CRM
* Send bulk promotional messages

It is only the platform communication layer.

---

## 26. Future Enhancements

Later versions may support:

* Retry queue
* Delivery status
* Read receipts
* User notification preferences
* Quiet hours
* Multi-language templates
* Template approval workflow
* Admin notification dashboard
* Bulk operational alerts
* Push notifications
* Webhook notification provider
* Notification analytics

Do not build these now.

---

## 27. Version 0.1 Success Criteria

The Notification Module is successful when:

1. A module can request notification.
2. Notification request is saved.
3. WhatsApp channel is supported as primary channel.
4. Notification status is recorded.
5. Failed notifications do not crash the system.
6. Event Bus publishes `notification.sent`.
7. Event Bus publishes `notification.failed`.
8. Visitor invite notification can be triggered.
9. Host alert can be triggered.
10. Admin can view notification logs through backend API.

---

## 28. Simple Mental Model

Think of Notification Module as the post office of PropertyOS.

Other modules say:

```text
“Please send this message.”
```

Notification Module says:

```text
“I will choose the channel, send it, and record what happened.”
```

Visitor Plugin should not worry about WhatsApp.

Audit Module should not worry about message sending.

Plugin Engine should not worry about provider details.

That is the purpose of the Notification Module.

