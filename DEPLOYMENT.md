# How these templates deploy to production

This fork (`QuicksilverSlick/vibesdk-templates`) is the source of the app-generation
templates served by **dreamforge-cf** from its `vibesdk-templates` R2 bucket.

## Flow
1. Change a template source here (prefer `reference/*` for cross-cutting fixes; `definitions/*` for per-template), PR → merge to `main`.
2. [`notify-template-deploy.yml`](.github/workflows/notify-template-deploy.yml) fires a `repository_dispatch` (`templates-updated`) at **dreamforge-cf**.
3. dreamforge-cf's `deploy-templates.yml` checks out this fork, runs `deploy_templates.sh` (generate → zip → `wrangler r2 object put --remote`), and uploads to R2.
4. New app generations pick up the change. No Worker redeploy needed.

## One-time setup
Add a **`DISPATCH_TOKEN`** secret here (Settings → Secrets and variables → Actions): a GitHub
token able to POST `repository_dispatch` to `dreamforge-cf` (classic `repo`, or fine-grained with
**Contents: read & write** on `dreamforge-cf`). Without it, pushes log a warning instead of deploying —
deploy manually via `deploy-templates.yml` (`workflow_dispatch`) in dreamforge-cf.

## Manual deploy / rollback
Run **`deploy-templates.yml`** in dreamforge-cf via `workflow_dispatch`; pin `templates_ref` to a
known-good SHA to roll back. Each run archives the previous `template_catalog.json` as an artifact.

## Staying current with upstream
`upstream` remote = `cloudflare/vibesdk-templates`. Periodically `git fetch upstream && git merge
upstream/main`, re-apply our small patch set, then let the deploy run. See `MODERNIZATION_PLAN.md`.

Full operational contract (secrets, monitoring, troubleshooting) lives in dreamforge-cf:
`.github/workflows/README.md` → "Template deploy contract".
