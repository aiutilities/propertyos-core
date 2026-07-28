# PropertyOS Global Notification UX Contract

## Status

Accepted platform UX standard.

## Principle

No CRUD operation or state-changing action may complete silently.

Every successful or failed mutation must provide immediate,
accessible and user-readable feedback through the shared PropertyOS
notification framework.

## Configuration Hierarchy

1. ForgeOS platform defaults
2. PropertyOS installation defaults
3. Administrator runtime overrides
4. Module or action-specific overrides

Installation defaults are stored at:

frontend/public/config/notifications.json

## Required Notification Tones

- Success: green
- Error: red
- Warning: amber
- Information: blue

## Default Presentation

- Position: top-right
- Automatic dismissal: five seconds
- Errors may remain visible longer
- Manual dismissal is enabled
- Notifications stack without blocking page interaction

## CRUD Messages

Create:

{{entityType}} "{{entityName}}" created successfully.

Update:

{{entityType}} "{{entityName}}" updated successfully.

Delete:

{{entityType}} "{{entityName}}" deleted successfully.

## State-Change Messages

Supported action templates include:

- Activate
- Deactivate
- Approve
- Reject
- Submit
- Complete
- Cancel
- Install
- Uninstall
- Payment
- Receipt
- Inventory receipt
- Material issue
- Material return
- Stock adjustment
- Import
- Export

## Redirect Persistence

Success notifications must survive navigation after a successful
Create, Update, Delete or state-changing action.

The mutation screen must queue the notification before redirecting.
The destination page must consume and display the queued notification.

## Accessibility

- The viewport uses an accessible live region.
- Error notifications use alert semantics.
- Other notification types use status semantics.
- Dismiss controls are keyboard accessible.
- Reduced-motion preferences are respected.
- Notifications do not block page interaction.

## Error Safety

Raw API JSON, stack traces, SQL errors, database errors and internal
exception details must never be displayed directly to users.

Technical details may be written to the browser console for diagnosis.

## Configuration Rules

Administrators may configure:

- notification position
- automatic dismissal duration
- maximum visible notifications
- inclusion of entity names
- redirect persistence
- manual dismissal
- optional sound
- notification visibility
- message templates
- destructive-action confirmation policy

Critical error feedback must remain available.

## Usage Example

const notifications = useNotifications();

notifications.created(
  "Property",
  property.name,
);

notifications.afterRedirect.updated(
  "Property",
  property.name,
);

notifications.approved(
  "Purchase request",
  request.number,
);

notifications.error(
  caughtError,
  "Property could not be updated.",
);

## Governance

Every current and future CRUD or state-changing action must use the
shared notification framework.

One-off toast implementations are forbidden unless explicitly approved
as a temporary compatibility bridge.
