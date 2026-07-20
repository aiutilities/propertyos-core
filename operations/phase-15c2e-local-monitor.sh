#!/bin/sh

set -u

OWNER='Anand Nataraj'
CHANNEL='LOCAL_MACOS_NOTIFICATION_AND_PROTECTED_LOG'
BASE_URL="${PROPERTYOS_MONITOR_BASE_URL:-http://127.0.0.1:3001}"
FAILURE_THRESHOLD="${PROPERTYOS_MONITOR_FAILURE_THRESHOLD:-2}"
TIMEOUT_SECONDS="${PROPERTYOS_MONITOR_TIMEOUT_SECONDS:-5}"

LOG_DIR="${HOME}/Library/Logs/PropertyOS"
STATE_DIR="${HOME}/Library/Application Support/PropertyOS/monitoring"
INCIDENT_LOG="${LOG_DIR}/incident-monitor.jsonl"
STATE_FILE="${STATE_DIR}/state"

DRY_RUN='false'

if [ "${1:-}" = '--dry-run' ]; then
  DRY_RUN='true'
elif [ "${1:-}" != '' ]; then
  echo 'Usage: phase-15c2e-local-monitor.sh [--dry-run]' >&2
  exit 64
fi

case "$FAILURE_THRESHOLD" in
  ''|*[!0-9]*)
    echo 'Invalid failure threshold' >&2
    exit 64
    ;;
esac

case "$TIMEOUT_SECONDS" in
  ''|*[!0-9]*)
    echo 'Invalid timeout' >&2
    exit 64
    ;;
esac

if [ "$FAILURE_THRESHOLD" -lt 1 ]; then
  echo 'Failure threshold must be positive' >&2
  exit 64
fi

umask 077

timestamp() {
  /bin/date -u '+%Y-%m-%dT%H:%M:%SZ'
}

json_event() {
  event_status="$1"
  live_code="$2"
  ready_code="$3"
  consecutive_failures="$4"
  transition="$5"

  /usr/bin/printf \
    '{"timestamp":"%s","service":"propertyos-api","owner":"%s","channel":"%s","status":"%s","liveHttpStatus":"%s","readyHttpStatus":"%s","consecutiveFailures":%s,"transition":"%s","externalNotificationSent":false}\n' \
    "$(timestamp)" \
    "$OWNER" \
    "$CHANNEL" \
    "$event_status" \
    "$live_code" \
    "$ready_code" \
    "$consecutive_failures" \
    "$transition"
}

probe_endpoint() {
  route="$1"
  body_file="$2"

  PROBE_CODE="$(
    /usr/bin/curl \
      --silent \
      --show-error \
      --max-time "$TIMEOUT_SECONDS" \
      --output "$body_file" \
      --write-out '%{http_code}' \
      "${BASE_URL}${route}" \
      2>/dev/null
  )"

  PROBE_EXIT="$?"

  if [ "$PROBE_EXIT" -ne 0 ]; then
    PROBE_CODE='000'
    return 1
  fi

  if [ "$PROBE_CODE" != '200' ]; then
    return 1
  fi

  if ! /usr/bin/grep -Eq \
    '"status"[[:space:]]*:[[:space:]]*"ok"' \
    "$body_file"
  then
    return 1
  fi

  return 0
}

LIVE_BODY="$(
  /usr/bin/mktemp \
    "${TMPDIR:-/tmp}/propertyos-monitor-live.XXXXXX"
)" || exit 70

READY_BODY="$(
  /usr/bin/mktemp \
    "${TMPDIR:-/tmp}/propertyos-monitor-ready.XXXXXX"
)" || {
  /bin/rm -f "$LIVE_BODY"
  exit 70
}

cleanup() {
  /bin/rm -f \
    "$LIVE_BODY" \
    "$READY_BODY"
}

trap cleanup EXIT INT TERM

LIVE_OK='false'
READY_OK='false'
LIVE_CODE='000'
READY_CODE='000'

