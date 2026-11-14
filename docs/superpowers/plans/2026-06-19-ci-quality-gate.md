# CI Quality Gate & Tag-Based Deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automated quality gate (lint + build + tests on every PR), protect `main`, and make production deployment a deliberate, versioned act triggered by a release tag.

**Architecture:** A platform-agnostic CI workflow (`ci.yml`) runs on every PR and blocks merges when red. A separate, Dokploy-specific deploy workflow (`deploy.yml`) runs only on `v*` tags. `main` stays green but is no longer auto-deployed. Test harnesses are added to `web` (Vitest) and `pcs-service` (pytest); `api` already uses Japa.

**Tech Stack:** GitHub Actions, Turborepo/pnpm, AdonisJS/Japa (api), Vitest + React Testing Library (web), pytest + FastAPI TestClient (pcs), Docker/Dokploy.

**Reference spec:** `docs/superpowers/specs/2026-06-19-ci-quality-gate-design.md`

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `.nvmrc` | Pin Node version (CI + local) |
| `.github/workflows/ci.yml` | Quality gate on PRs (js + python jobs) |
| `.github/workflows/deploy.yml` | Tag-triggered production deploy via Dokploy |
| `apps/web/vitest.config.ts` | Vitest config (jsdom env, setup file) |
| `apps/web/src/test/setup.ts` | Test runtime setup (jest-dom matchers) |
| `apps/web/src/components/RankDelta.test.tsx` | First real web test |
| `apps/pcs-service/requirements-dev.txt` | Python dev/test deps |
| `apps/pcs-service/pytest.ini` | pytest config (pythonpath) |
| `apps/pcs-service/tests/test_health.py` | First real pcs test |
| `apps/web/Dockerfile`, `apps/pcs-service/Dockerfile` | Renamed from `DockerFile` |
| `docker-compose.yml` | Updated Dockerfile path references |
| `README.md` | Document the PR → tag → deploy flow |

---

## Task 1: Pin Node version with `.nvmrc`

**Files:**
- Create: `.nvmrc`

- [ ] **Step 1: Create the `.nvmrc` file**

Create `.nvmrc` at the repo root with exactly:

```
22
```

- [ ] **Step 2: Verify content**

Run: `cat .nvmrc`
Expected: `22`

- [ ] **Step 3: Commit**

```bash
git add .nvmrc
git commit -m "chore: pin Node version to 22 via .nvmrc"
```

---

## Task 2: Standardize Dockerfile naming

`apps/api/Dockerfile` (Node 22, full monorepo build) is correct and referenced by the compose file. `apps/api/DockerFile` is a stale, broken duplicate (Node 20, wrong `@bcf/api` filter) and must be deleted. `apps/web` and `apps/pcs-service` only have `DockerFile` and must be renamed to `Dockerfile`, with compose references updated.

**Files:**
- Delete: `apps/api/DockerFile`
- Rename: `apps/web/DockerFile` → `apps/web/Dockerfile`
- Rename: `apps/pcs-service/DockerFile` → `apps/pcs-service/Dockerfile`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Delete the stale api duplicate**

```bash
git rm apps/api/DockerFile
```

- [ ] **Step 2: Rename web and pcs Dockerfiles**

```bash
git mv apps/web/DockerFile apps/web/Dockerfile
git mv apps/pcs-service/DockerFile apps/pcs-service/Dockerfile
```

- [ ] **Step 3: Update compose references**

In `docker-compose.yml`, change the `pcs-service` build block:

```yaml
  pcs-service:
    build:
      context: apps/pcs-service
      dockerfile: Dockerfile
```

And the `web` build block:

```yaml
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
```

(The `api` block already references `apps/api/Dockerfile` — leave it unchanged.)

- [ ] **Step 4: Verify no stray `DockerFile` remains and compose parses**

Run: `git ls-files | grep -i dockerfile`
Expected: only `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/pcs-service/Dockerfile` (all with lowercase `ockerfile`)

Run: `docker compose config >/dev/null && echo OK`
Expected: `OK` (no error about missing build files)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: standardize Dockerfile naming and remove stale duplicate"
```

---

## Task 3: Add Vitest harness to `web` + first test

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/components/RankDelta.test.tsx`
- Modify: `apps/web/tsconfig.json` (exclude tests from the build type-check)

- [ ] **Step 1: Install test dependencies**

Run:
```bash
pnpm --filter @bcf/web add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom
```
Expected: packages added to `apps/web/package.json` devDependencies, lockfile updated.

- [ ] **Step 2: Add the `test` script**

In `apps/web/package.json`, add to `"scripts"`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create the Vitest config**

Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Create the test setup file**

