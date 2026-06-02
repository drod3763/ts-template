import { describe, expect, it } from "vitest";
import {
  transformLibPackageJson,
  transformMonoPackageJson,
  transformAppPackageJson,
  generateNextSteps,
} from "./init.js";

const BASE_PKG = {
  name: "ts-template",
  version: "0.0.0",
  type: "module",
  exports: { ".": "./src/index.ts" },
  files: ["dist"],
  scripts: {
    init: "bun scripts/init.ts",
    build: "tsc --project tsconfig.json",
    test: "vitest run --coverage",
    lint: "eslint .",
    format: "prettier --write .",
    "format:check": "prettier --check .",
    typecheck: "tsc --noEmit",
  },
  devDependencies: {
    "@commitlint/cli": "^19.0.0",
    "@drod3763/commitlint-config": "^1.0.0",
    vitest: "^2.0.0",
  },
};

describe("transformLibPackageJson", () => {
  it("sets the package name", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.name).toBe("@org/mylib");
  });

  it("removes the init script", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.scripts).not.toHaveProperty("init");
  });

  it("keeps build, test, lint, format, typecheck scripts", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.scripts).toHaveProperty("build");
    expect(result.scripts).toHaveProperty("test");
    expect(result.scripts).toHaveProperty("lint");
    expect(result.scripts).toHaveProperty("format");
    expect(result.scripts).toHaveProperty("typecheck");
  });

  it("preserves devDependencies", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.devDependencies).toEqual(BASE_PKG.devDependencies);
  });

  it("preserves type, exports, files", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.type).toBe("module");
    expect(result.exports).toEqual({ ".": "./src/index.ts" });
    expect(result.files).toEqual(["dist"]);
  });
});

describe("transformMonoPackageJson", () => {
  it("sets private: true", () => {
    const result = transformMonoPackageJson(BASE_PKG, "my-mono");
    expect(result.private).toBe(true);
  });

  it("sets workspaces", () => {
    const result = transformMonoPackageJson(BASE_PKG, "my-mono");
    expect(result.workspaces).toEqual(["packages/*"]);
  });

  it("removes exports and files (root is not published)", () => {
    const result = transformMonoPackageJson(BASE_PKG, "my-mono");
    expect(result).not.toHaveProperty("exports");
    expect(result).not.toHaveProperty("files");
  });

  it("removes the init script", () => {
    const result = transformMonoPackageJson(BASE_PKG, "my-mono");
    expect(result.scripts).not.toHaveProperty("init");
  });

  it("keeps test, lint, format, typecheck scripts", () => {
    const result = transformMonoPackageJson(BASE_PKG, "my-mono");
    expect(result.scripts).toHaveProperty("test");
    expect(result.scripts).toHaveProperty("lint");
    expect(result.scripts).toHaveProperty("typecheck");
  });
});

describe("transformAppPackageJson", () => {
  it("sets private: true", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-app", "server");
    expect(result.private).toBe(true);
  });

  it("removes exports and files", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-app", "server");
    expect(result).not.toHaveProperty("exports");
    expect(result).not.toHaveProperty("files");
  });

  it("removes version (apps don't publish)", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-app", "server");
    expect(result).not.toHaveProperty("version");
  });

  it("adds start script for server", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-app", "server");
    expect(result.scripts).toHaveProperty("start");
    expect(result.scripts.start).toContain("src/index.ts");
  });

  it("adds bin field for cli", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-cli", "cli");
    expect(result).toHaveProperty("bin");
    expect(result.bin["my-cli"]).toBe("./dist/index.js");
  });

  it("removes the init script", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-app", "server");
    expect(result.scripts).not.toHaveProperty("init");
  });
});

describe("generateNextSteps", () => {
  it("includes NPM_TOKEN for lib", () => {
    const steps = generateNextSteps("lib");
    expect(steps).toContain("NPM_TOKEN");
  });

  it("does not include NPM_TOKEN for app", () => {
    const steps = generateNextSteps("app");
    expect(steps).not.toContain("NPM_TOKEN");
  });

  it("mentions bun install", () => {
    const steps = generateNextSteps("lib");
    expect(steps).toContain("bun install");
  });
});
