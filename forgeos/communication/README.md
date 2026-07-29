# ForgeOS Communication Engine

The ForgeOS Communication Engine is developed as a workspace module while it
is proven through PropertyOS.

## Responsibilities

- provider registry
- template registry
- communication delivery
- retry
- fallback
- delivery status
- audit integration
- event publication

## Initial providers

- Meta WhatsApp Cloud API
- MailerSend
- Fast2SMS adapter scaffold

## Dependency direction

PropertyOS may depend on ForgeOS.

ForgeOS must not import PropertyOS business modules.

## Current migration model

Existing PropertyOS communication behaviour will be extracted incrementally.

The existing PropertyOS modules remain operational until their ForgeOS
replacements pass regression testing.
