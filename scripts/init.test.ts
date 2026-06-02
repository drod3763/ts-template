import { describe, expect, it } from "vitest";
import {
  transformLibPackageJson,
  transformMonoPackageJson,
  transformAppPackageJson,
  transformActionPackageJson,
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
    expect(result.bin!["my-cli"]).toBe("./dist/index.js");
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

// ─── dist exports (lib) ───────────────────────────────────────────────────────

describe("transformLibPackageJson — dist exports", () => {
  it("sets exports to dist imports", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect((result.exports as Record<string, unknown>)["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    });
  });

  it("sets main to dist js", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.main).toBe("./dist/index.js");
  });

  it("sets types to dist dts", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.types).toBe("./dist/index.d.ts");
  });

  it("sets files to dist only", () => {
    const result = transformLibPackageJson(BASE_PKG, "@org/mylib");
    expect(result.files).toEqual(["dist"]);
  });
});

// ─── transformActionPackageJson ───────────────────────────────────────────────

describe("transformActionPackageJson", () => {
  it("sets private: true", () => {
    const result = transformActionPackageJson(BASE_PKG, "my-action");
    expect(result.private).toBe(true);
  });

  it("removes exports, files, version", () => {
    const result = transformActionPackageJson(BASE_PKG, "my-action");
    expect(result).not.toHaveProperty("exports");
    expect(result).not.toHaveProperty("files");
    expect(result).not.toHaveProperty("version");
  });

  it("sets build script to ncc", () => {
    const result = transformActionPackageJson(BASE_PKG, "my-action");
    expect(result.scripts.build).toContain("ncc");
    expect(result.scripts.build).toContain("src/index.ts");
  });

  it("removes the init script", () => {
    const result = transformActionPackageJson(BASE_PKG, "my-action");
    expect(result.scripts).not.toHaveProperty("init");
  });

  it("adds @vercel/ncc to devDependencies", () => {
    const result = transformActionPackageJson(BASE_PKG, "my-action");
    expect(result.devDependencies).toHaveProperty("@vercel/ncc");
  });

  it("adds @actions/core to dependencies", () => {
    const result = transformActionPackageJson(BASE_PKG, "my-action");
    expect(result.dependencies).toHaveProperty("@actions/core");
  });
});

// ─── transformAppPackageJson with asAction ────────────────────────────────────

describe("transformAppPackageJson — cli with asAction=true", () => {
  it("is NOT private when asAction", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-cli", "cli", true);
    expect(result.private).toBeUndefined();
  });

  it("sets dist exports when asAction", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-cli", "cli", true);
    expect((result.exports as Record<string, unknown>)["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    });
  });

  it("sets files to dist when asAction", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-cli", "cli", true);
    expect(result.files).toEqual(["dist"]);
  });

  it("keeps bin pointing to dist when asAction", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-cli", "cli", true);
    expect(result.bin!["my-cli"]).toBe("./dist/index.js");
  });
});

describe("transformAppPackageJson — cli with asAction=false (existing behavior)", () => {
  it("remains private when not asAction", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-cli", "cli", false);
    expect(result.private).toBe(true);
  });

  it("has no exports when not asAction", () => {
    const result = transformAppPackageJson(BASE_PKG, "my-cli", "cli", false);
    expect(result).not.toHaveProperty("exports");
  });
});

// ─── generateNextSteps action ─────────────────────────────────────────────────

describe("generateNextSteps — action", () => {
  it("does not include NPM_TOKEN", () => {
    expect(generateNextSteps("action")).not.toContain("NPM_TOKEN");
  });

  it("mentions git tag", () => {
    expect(generateNextSteps("action")).toContain("git tag");
  });

  it("mentions bun install", () => {
    expect(generateNextSteps("action")).toContain("bun install");
  });
});
