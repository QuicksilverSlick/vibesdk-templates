# Template Modernization Plan — June 2026

Owned fork: `QuicksilverSlick/vibesdk-templates` (upstream: `cloudflare/vibesdk-templates`).
This plan is for **review before execution**. P0 (dedupe) has already shipped.

## Goals
1. Bring every template to current (June-2026) Cloudflare + ecosystem best practices.
2. Maintain the fork as a thin, well-documented patch layer over upstream so we can keep
   syncing upstream improvements (`git fetch upstream && merge`) without losing our changes.
3. Align the **BYOP** import/convert path (`CodebaseAnalyzer`) with the same correctness
   guarantees (e.g. single-React-instance) so imported repos deploy cleanly too.
4. Gate template changes behind an automated **build-validation** step so a bad template can
   never reach R2 and break all generations.

## Architecture (as found)
Templates are **generated**, not stored as plain dirs:
- `reference/{vite,next,minimal-js}-reference/` — shared base apps (the real source of vite.config, etc.)
- `definitions/<name>/` + `<name>.yaml` — per-template overrides/additions on a reference
- `tools/generate_templates.py` → `build/`, then `deploy_templates.sh` zips + uploads to R2 (`vibesdk-templates` bucket)
A change in a `reference/` base propagates to all derived templates — the right place for cross-cutting fixes.

## Template inventory
Vite-derived (base `vite-reference`): `c-code-react-runner`, `minimal-vite`,
`vite-cf-DO-runner`, `vite-cf-DO-KV-runner`, `vite-cf-DO-v2-runner`, `vite-cfagents-runner`.
Next-derived (`next-reference`): `c-code-next-runner`.
Other: `minimal-js` (`minimal-js-reference`), `reveal-presentation-dev`, `reveal-presentation-pro`.

## Phases

### P0 — React/framer-motion dedupe (DONE)
`reference/vite-reference/vite.config.ts`: added `resolve.dedupe: ['react','react-dom']` and
included `framer-motion` in `optimizeDeps.include`. Fixes "more than one copy of React" crashes
across all vite-derived templates.

### P1 — Best-practices audit (per reference base) — VERIFY each against current Cloudflare docs
For each `reference/*` base, audit and bring current:
- **Vite**: confirm latest stable major; review `@cloudflare/vite-plugin` version + config surface.
- **Wrangler/Workers**: `compatibility_date` bumped to a current date; `nodejs_compat` flag;
  Static Assets config (`assets` binding / SPA fallback) vs legacy patterns.
- **React**: evaluate React 18 → 19 (and `@types/react`), and whether deps (radix, framer-motion,
  react-router 6 → 7) are compatible; pin intentionally.
- **agents SDK**: align the `agents` package version with what the worker supports (note: the worker
  side is currently pinned at `agents@0.1.6` pending the smart-agent mega-bundle — keep template and
  worker versions compatible).
- **Dependency hygiene**: dedupe/refresh lockfiles (`--sync-lockfiles`), drop unused deps, check for
  known advisories.
- **TS/ESLint configs**: current recommended `tsconfig`/eslint flat-config.
Deliverable: a per-base diff proposal, reviewed before applying.

### P2 — BYOP alignment
The GitHub import/convert path (`CodebaseAnalyzer`) does **not** use these templates, but imported
apps hit the same classes of issue (duplicate React with framer-motion, missing Workers/Vite config
for Cloudflare deploy). Add a conversion step that, for Vite+React imports, ensures
`resolve.dedupe` and a Cloudflare-deployable Vite/Wrangler config — mirroring the template guarantees.

### P3 — Build validation gate (CI)
Before `deploy_templates.sh` uploads to R2: generate each template, run `bun install` + `bun run build`
(and a smoke `dev` boot) in a Linux CI job; fail the deploy if any template doesn't build. Prevents a
bad template from breaking all generations. Run on the fork via GitHub Actions.

## Fork maintenance workflow
- `upstream` remote retained. Periodically `git fetch upstream && git merge upstream/main`, re-apply
  our (small, documented) patch set, regenerate, validate (P3), deploy.
- Keep our changes minimal and isolated (prefer `reference/*` edits) to ease upstream merges.

## Rollout
P0 is live on the next `npm run deploy` (dreamforge already repointed `TEMPLATES_REPOSITORY` to the
fork). P1–P3 land incrementally on the fork, each gated by P3 build validation, then promoted to R2.
