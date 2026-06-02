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
): PackageJson => {
  const { init: _init, ...scripts } = pkg.scripts;
  const { exports: _exports, files: _files, version: _version, ...rest } = pkg;

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
    steps.push(
      "3. Add NPM_TOKEN secret to repo settings (Settings → Secrets → Actions)",
    );
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

  const publishYml = readFileSync(".github/workflows/publish.yml", "utf-8");
  const patched = publishYml.replace(
    /      - name: Publish\n        run: bun publish --access public\n        env:\n          NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}\n/,
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
  rmSync(".github/workflows/publish.yml");

  if (subtype === "cli") {
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
  const defaultName = type === "app" ? dirName : `@scope/${dirName}`;
  const name = ask("Package name", defaultName);

  const raw = readFileSync("package.json", "utf-8");
  const pkg = JSON.parse(raw) as PackageJson;

  let newPkg: PackageJson;
  if (type === "lib") newPkg = transformLibPackageJson(pkg, name);
  else if (type === "mono") newPkg = transformMonoPackageJson(pkg, name);
  else newPkg = transformAppPackageJson(pkg, name, subtype);

  writeFileSync("package.json", JSON.stringify(newPkg, null, 2) + "\n");

  if (type === "mono") scaffoldMono(name);
  if (type === "app") scaffoldApp(subtype);

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
