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
   ```

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