if probe_endpoint '/api/v1/health/live' "$LIVE_BODY"; then
  LIVE_OK='true'
fi

LIVE_CODE="$PROBE_CODE"

if probe_endpoint '/api/v1/health/ready' "$READY_BODY"; then
  READY_OK='true'
fi

READY_CODE="$PROBE_CODE"

if [ "$LIVE_OK" = 'true' ] &&
   [ "$READY_OK" = 'true' ]
then
  CURRENT_STATUS='ok'
else
  CURRENT_STATUS='error'
fi

if [ "$DRY_RUN" = 'true' ]; then
  json_event \
    "$CURRENT_STATUS" \
    "$LIVE_CODE" \
    "$READY_CODE" \
    0 \
    'DRY_RUN'

  if [ "$CURRENT_STATUS" = 'ok' ]; then
    exit 0
  fi

  exit 2
fi

/bin/mkdir -p \
  "$LOG_DIR" \
  "$STATE_DIR" ||
  exit 70

/bin/chmod 700 \
  "$LOG_DIR" \
  "$STATE_DIR" ||
  exit 70

PREVIOUS_FAILURES='0'
PREVIOUS_ALERTED='0'

if [ -f "$STATE_FILE" ]; then
  PREVIOUS_FAILURES="$(
    /usr/bin/sed -n \
      's/^failures=\([0-9][0-9]*\)$/\1/p' \
      "$STATE_FILE" |
    /usr/bin/head -n 1
  )"

  PREVIOUS_ALERTED="$(
    /usr/bin/sed -n \
      's/^alerted=\([01]\)$/\1/p' \
      "$STATE_FILE" |
    /usr/bin/head -n 1
  )"

  PREVIOUS_FAILURES="${PREVIOUS_FAILURES:-0}"
  PREVIOUS_ALERTED="${PREVIOUS_ALERTED:-0}"
fi

if [ "$CURRENT_STATUS" = 'ok' ]; then
  TRANSITION='UNCHANGED_HEALTHY'

  if [ "$PREVIOUS_ALERTED" = '1' ]; then
    TRANSITION='RECOVERED'

    /usr/bin/osascript \
      -e 'display notification "PropertyOS API recovered and is ready." with title "PropertyOS Recovery"' \
      >/dev/null 2>&1 ||
      true
  fi

  /usr/bin/printf \
    'failures=0\nalerted=0\n' \
    >"$STATE_FILE"

  json_event \
    'ok' \
    "$LIVE_CODE" \
    "$READY_CODE" \
    0 \
    "$TRANSITION" \
    >>"$INCIDENT_LOG"

  exit 0
fi

CURRENT_FAILURES="$((PREVIOUS_FAILURES + 1))"
CURRENT_ALERTED="$PREVIOUS_ALERTED"
TRANSITION='FAILURE_PENDING_THRESHOLD'

if [ "$CURRENT_FAILURES" -ge "$FAILURE_THRESHOLD" ] &&
   [ "$PREVIOUS_ALERTED" != '1' ]
then
  CURRENT_ALERTED='1'
  TRANSITION='INCIDENT_OPENED'

  /usr/bin/osascript \
    -e 'display notification "PropertyOS API is unavailable or degraded. Open the incident runbook." with title "PropertyOS Incident"' \
    >/dev/null 2>&1 ||
    true
elif [ "$PREVIOUS_ALERTED" = '1' ]; then
  TRANSITION='INCIDENT_CONTINUES'
fi

/usr/bin/printf \
  'failures=%s\nalerted=%s\n' \
  "$CURRENT_FAILURES" \
  "$CURRENT_ALERTED" \
  >"$STATE_FILE"

json_event \
  'error' \
  "$LIVE_CODE" \
  "$READY_CODE" \
  "$CURRENT_FAILURES" \
  "$TRANSITION" \
  >>"$INCIDENT_LOG"

exit 2
