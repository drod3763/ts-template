# TypeScript Template Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub template repo for TypeScript projects that wires up all six `@drod3763/*` shared configs and gates PRs via six reusable CI workflows, with a scaffolding script (`bun run init`) that configures the repo for lib, monorepo, or app.

**Architecture:** Pre-scaffold state is a working **library** project (passes all six checks). `scripts/init.ts` prompts for project type and rewrites `package.json`, filesystem layout, and workflow files accordingly, then self-deletes. CI uses one `ci.yml` orchestrator that calls all six reusable workflows from `drod3763/configs` via `workflow_call`; `publish.yml` fires on `release/*` PR merged to `main`.

**Tech Stack:** Bun 1.3+, TypeScript 5+, Vitest 2+, ESLint 9+, Prettier 3+, commitlint 19+, markdownlint-cli2 0.17+, all `@drod3763/*` configs at `^1.0.0`, GitHub Actions.

---

## File Map

| File                            | Role                                                                    |
| ------------------------------- | ----------------------------------------------------------------------- |
| `package.json`                  | Template base (lib-default); rewritten by init                          |
| `tsconfig.json`                 | Extends `@drod3763/tsconfig/base.json`                                  |
| `eslint.config.mjs`             | Spreads `@drod3763/eslint-config`, applies `testOverride` to test files |
| `prettier.config.mjs`           | Re-exports `@drod3763/prettier-config`                                  |
| `commitlint.config.mjs`         | Re-exports `@drod3763/commitlint-config`                                |
| `vitest.config.mjs`             | Re-exports `@drod3763/vitest-config`                                    |
| `.markdownlint-cli2.yaml`       | Extends `@drod3763/markdownlint-config`                                 |
| `src/index.ts`                  | Placeholder export (proves typecheck + lint)                            |
| `src/index.test.ts`             | Vitest test (proves test + coverage)                                    |
| `.github/workflows/ci.yml`      | Calls all 6 reusable workflows                                          |
| `.github/workflows/publish.yml` | Publishes on `release/*` PR merge                                       |
| `scripts/init.ts`               | Scaffolder — pure transform fns + side-effects; self-deletes            |
| `scripts/init.test.ts`          | Unit tests for pure transform functions                                 |
| `.gitignore`                    | Node/Bun/coverage ignores                                               |
| `README.md`                     | Template usage, branch protection setup, secrets                        |

---

### Task 1: git init + package.json + install deps

**Files:**

- Create: `package.json`

- [ ] **Step 1: Init git repo**

```bash
cd /Users/derick/Projects/ts-template
git init
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "ts-template",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "files": ["dist"],
  "scripts": {
    "init": "bun scripts/init.ts",
    "build": "tsc --project tsconfig.json",
    "test": "vitest run --coverage",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.0.0",
    "@drod3763/commitlint-config": "^1.0.0",
    "@drod3763/eslint-config": "^1.0.0",
    "@drod3763/markdownlint-config": "^1.0.0",
    "@drod3763/prettier-config": "^1.0.0",
    "@drod3763/tsconfig": "^1.0.0",
    "@drod3763/vitest-config": "^1.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "eslint": "^9.0.0",
    "markdownlint-cli2": "^0.17.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "typescript-eslint": "^8.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Install**

```bash
bun install
```

Expected: lockfile created, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: init project with devDependencies"
```

---

### Task 2: Config files

**Files:**

- Create: `tsconfig.json`, `eslint.config.mjs`, `prettier.config.mjs`, `commitlint.config.mjs`, `vitest.config.mjs`, `.markdownlint-cli2.yaml`

- [ ] **Step 1: Write `tsconfig.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@drod3763/tsconfig/base.json",
  "include": ["src", "scripts", "*.config.mjs", "*.config.ts"]
}
```

- [ ] **Step 2: Write `eslint.config.mjs`**

```javascript
import config, { testOverride } from "@drod3763/eslint-config";

export default [
  ...config,
  {
    files: ["**/*.test.ts"],
    ...testOverride,
  },
];
```

- [ ] **Step 3: Write `prettier.config.mjs`**

```javascript
export { default } from "@drod3763/prettier-config";
```

- [ ] **Step 4: Write `commitlint.config.mjs`**

```javascript
export { default } from "@drod3763/commitlint-config";
```

- [ ] **Step 5: Write `vitest.config.mjs`**

```javascript
export { default } from "@drod3763/vitest-config";
```

- [ ] **Step 6: Write `.markdownlint-cli2.yaml`**

