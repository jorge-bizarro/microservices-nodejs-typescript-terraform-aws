import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: "<rootDir>/"
  }),
  transform: {
    "^.+\\.ts$": ["ts-jest"]
  },
  collectCoverageFrom: ["src/**/*.{ts,js}"],
  coverageDirectory: "coverage",
  clearMocks: true,
  testMatch: ["**/tests/**/*.test.ts",]
};
