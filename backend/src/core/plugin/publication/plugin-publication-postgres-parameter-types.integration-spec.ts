import {
  readFileSync,
} from 'fs';
import {
  join,
} from 'path';
import {
  describe,
  expect,
  it,
} from '@jest/globals';

describe(
  'Plugin publication PostgreSQL parameter types',
  () => {
    const source = readFileSync(
      join(
        __dirname,
        'plugin-publication-governance.service.ts',
      ),
      'utf8',
    );

    it(
      'explicitly types shared submission identifiers',
      () => {
        expect(
          source.match(
            /\$5::varchar\(100\)/g,
          ),
        ).toHaveLength(2);

        expect(
          source.match(
            /\$6::varchar\(150\)/g,
          ),
        ).toHaveLength(2);
      },
    );

    it(
      'explicitly types every transition status parameter',
      () => {
        const start = source.indexOf(
          'UPDATE plugin_publications',
        );
        const end = source.indexOf(
          'RETURNING *',
          start,
        );
        const transition = source.slice(
          start,
          end,
        );

        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        expect(
          transition,
        ).not.toMatch(
          /\$2(?!\d|::varchar\(30\))/,
        );
        expect(
          transition,
        ).not.toMatch(
          /\$5(?!\d|::varchar\(30\))/,
        );
        expect(
          transition,
        ).toContain(
          '$2::varchar(30)',
        );
        expect(
          transition,
        ).toContain(
          '$5::varchar(30)',
        );
      },
    );
  },
);