```yaml
config:
  extends: "@drod3763/markdownlint-config"
```

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json eslint.config.mjs prettier.config.mjs commitlint.config.mjs vitest.config.mjs .markdownlint-cli2.yaml
git commit -m "chore: add tool config files"
```

---

### Task 3: Source placeholder

**Files:**

- Create: `src/index.ts`, `src/index.test.ts`

- [ ] **Step 1: Write `src/index.ts`**

```typescript
/**
 * Returns a greeting string.
 */
export const greet = (name: string): string => `Hello, ${name}!`;
```

- [ ] **Step 2: Write failing test first**

```typescript
// src/index.test.ts
import { describe, expect, it } from "vitest";
import { greet } from "./index.js";

describe("greet", () => {
  it("returns a greeting with the given name", () => {
    expect(greet("world")).toBe("Hello, world!");
  });

  it("includes the name in the output", () => {
    expect(greet("TypeScript")).toContain("TypeScript");
  });
});
```

- [ ] **Step 3: Run test**

```bash
bun run test
```

Expected: 2 tests pass, coverage report written to `coverage/`.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: add placeholder source and test"
```

---

### Task 4: Verify all six tools pass

**Files:** none created

- [ ] **Step 1: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 2: Lint**

```bash
bun run lint
```

Expected: no errors. (If markdownlint-cli2 extends fails to resolve `@drod3763/markdownlint-config`, fall back: copy the three rules from `node_modules/@drod3763/markdownlint-config/index.yaml` directly into `.markdownlint-cli2.yaml` under a `config:` key.)

- [ ] **Step 3: Format check**

```bash
bun run format:check
```

Expected: all files already formatted. If not, run `bun run format` then re-check.

- [ ] **Step 4: Markdownlint** (needs a .md file to exist first — write `.gitignore` and `README.md` here temporarily, or skip until Task 7)

Skip for now; markdownlint will pass once README.md exists in Task 7.

- [ ] **Step 5: Commit any format fixes**

If `bun run format` changed anything:

```bash
git add -A
git commit -m "chore: apply prettier formatting"
```

---

### Task 5: GitHub workflows

**Files:**

- Create: `.github/workflows/ci.yml`, `.github/workflows/publish.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  commitlint:
    uses: drod3763/configs/.github/workflows/commitlint.yml@main
    with:
      base-sha: ${{ github.event.pull_request.base.sha }}
      head-sha: ${{ github.event.pull_request.head.sha }}

  format-check:
    uses: drod3763/configs/.github/workflows/format-check.yml@main

  lint:
    uses: drod3763/configs/.github/workflows/lint.yml@main

  markdownlint:
    uses: drod3763/configs/.github/workflows/markdownlint.yml@main

  test:
    uses: drod3763/configs/.github/workflows/test.yml@main

  typecheck:
    uses: drod3763/configs/.github/workflows/typecheck.yml@main
```

- [ ] **Step 2: Write `.github/workflows/publish.yml`**

```yaml
name: Publish

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  publish:
    if: >-
      github.event.pull_request.merged == true &&
      startsWith(github.event.pull_request.head.ref, 'release/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          registry-url: "https://registry.npmjs.org"

      - uses: oven-sh/setup-bun@v2

      - run: bun install --frozen-lockfile

      - run: bun run build --if-present

      - name: Publish (lib)
        if: ${{ !startsWith(github.repository, 'mono-') }}
        run: bun publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

> **Note:** The mono publish step is injected by `scripts/init.ts` for monorepo type. The `if:` condition above is a placeholder — after scaffolding, `init.ts` rewrites this entire step. See Task 8.

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add CI orchestrator and publish workflows"
```

---

### Task 6: Scaffolder — write failing tests first

**Files:**

- Create: `scripts/init.test.ts`

- [ ] **Step 1: Write `scripts/init.test.ts`**

These tests cover the pure transform functions. The filesystem mutations are integration-tested manually in Task 9.

```typescript
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
```

- [ ] **Step 2: Run tests — expect failures**

```bash
bun run test
```

Expected: `scripts/init.test.ts` fails — `transformLibPackageJson` not found. `src/index.test.ts` should still pass.

- [ ] **Step 3: Commit failing tests**

```bash
git add scripts/init.test.ts
git commit -m "test: add scaffolder transform unit tests (failing)"
```

---

### Task 7: Scaffolder — implement transform functions

**Files:**

- Create: `scripts/init.ts`

- [ ] **Step 1: Write `scripts/init.ts`**

