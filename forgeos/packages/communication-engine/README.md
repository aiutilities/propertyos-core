# @forgeos/communication-engine

This package will implement the provider-neutral ForgeOS Communication Engine.

## Responsibilities

- provider registry
- template registry
- delivery pipeline
- retry policy
- fallback policy
- audit integration
- event publication
- delivery-status transitions

## Initial providers

1. Meta WhatsApp Cloud API
2. MailerSend
3. Fast2SMS adapter scaffold

The package must not import PropertyOS business modules.