Create `apps/web/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Exclude tests from the build type-check**

In `apps/web/tsconfig.json`, add an `exclude` array (the build runs `tsc -b`, which would otherwise type-check test files and fail). The file becomes:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test"],
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 6: Write the failing test**

Create `apps/web/src/components/RankDelta.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RankDelta from './RankDelta'

describe('RankDelta', () => {
  it('renders an up arrow for a positive delta', () => {
    render(<RankDelta delta={3} />)
    expect(screen.getByText('▲3')).toBeInTheDocument()
  })

  it('renders a down arrow with the absolute value for a negative delta', () => {
    render(<RankDelta delta={-2} />)
    expect(screen.getByText('▼2')).toBeInTheDocument()
  })

  it('renders a dash when delta is null', () => {
    render(<RankDelta delta={null} />)
    expect(screen.getByText('–')).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Run the test**

Run: `pnpm --filter @bcf/web test`
Expected: 3 tests pass. (`RankDelta` already implements this behavior, so the harness is what we are validating.)

- [ ] **Step 8: Verify the build still passes with tests present**

Run: `pnpm --filter @bcf/web build`
Expected: build succeeds (test files excluded from `tsc -b`).

- [ ] **Step 9: Commit**

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/src/test/setup.ts apps/web/src/components/RankDelta.test.tsx apps/web/tsconfig.json pnpm-lock.yaml
git commit -m "test(web): add Vitest harness and RankDelta test"
```

---

## Task 4: Add pytest harness to `pcs-service` + first test

**Files:**
- Create: `apps/pcs-service/requirements-dev.txt`
- Create: `apps/pcs-service/pytest.ini`
- Create: `apps/pcs-service/tests/__init__.py`
- Create: `apps/pcs-service/tests/test_health.py`

- [ ] **Step 1: Create the dev requirements file**

Create `apps/pcs-service/requirements-dev.txt`:

```
-r requirements.txt
pytest==8.3.3
```

(`httpx`, needed by FastAPI's `TestClient`, is already in `requirements.txt`.)

- [ ] **Step 2: Create the pytest config**

Create `apps/pcs-service/pytest.ini` so tests can import the `app` package:

```ini
[pytest]
pythonpath = .
testpaths = tests
```

- [ ] **Step 3: Create the tests package marker**

Create an empty file `apps/pcs-service/tests/__init__.py` (no content).

- [ ] **Step 4: Write the failing test**

Create `apps/pcs-service/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: Install dev deps and run the test**

Run:
```bash
cd apps/pcs-service && python -m venv .venv 2>/dev/null; . .venv/bin/activate && pip install -r requirements-dev.txt && pytest
```
Expected: `1 passed`. (`/health` already returns `{"status": "ok"}`, so this validates the harness.)

- [ ] **Step 6: Commit**

```bash
git add apps/pcs-service/requirements-dev.txt apps/pcs-service/pytest.ini apps/pcs-service/tests/__init__.py apps/pcs-service/tests/test_health.py
git commit -m "test(pcs): add pytest harness and health endpoint test"
```

---

## Task 5: CI workflow (quality gate on PRs)

The `js` job needs a Postgres service (api tests use the `postgres` Lucid connection and run migrations) and a Redis service (the app may connect to Redis via BullMQ at boot). All non-optional env vars from `apps/api/start/env.ts` must be provided or the app fails to boot during tests.

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  js:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: bcf
          POSTGRES_PASSWORD: bcf_password
          POSTGRES_DB: bcf_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U bcf"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    env:
      NODE_ENV: test
      PORT: 3333
      HOST: 0.0.0.0
      LOG_LEVEL: info
      APP_KEY: insecureTestAppKey0123456789abcdef
      DB_HOST: localhost
      DB_PORT: 5432
      DB_USER: bcf
      DB_PASSWORD: bcf_password
      DB_DATABASE: bcf_test
      REDIS_HOST: localhost
      REDIS_PORT: 6379
      SMTP_HOST: localhost
      SMTP_PORT: 1025
      SMTP_USERNAME: test
      SMTP_PASSWORD: test
      MAIL_FROM_NAME: BCF
      MAIL_FROM_ADDRESS: noreply@bcf.test
      PCS_SERVICE_URL: http://localhost:8000
      FRONTEND_URL: http://localhost:5173
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.9
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
      - name: Run API migrations on the test database
        run: pnpm --filter api exec node ace migration:run --force
      - run: pnpm test

  python:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/pcs-service
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
          cache-dependency-path: apps/pcs-service/requirements-dev.txt
      - run: pip install -r requirements-dev.txt
      - run: pytest
```

- [ ] **Step 2: Validate the YAML locally**

Run: `python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('valid yaml')"`
Expected: `valid yaml`

- [ ] **Step 3: Commit and push a branch to trigger CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add quality gate workflow for PRs"
git push -u origin feat/ci-quality-gate
```

- [ ] **Step 4: Open a PR and verify CI runs green**

Run: `gh pr create --fill --base main`
Then: `gh pr checks --watch`
Expected: both `js` and `python` checks complete with PASS. If a step fails, fix it (e.g. lint errors, missing env, migration failure) before continuing.

---

## Task 6: Deploy workflow (tag-triggered)

Deployment is triggered by pushing a `v*` tag. The workflow calls a Dokploy deploy webhook (stored as a secret) and creates a GitHub Release. This is the only repo file coupled to Dokploy.

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Dokploy deployment
        run: curl -fsS -X POST "${{ secrets.DOKPLOY_DEPLOY_WEBHOOK }}"
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

- [ ] **Step 2: Validate the YAML**

Run: `python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('valid yaml')"`
Expected: `valid yaml`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add tag-triggered Dokploy deploy workflow"
```

(End-to-end verification of this workflow happens in Task 8, after the secret and Dokploy are configured.)

---

## Task 7: Document the workflow in the README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a "Development & deployment workflow" section**

Append the following section to `README.md`:

```markdown
## Development & deployment workflow

1. Branch from `main` and open a Pull Request.
2. CI (`.github/workflows/ci.yml`) runs on every PR: lint + build + tests
   (`js` job for api/web/shared, `python` job for pcs-service).
3. `main` is protected: a PR can only be merged once both checks are green.
4. Merging to `main` does **not** deploy. `main` always stays releasable.
5. To deploy to production, create and push a release tag:

   ```bash
   git tag v1.2.0
   git push --tags
   ```

   This triggers `.github/workflows/deploy.yml`, which calls the Dokploy
   deploy webhook and creates a GitHub Release.

### Required configuration

- GitHub secret `DOKPLOY_DEPLOY_WEBHOOK`: the Dokploy application deploy
  webhook URL.
- Branch protection on `main` requiring the `js` and `python` checks.
- Dokploy: disable auto-deploy on push to `main` (deployment now goes
  through the tag workflow).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document PR-to-tag deployment workflow"
```

---

## Task 8: Configure protections & deployment (manual / user steps)

These steps require GitHub admin rights and access to the Dokploy UI, so they may need to be performed by the user. Each is documented with the exact command where possible.

- [ ] **Step 1: Merge the CI PR**

Once Task 5's PR is green, merge it so `ci.yml` exists on `main` (branch protection can only require checks that exist).

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 2: Enable branch protection on `main`**

Run (replace nothing — `:owner/:repo` are resolved automatically by `gh`):

```bash
gh api -X PUT "repos/:owner/:repo/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["js", "python"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
```

Expected: JSON response describing the protection settings. Verify in GitHub → Settings → Branches.

- [ ] **Step 3: Add the Dokploy deploy webhook secret**

In Dokploy, open the application and copy its deploy webhook URL (Dokploy → application → "API/Webhook" / auto-deploy URL). Then:

```bash
gh secret set DOKPLOY_DEPLOY_WEBHOOK
```

Paste the URL when prompted. (Verify the exact location of the deploy webhook in Dokploy's UI; confirm it accepts a `POST` to trigger a redeploy.)

- [ ] **Step 4: Disable auto-deploy on `main` in Dokploy**

In the Dokploy UI, turn off the "auto deploy on push" / branch webhook for `main`, so deployment only happens via the tag workflow.

- [ ] **Step 5: End-to-end deploy test**

```bash
git checkout main && git pull
git tag v0.1.0
git push --tags
```

Then watch the deploy run:

```bash
gh run watch
```

Expected: `deploy.yml` succeeds, Dokploy redeploys the stack, and a GitHub Release `v0.1.0` is created. Verify the production site reflects the deploy.

---

## Notes / risks to watch during execution

- **Existing lint errors:** `pnpm lint` may surface pre-existing issues in `api`/`web`. Fix them within Task 5 before the PR can go green.
- **Vitest ↔ Vite 8 version compatibility:** if `pnpm add` resolves an incompatible Vitest, pin a version compatible with the installed Vite. The harness test logic does not change.
- **`better-sqlite3` is unused in CI:** api tests run against the Postgres service, not SQLite. No SQLite test connection exists in `config/database.ts`.
- **Migration compatibility:** migrations are Postgres-specific; running them against the Postgres service (not SQLite) avoids dialect issues.
- **Dokploy webhook specifics:** confirm the deploy webhook URL/auth in Dokploy; the workflow assumes a simple `POST` triggers a redeploy.
```
