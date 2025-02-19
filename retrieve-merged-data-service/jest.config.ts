import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageReporters: ["json", "lcov", "text", "clover"],
  clearMocks: true,
  modulePathIgnorePatterns: ["<rootDir>/.serverless/"],
};

export default config;
