# PropertyOS Deployment Guide

## Prerequisites

- Docker Engine
- Docker Compose
- Node.js 22+
- PostgreSQL 16

## Environment

Copy:

    backend/.env.example

to

    backend/.env

Configure:

- Database
- JWT Secret
- Storage
- Scheduler
- SMTP (optional)

## Build

docker compose build

## Start

docker compose up -d

## Run database migrations

docker compose run --rm migrate

## Verify

Backend:

http://localhost:3001/health

Frontend:

http://localhost:3000

Scheduler:

docker compose logs -f scheduler

