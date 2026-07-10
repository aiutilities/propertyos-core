# Operations Guide

## Restart backend

docker compose restart api

## Restart scheduler

docker compose restart scheduler

## View logs

docker compose logs -f api

docker compose logs -f scheduler

## Database migrations

docker compose run --rm migrate

## Health

GET /health

