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

export type ProjectType = "lib" | "mono" | "app" | "action";
export type AppSubtype = "server" | "cli";

interface PackageJson {
  name: string;
  version?: string;
  private?: boolean;
  type?: string;
  exports?: Record<string, unknown>;
  files?: string[];
  bin?: Record<string, string>;
  workspaces?: string[];
  main?: string;
  types?: string;
  dependencies?: Record<string, string>;
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
  [key: string]: unknown;
}

// ─── Shared dist field set ────────────────────────────────────────────────────

const DIST_FIELDS: {
  main: string;
  types: string;
  exports: Record<string, unknown>;
  files: string[];
} = {
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  exports: {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    },
  },
  files: ["dist"],
};

// ─── Pure transforms (exported for tests) ─────────────────────────────────────

export const transformLibPackageJson = (
  pkg: PackageJson,
  name: string,
): PackageJson => {
  const { init: _init, ...scripts } = pkg.scripts;
  return { ...pkg, name, scripts, ...DIST_FIELDS };
};

export const transformMonoPackageJson = (
  pkg: PackageJson,
  name: string,
): PackageJson => {
  const { init: _init, ...scripts } = pkg.scripts;
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
  asAction = false,
): PackageJson => {
  const { init: _init, ...scripts } = pkg.scripts;
  const { exports: _exports, files: _files, version: _version, ...rest } = pkg;

  scripts["start"] = "bun run src/index.ts";

  if (asAction && subtype === "cli") {
    const result: PackageJson = {
      ...rest,
      name,
      scripts,
      ...DIST_FIELDS,
      bin: { [basename(name)]: "./dist/index.js" },
    };
    return result;
  }

  const result: PackageJson = { ...rest, name, private: true, scripts };

  if (subtype === "cli") {
    result.bin = { [basename(name)]: "./dist/index.js" };
  }

  return result;
};

export const transformActionPackageJson = (
  pkg: PackageJson,
  name: string,
): PackageJson => {
  const { init: _init, ...scripts } = pkg.scripts;
  const { exports: _exports, files: _files, version: _version, ...rest } = pkg;

  scripts["build"] =
    "ncc build src/index.ts -o dist --source-map --license licenses.txt";

  return {
    ...rest,
    name,
    private: true,
    scripts,
    devDependencies: {
      ...pkg.devDependencies,
      "@vercel/ncc": "^0.38.0",
    },
    dependencies: {
      ...(pkg.dependencies ?? {}),
      "@actions/core": "^1.11.0",
    },
  };
};

export const generateNextSteps = (type: ProjectType): string => {
  const steps = [
    "1. Run: bun install",
    "2. Push to GitHub and enable branch protection on main",
    "   Required status checks: commitlint, format-check, lint, markdownlint, test, typecheck",
  ];
  if (type === "action") {
    steps.push(
      "3. Commit dist/ after building: bun run build && git add dist/ && git commit -m 'build: bundle action'",
    );
    steps.push("4. Tag a release: git tag -f v1 && git push -f origin v1");
  } else if (type !== "app") {
    steps.push(
      "3. First publish (once, locally): bun run build && bun pm pack && npm publish *.tgz --access public && rm *.tgz",
    );
    steps.push(
      "4. Configure trusted publishing on npmjs.com → package settings → Trusted Publishing",
    );
    steps.push(
      "5. To publish via CI: bump version, open a PR from release/vX.Y.Z, merge",
    );
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
  const num = parseInt(raw ?? "1", 10);
  if (isNaN(num) || num < 1 || num > choices.length)
    return choose(question, choices);
  return choices[num - 1] as T;
};

// ─── Filesystem mutations ──────────────────────────────────────────────────────

const scaffoldMono = (pkgName: string): void => {
  const exampleDir = "packages/example/src";
  mkdirSync(exampleDir, { recursive: true });

  if (existsSync("src/index.ts")) {
    renameSync("src/index.ts", `${exampleDir}/index.ts`);
  }
  if (existsSync("src/index.test.ts")) {
    renameSync("src/index.test.ts", `${exampleDir}/index.test.ts`);
  }
  try {
    rmSync("src", { recursive: true });
  } catch {
    /* already empty */
  }

  // Patch tsconfig.json: replace "src" include with "packages"
  const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf-8")) as {
    include?: string[];
    [key: string]: unknown;
  };
  if (Array.isArray(tsconfig.include)) {
    tsconfig.include = tsconfig.include.map((p) =>
      p === "src" ? "packages" : p,
    );
  }
  writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2) + "\n");

  const examplePkg = {
    name: `${pkgName}/example`,
    version: "0.0.0",
    type: "module",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
    },
    files: ["dist"],
    scripts: {
      build: "tsc --project tsconfig.build.json",
      test: "vitest run --coverage",
    },
  };
  writeFileSync(
    "packages/example/package.json",
    JSON.stringify(examplePkg, null, 2) + "\n",
  );

  const publishYml = readFileSync(".github/workflows/publish.yml", "utf-8");
  const OLD_STEP = `      - name: Publish\n        run: |\n          bun pm pack\n          bunx npm publish *.tgz --access public --provenance\n          rm *.tgz`;
  const NEW_STEP = `      - name: Publish all packages\n        run: |\n          for d in packages/*/; do\n            (cd "$d" && bun pm pack && bunx npm publish *.tgz --access public --provenance && rm *.tgz)\n          done`;
  const patched = publishYml.replace(OLD_STEP, NEW_STEP);
  writeFileSync(".github/workflows/publish.yml", patched);
};

