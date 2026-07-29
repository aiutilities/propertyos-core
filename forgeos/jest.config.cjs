const path = require('path');

module.exports = {
  rootDir: '..',

  roots: [
    '<rootDir>/forgeos',
  ],

  testEnvironment: 'node',

  testRegex:
    'forgeos/(communication|payment|maps)/.*\\.integration-spec\\.ts$',

  moduleFileExtensions: [
    'ts',
    'js',
    'json',
  ],

  moduleDirectories: [
    'node_modules',
    '<rootDir>/backend/node_modules',
  ],

  transform: {
    '^.+\\.ts$': [
      '<rootDir>/backend/node_modules/ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          moduleResolution: 'Node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          types: [
            'jest',
            'node',
          ],
          typeRoots: [
            path.resolve(
              __dirname,
              '../backend/node_modules/@types',
            ),
          ],
        },
      },
    ],
  },

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};
