module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 2,
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 55,
      functions: 65,
      lines: 75,
    },
  },
  moduleNameMapper: {
    '^@handlers/(.*)$': '<rootDir>/src/handlers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
};
