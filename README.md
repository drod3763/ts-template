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

   Answer the prompts (lib / mono / app / action). The scaffolder rewrites `package.json`,
   adjusts the file layout, and removes itself.

4. Commit the scaffolded state:

   ```bash
   git add -A
   git commit -m "chore: scaffold project"
   ```

5. Push and set up branch protection on `main`:
   - Required status checks: `commitlint`, `format-check`, `lint`, `markdownlint`, `test`, `typecheck`

6. For **lib** or **mono**: set up trusted publishing (see Publishing section below).

## Project types

| Type     | Description                                            |
| -------- | ------------------------------------------------------ |
| `lib`    | Publishable single-package library                     |
| `mono`   | Workspace monorepo with synchronized versioning        |
| `app`    | Server or CLI application (optionally a GitHub Action) |
| `action` | Standalone GitHub Action (node20, ncc-bundled)         |

## Publishing — lib / mono

### First publish (bootstrap, once locally)

Trusted publishing requires the package to already exist on npm.

```bash
bun run build
bun pm pack
npm publish *.tgz --access public
rm *.tgz
```

### Ongoing (trusted publishing, no token)

1. On npmjs.com → your package → **Settings** → **Trusted Publishing** → add:
   - Publisher: GitHub Actions
   - Repository: `owner/repo`
   - Workflow: `publish.yml`
2. Bump version in `package.json`.
3. Open a PR from a `release/vX.Y.Z` branch → merge to `main`.
4. `publish.yml` runs `npm publish --provenance` via OIDC. No token needed.

## Releasing — action type

```bash
bun run build
git add dist/
git commit -m "build: bundle action"
git tag -f v1
git push -f origin v1
```

Consumers reference the action as `uses: owner/repo@v1`.

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