const scaffoldApp = (subtype: AppSubtype, asAction = false): void => {
  if (!asAction) {
    rmSync(".github/workflows/publish.yml");
  }

  if (subtype === "cli") {
    const entry = readFileSync("src/index.ts", "utf-8");
    writeFileSync("src/index.ts", `#!/usr/bin/env bun\n${entry}`);
  }
};

const scaffoldAction = (name: string): void => {
  // Write action.yml (node24, ncc-bundled)
  const actionName = basename(name);
  writeFileSync(
    "action.yml",
    `name: "${actionName}"
description: "TODO: describe what this action does"
inputs:
  who:
    description: "Name to greet"
    required: false
    default: "world"
outputs:
  greeting:
    description: "The greeting output"
runs:
  using: "node20"
  main: "dist/index.js"
`,
  );

  // Overwrite src/index.ts with @actions/core entry
  writeFileSync(
    "src/index.ts",
    `import * as core from "@actions/core";

export const run = (who: string): string => \`Hello, \${who}!\`;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const who = core.getInput("who") || "world";
  core.setOutput("greeting", run(who));
}
`,
  );

  // Overwrite src/index.test.ts
  writeFileSync(
    "src/index.test.ts",
    `import { describe, expect, it } from "vitest";
import { run } from "./index.js";

describe("run", () => {
  it("greets the given input", () => {
    expect(run("world")).toBe("Hello, world!");
  });
});
`,
  );

  // Delete publish.yml — actions aren't published to npm
  rmSync(".github/workflows/publish.yml");

  // Remove dist/ from .gitignore — Actions require committed dist/
  const gitignore = readFileSync(".gitignore", "utf-8");
  writeFileSync(
    ".gitignore",
    gitignore
      .split("\n")
      .filter((line) => line.trim() !== "dist/")
      .join("\n"),
  );
};

const scaffoldCliAction = (name: string): void => {
  const actionName = basename(name);
  // Write composite action.yml — invokes the published CLI via bunx
  writeFileSync(
    "action.yml",
    `name: "${actionName}"
description: "TODO: describe what this CLI action does"
inputs:
  args:
    description: "Arguments passed to the CLI"
    required: false
    default: ""
runs:
  using: composite
  steps:
    - shell: bash
      run: bunx ${name} \${{ inputs.args }}
`,
  );
  // publish.yml is kept (cli is published to npm)
  // dist/ stays gitignored (composite action doesn't need committed dist)
};

// ─── README generation ────────────────────────────────────────────────────────

const generateReadme = (name: string, type: ProjectType): string => {
  let publishSection = "";
  if (type === "lib" || type === "mono") {
    publishSection = `
## Publishing

**First publish (once, locally):**

\`\`\`bash
bun run build
bun pm pack
npm publish *.tgz --access public
rm *.tgz
\`\`\`

**Ongoing (trusted, no token):**

1. On npmjs.com → package → Settings → Trusted Publishing → add GitHub Actions for this repo, workflow \`publish.yml\`.
2. Bump version in \`package.json\`.
3. Open a PR from a \`release/vX.Y.Z\` branch → merge to \`main\`.
`;
  } else if (type === "action") {
    publishSection = `
## Releasing

After making changes, build and commit the bundle, then tag:

\`\`\`bash
bun run build
git add dist/
git commit -m "build: bundle action"
git tag -f v1
git push -f origin v1
\`\`\`

Consumers reference this action as \`uses: <owner>/${name}@v1\`.
`;
  }

  const cliActionSection =
    type === "app"
      ? `
## Using as a GitHub Action

\`\`\`yaml
- uses: <owner>/${name}@v1
  with:
    args: "--help"
\`\`\`
`
      : "";

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
${publishSection}${cliActionSection}`;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = (): void => {
  console.log("\n🚀 TypeScript Project Scaffolder\n");

  const type = choose<ProjectType>("Project type:", [
    "lib",
    "mono",
    "app",
    "action",
  ]);

  let subtype: AppSubtype = "server";
  let asAction = false;

  if (type === "app") {
    subtype = choose<AppSubtype>("App subtype:", ["server", "cli"]);
    if (subtype === "cli") {
      const ans = ask("Also expose as a GitHub Action? (y/N)", "N");
      asAction = ans.toLowerCase().startsWith("y");
    }
  }

  const dirName = basename(process.cwd());
  const defaultName =
    type === "app" || type === "action" ? dirName : `@scope/${dirName}`;
  const name = ask("Package name", defaultName);

  let pkg: PackageJson;
  try {
    pkg = JSON.parse(readFileSync("package.json", "utf-8")) as PackageJson;
  } catch {
    console.error("Error: could not read package.json — run from repo root.");
    process.exit(1);
  }

  let newPkg: PackageJson;
  if (type === "lib") newPkg = transformLibPackageJson(pkg, name);
  else if (type === "mono") newPkg = transformMonoPackageJson(pkg, name);
  else if (type === "action") newPkg = transformActionPackageJson(pkg, name);
  else newPkg = transformAppPackageJson(pkg, name, subtype, asAction);

  writeFileSync("package.json", JSON.stringify(newPkg, null, 2) + "\n");

  if (type === "mono") scaffoldMono(name);
  if (type === "app") scaffoldApp(subtype, asAction);
  if (type === "action") scaffoldAction(name);
  if (type === "app" && subtype === "cli" && asAction) scaffoldCliAction(name);

  writeFileSync("README.md", generateReadme(name, type));

  rmSync("scripts/init.ts");
  rmSync("scripts/init.test.ts", { force: true });

  console.log("\n✅ Scaffold complete!\n");
  console.log(generateNextSteps(type));
  console.log();
};

// Only run main when executed directly (not when imported by tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
