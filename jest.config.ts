import type { Config } from 'jest';

const config: Config = {
  projects: [
    // Node tests (API routes, lib, middleware)
    {
      displayName: 'node',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          useESM: false,
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testMatch: [
        '<rootDir>/__tests__/lib/**/*.test.ts',
        '<rootDir>/__tests__/api/**/*.test.ts',
      ],
    },
    // JSDOM tests (Components)
    {
      displayName: 'jsdom',
      testEnvironment: 'jest-environment-jsdom',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          useESM: false,
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testMatch: [
        '<rootDir>/__tests__/components/**/*.test.tsx',
      ],
      setupFiles: ['<rootDir>/__tests__/setup-dom.ts'],
    },
  ],
};

export default config;