```typescript
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "fs";
import { basename } from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectType = "lib" | "mono" | "app";
export type AppSubtype = "server" | "cli";

interface PackageJson {
  name: string;
  version?: string;
  private?: boolean;
  type?: string;
  exports?: Record<string, string>;
  files?: string[];
  bin?: Record<string, string>;
  workspaces?: string[];
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
  [key: string]: unknown;
}

// ─── Pure transforms (exported for tests) ─────────────────────────────────────

export const transformLibPackageJson = (
  pkg: PackageJson,
  name: string,
): PackageJson => {
  const { init: _init, ...scripts } = pkg.scripts;
  return { ...pkg, name, scripts };
};

export const transformMonoPackageJson = (
  pkg: PackageJson,
  name: string,
): PackageJson => {
  const { init: _init, build: _build, ...scripts } = pkg.scripts;
  const { exports: _exports, files: _files, version: _version, ...rest } = pkg;
  return {
    ...rest,
    name,
    private: true,
    workspaces: ["packages/*"],
    scripts,
  };
};

export const transformAppPackageJson = (
  pkg: PackageJson,
  name: string,
  subtype: AppSubtype,
): PackageJson => {
  const { init: _init, ...scripts } = pkg.scripts;
  const {
    exports: _exports,
    files: _files,
    version: _version,
    ...rest
  } = pkg;

  scripts["start"] = "bun run src/index.ts";

  const result: PackageJson = { ...rest, name, private: true, scripts };

  if (subtype === "cli") {
    result.bin = { [basename(name)]: "./dist/index.js" };
  }

  return result;
};

export const generateNextSteps = (type: ProjectType): string => {
  const steps = [
    "1. Run: bun install",
    "2. Push to GitHub and enable branch protection on main",
    "   Required status checks: commitlint, format-check, lint, markdownlint, test, typecheck",
  ];
  if (type !== "app") {
    steps.push("3. Add NPM_TOKEN secret to repo settings (Settings → Secrets → Actions)");
    steps.push("4. To publish: open a PR from a branch named release/vX.Y.Z");
  }
  return steps.join("\n");
};

// ─── Prompts ──────────────────────────────────────────────────────────────────

const ask = (question: string, defaultVal = ""): string => {
  const hint = defaultVal ? ` [${defaultVal}]` : "";
  const answer = prompt(`${question}${hint}: `);
  return answer?.trim() || defaultVal;
};

const choose = <T extends string>(question: string, choices: T[]): T => {
  const opts = choices.map((c, i) => `  ${i + 1}. ${c}`).join("\n");
  console.log(`\n${question}\n${opts}`);
  const raw = prompt("Choice: ");
  const idx = parseInt(raw ?? "1") - 1;
  const clamped = Math.max(0, Math.min(idx, choices.length - 1));
  return choices[clamped] as T;
};

// ─── Filesystem mutations ──────────────────────────────────────────────────────

const scaffoldMono = (pkgName: string): void => {
  const exampleDir = "packages/example/src";
  mkdirSync(exampleDir, { recursive: true });

  // Move src/ content into packages/example/
  if (existsSync("src/index.ts")) {
    renameSync("src/index.ts", `${exampleDir}/index.ts`);
  }
  if (existsSync("src/index.test.ts")) {
    renameSync("src/index.test.ts", `${exampleDir}/index.test.ts`);
  }
  try { rmSync("src", { recursive: true }); } catch { /* already empty */ }

  const examplePkg = {
    name: `${pkgName}/example`,
    version: "0.0.0",
    type: "module",
    exports: { ".": "./src/index.ts" },
    files: ["dist"],
    scripts: {
      build: "tsc --project tsconfig.json",
      test: "vitest run --coverage",
    },
  };
  writeFileSync(
    "packages/example/package.json",
    JSON.stringify(examplePkg, null, 2) + "\n",
  );

  // Patch publish.yml: replace lib publish step with mono loop
  const publishYml = readFileSync(".github/workflows/publish.yml", "utf-8");
  const patched = publishYml.replace(
    /      - name: Publish \(lib\)[\s\S]*?NODE_AUTH_TOKEN:.*\n/,
    `      - name: Publish all packages
        run: |
          for d in packages/*/; do
            (cd "$d" && bun publish --access public)
          done
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}\n`,
  );
  writeFileSync(".github/workflows/publish.yml", patched);
};

const scaffoldApp = (subtype: AppSubtype): void => {
  // Remove publish.yml — apps don't publish to npm
  rmSync(".github/workflows/publish.yml");

  if (subtype === "cli") {
    // Add shebang to entry file
    const entry = readFileSync("src/index.ts", "utf-8");
    writeFileSync("src/index.ts", `#!/usr/bin/env bun\n${entry}`);
  }
};

// ─── README generation ────────────────────────────────────────────────────────

const generateReadme = (name: string, type: ProjectType): string => {
  const publish =
    type === "app"
      ? ""
      : `\n## Publishing\n\nOpen a PR from a branch named \`release/vX.Y.Z\`. Merging it to \`main\` triggers \`publish.yml\`.\n\nRequires \`NPM_TOKEN\` secret (Settings → Secrets → Actions).\n`;

  return `# ${name}

## Setup

\`\`\`bash
bun install
\`\`\`

## Scripts

| Command | Description |
|---|---|
| \`bun run test\` | Run tests with coverage |
| \`bun run lint\` | ESLint |
| \`bun run format\` | Prettier write |
| \`bun run format:check\` | Prettier check |
| \`bun run typecheck\` | TypeScript check |

## CI

All PRs to \`main\` run six required checks via GitHub Actions:
commitlint, format-check, lint, markdownlint, test, typecheck.

**Branch protection:** enable on \`main\`, mark all six jobs as required status checks.
${publish}
`;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = (): void => {
  console.log("\n🚀 TypeScript Project Scaffolder\n");

  const type = choose<ProjectType>("Project type:", ["lib", "mono", "app"]);
  const subtype: AppSubtype =
    type === "app"
      ? choose<AppSubtype>("App subtype:", ["server", "cli"])
      : "server";

  const dirName = basename(process.cwd());
  const defaultName =
    type === "app" ? dirName : `@scope/${dirName}`;
  const name = ask("Package name", defaultName);

  // Transform package.json
  const raw = readFileSync("package.json", "utf-8");
  const pkg = JSON.parse(raw) as PackageJson;

  let newPkg: PackageJson;
  if (type === "lib") newPkg = transformLibPackageJson(pkg, name);
  else if (type === "mono") newPkg = transformMonoPackageJson(pkg, name);
  else newPkg = transformAppPackageJson(pkg, name, subtype);

  writeFileSync("package.json", JSON.stringify(newPkg, null, 2) + "\n");

  // Type-specific filesystem changes
  if (type === "mono") scaffoldMono(name);
  if (type === "app") scaffoldApp(subtype);

  // Rewrite README
  writeFileSync("README.md", generateReadme(name, type));

  // Self-delete
  rmSync("scripts/init.ts");
  rmSync("scripts/init.test.ts", { force: true });

  console.log("\n✅ Scaffold complete!\n");
  console.log(generateNextSteps(type));
  console.log();
};

main();
```

- [ ] **Step 2: Run tests — expect pass**

```bash
bun run test
```

Expected: all tests in `scripts/init.test.ts` and `src/index.test.ts` pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/init.ts
git commit -m "feat: add scaffolder with lib/mono/app transforms"
```

---

### Task 8: Update tsconfig to include scripts

`tsconfig.json` already includes `"scripts"` in the `include` array (from Task 2). Verify typecheck passes:

- [ ] **Step 1: Typecheck**

```bash
bun run typecheck
```

If error on `prompt()` not found — Bun's global `prompt` may need a type. Add to tsconfig or use a cast:

```typescript
// At top of scripts/init.ts if needed:
declare function prompt(question?: string): string | null;
```

- [ ] **Step 2: Lint scripts/**

```bash
bun run lint
```

Expected: clean. The `testOverride` in `eslint.config.mjs` disables `explicit-function-return-type` for test files.

- [ ] **Step 3: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve typecheck/lint issues in scripts/init.ts"
```

---

### Task 9: .gitignore + README

**Files:**

- Create: `.gitignore`, `README.md`

- [ ] **Step 1: Write `.gitignore`**

```gitignore
node_modules/
dist/
coverage/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 2: Write `README.md`**

````markdown
# ts-template

A GitHub template for TypeScript projects. Wires up ESLint, Prettier, commitlint,
markdownlint, Vitest, and TypeScript via shared `@drod3763/*` configs. PRs are gated
by six required CI checks.

## Using this template

1. Click **Use this template** on GitHub.
2. Clone your new repo.
3. Run the scaffolder:

   ```bash
   bun install
   bun run init
````

Answer the prompts (lib / mono / app). The scaffolder rewrites `package.json`,
adjusts the file layout, and removes itself.

4. Commit the scaffolded state:

   ```bash
   git add -A
   git commit -m "chore: scaffold project"
   ```

5. Push and set up branch protection on `main`:
   - Required status checks: `commitlint`, `format-check`, `lint`, `markdownlint`, `test`, `typecheck`

6. For **lib** or **mono**: add `NPM_TOKEN` secret (Settings → Secrets → Actions).

## Project types

| Type   | Description                                      |
| ------ | ------------------------------------------------ |
| `lib`  | Publishable single-package library               |
| `mono` | Workspace monorepo with synchronized versioning  |
| `app`  | Server or CLI application (not published to npm) |

## Publishing (lib / mono)

Create a PR from a branch named `release/vX.Y.Z`. Merging to `main` triggers
`publish.yml`, which runs `bun publish` (lib) or publishes each `packages/*` (mono).

Requires `NPM_TOKEN` secret. For a private registry, update `registry-url` in
`.github/workflows/publish.yml`.

## CI checks

All six checks call reusable workflows from [`drod3763/configs`](https://github.com/drod3763/configs):

| Check          | Tool                       |
| -------------- | -------------------------- |
| `commitlint`   | Conventional commit format |
| `format-check` | Prettier                   |
| `lint`         | ESLint                     |
| `markdownlint` | markdownlint-cli2          |
| `test`         | Vitest with coverage       |
| `typecheck`    | TypeScript `--noEmit`      |

````

- [ ] **Step 3: Run markdownlint**

```bash
bunx markdownlint-cli2
````

Expected: passes. If it reports issues, fix formatting in `README.md`.

- [ ] **Step 4: Commit**

```bash
git add .gitignore README.md
git commit -m "docs: add README and .gitignore"
```

---

### Task 10: Full pre-scaffold verification

Run every check the CI will run, in order:

- [ ] **Step 1:** `bun run typecheck` → clean
- [ ] **Step 2:** `bun run lint` → clean
- [ ] **Step 3:** `bun run format:check` → clean (run `bun run format` + re-check if not)
- [ ] **Step 4:** `bunx markdownlint-cli2` → clean
- [ ] **Step 5:** `bun run test` → all tests pass, coverage emitted
- [ ] **Step 6:** Commit any remaining fixes

```bash
git add -A
git commit -m "chore: pre-scaffold verification clean"
```

---

### Task 11: Scaffolder integration tests (manual, temp dirs)

- [ ] **Step 1: Test lib scaffold**

```bash
cp -r /Users/derick/Projects/ts-template /tmp/test-lib
cd /tmp/test-lib
bun run init
# Enter: lib → @test/mylib
bun install
bun run typecheck && bun run lint && bun run format:check && bun run test
# Verify: scripts/init.ts gone, publish.yml kept, src/index.ts exists
```

- [ ] **Step 2: Test mono scaffold**

```bash
cp -r /Users/derick/Projects/ts-template /tmp/test-mono
cd /tmp/test-mono
bun run init
# Enter: mono → my-mono
bun install
bun run typecheck && bun run lint && bun run test
# Verify: packages/example/src/ exists, workspaces in package.json, src/ removed
```

- [ ] **Step 3: Test app/server scaffold**

```bash
cp -r /Users/derick/Projects/ts-template /tmp/test-app
cd /tmp/test-app
bun run init
# Enter: app → server → my-server
bun install
bun run typecheck && bun run lint && bun run test
# Verify: publish.yml deleted, private: true, start script present
```

- [ ] **Step 4: Test app/cli scaffold**

```bash
cp -r /Users/derick/Projects/ts-template /tmp/test-cli
cd /tmp/test-cli
bun run init
# Enter: app → cli → my-cli
bun install
bun run typecheck && bun run lint && bun run test
# Verify: bin field in package.json, shebang in src/index.ts
```

- [ ] **Step 5: Commit final state**

Back in `/Users/derick/Projects/ts-template`:

```bash
git add -A
git commit -m "chore: ready for use as GitHub template"
```

---

## Verification Summary

Pre-scaffold (template state):

- `bun run typecheck` → clean
- `bun run lint` → clean
- `bun run format:check` → clean
- `bunx markdownlint-cli2` → clean
- `bun run test` → 2 src tests + N scaffolder tests pass

Post-scaffold (each type): re-run all five checks in a temp copy.

GitHub (after push):

- Open a PR → all 6 CI jobs appear and pass
- Merge a `release/v0.1.0` PR → publish job runs (lib/mono)
