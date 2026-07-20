import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  accessSync,
  constants,
  readFileSync,
} from 'node:fs';
import {
  resolve,
} from 'node:path';

describe(
  'Phase 15C2E local incident monitoring',
  () => {
    const repositoryRoot = resolve(
      __dirname,
      '../../../..',
    );

    const monitorPath = resolve(
      repositoryRoot,
      'operations/phase-15c2e-local-monitor.sh',
    );

    const monitor = readFileSync(
      monitorPath,
      'utf8',
    );

    const plist = readFileSync(
      resolve(
        repositoryRoot,
        'operations/launchd/com.propertyos.incident-monitor.plist.template',
      ),
      'utf8',
    );

    const runbook = readFileSync(
      resolve(
        repositoryRoot,
        'documentation/PHASE_15C2E_LOCAL_MONITORING_RUNBOOK.md',
      ),
      'utf8',
    );

    it('is executable and bound to the approved owner and channel', () => {
      expect(() =>
        accessSync(
          monitorPath,
          constants.X_OK,
        ),
      ).not.toThrow();

      expect(monitor).toContain(
        "OWNER='Anand Nataraj'",
      );

      expect(monitor).toContain(
        "CHANNEL='LOCAL_MACOS_NOTIFICATION_AND_PROTECTED_LOG'",
      );
    });

    it('checks liveness and readiness without credentials', () => {
      expect(monitor).toContain(
        "'/api/v1/health/live'",
      );

      expect(monitor).toContain(
        "'/api/v1/health/ready'",
      );

      expect(monitor).not.toContain(
        'Authorization:',
      );
    });

    it('uses two-failure incident opening and transition suppression', () => {
      expect(monitor).toContain(
        'PROPERTYOS_MONITOR_FAILURE_THRESHOLD:-2',
      );

      expect(monitor).toContain(
        "TRANSITION='INCIDENT_OPENED'",
      );

      expect(monitor).toContain(
        "TRANSITION='INCIDENT_CONTINUES'",
      );

      expect(monitor).toContain(
        "TRANSITION='RECOVERED'",
      );
    });

    it('uses local notification and protected local state only', () => {
      expect(monitor).toContain(
        '/usr/bin/osascript',
      );

      expect(monitor).toContain(
        'Library/Logs/PropertyOS',
      );

      expect(monitor).toContain(
        'Library/Application Support/PropertyOS/monitoring',
      );

      expect(monitor).toContain(
        '/bin/chmod 700',
      );
    });

    it('does not contain an external alert transport', () => {
      expect(monitor).not.toMatch(
        /hooks\.slack\.com/,
      );

      expect(monitor).not.toMatch(
        /smtp/i,
      );

      expect(monitor).not.toMatch(
        /WHATSAPP_WEBHOOK/,
      );

      expect(monitor).not.toMatch(
        /api\.twilio\.com/,
      );
    });

    it('defines a one-minute launchd job with no automatic restart action', () => {
      expect(plist).toContain(
        '<integer>60</integer>',
      );

      expect(plist).toContain(
        '<string>2</string>',
      );

      expect(plist).not.toContain(
        'docker restart',
      );

      expect(plist).not.toContain(
        'docker compose',
      );
    });

    it('documents incident ownership, abort rules and authorization boundaries', () => {
      expect(runbook).toContain(
        'Incident owner: Anand Nataraj',
      );

      expect(runbook).toContain(
        'Automatic remediation: prohibited',
      );

      expect(runbook).toContain(
        'Do not apply migrations.',
      );

      expect(runbook).toContain(
        'Do not invoke the WhatsApp executor.',
      );

      expect(runbook).toContain(
        'requires separate configuration, credential governance and explicit authorization',
      );
    });
  },
);
