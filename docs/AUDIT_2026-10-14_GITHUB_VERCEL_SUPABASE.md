# SafetyTraining audit — 14 October 2026

Scope: GitHub repository, Vercel production deployment and SafetyTraining Supabase project.

## Executive status

Overall status: healthy and operational. No blocking production regression was found during the audit.

- GitHub repository: `SafetyManagerPro/SafetyTraining`, branch `main`.
- Vercel project: `safety-training`, production deployment connected to GitHub `main`.
- Supabase project: `SafetyTraining` (`ejkwvatmzdqqjozpxntk`), ACTIVE_HEALTHY.
- Public production endpoint returned HTTP 200 during the audit.
- No production warning/error/fatal runtime logs were returned for the last 30 minutes checked.
- Vercel uses the SafetyTraining Supabase URL and a browser-safe publishable key.

## Current training architecture

The live database contains:

- 28 training blueprints.
- 48 normalized blueprint variants.
- 11 explicit Master Registry rules.
- 60 mapped SafetyManager course types.
- 53 blueprint sections.
- 100 Learning Units.
- 7 reusable learning content profiles.

The original SafetyManager catalog was progressively extended: the SafetyTraining bridge now maps 60 source course types, so 53 must be treated as the historical starting catalog rather than the current total.

Core tables used by the training architecture include:

- `training_blueprints`
- `training_blueprint_course_types`
- `training_blueprint_sections`
- `training_blueprint_variants`
- `training_blueprint_rules`
- `learning_content_profiles`
- `learning_units`
- `learning_unit_versions`
- `learning_unit_risk_links`
- `integration_course_catalog`

## Master Registry v1

Migration `v20_027_master_registry_variants_rules` was applied and versioned in GitHub.

It adds explicit variants and deterministic rules without deleting or renaming legacy SafetyManager course IDs. Current rules cover, among other things:

- fixed 4h general core for initial worker training;
- risk-specific composition of the remaining worker duration;
- project/DVR risks taking precedence over generic course profiles;
- DL SPP common module inheritance by sector variants;
- RLS update duration variants from the existing source catalog;
- separate practical component for work at height and equipment courses;
- audience resolution for the legacy shared `mod_cantieri` code (employer vs manager).

Both new tables have Row Level Security enabled and an admin-only policy.

## Migration reconciliation

The audit found three migrations registered as applied in Supabase but absent from GitHub:

- `20261013220834_v20_013_admin_console_rls_fixes`
- `20261014192009_v20_021_learning_unit_composition_v2`
- `20261014192123_v20_022_prioritize_project_risks`

Their SQL was recovered from `supabase_migrations.schema_migrations` and restored to the repository. The new `v20_027` migration is also committed, restoring migration-history traceability.

## GitHub / CI

The repository already had an `npm run check` script, but `apps/training/blueprint-admin.js` was not included and there was no GitHub Actions workflow executing the checks.

Audit remediation:

- added `blueprint-admin.js` to the syntax-check script;
- added `.github/workflows/check.yml` to run `npm run check` on pushes to `main` and on pull requests.

## Vercel

GitHub-to-Vercel automatic production deployment is functioning. During the audit the production deployment tracked the latest GitHub commits and reached `READY` state.

The production HTML includes the administrative modules, including `course-catalog.js` and `blueprint-admin.js`, and the public endpoint returned HTTP 200.

## Supabase security

Positive findings:

- RLS was enabled on all public tables checked before the Master Registry change.
- The two new Master Registry tables also have RLS enabled.
- SECURITY DEFINER functions inspected use an explicit `search_path` and administrative RPCs perform `private.is_platform_admin()` checks.

Security advisor items still to evaluate/harden:

1. SECURITY DEFINER functions executable by `authenticated` are flagged by the Supabase advisor. Most inspected administrative RPCs perform an internal platform-admin check; `claim_learner_account` is an intentional learner self-claim flow. The surface should nevertheless be reviewed before a public multi-tenant launch.
2. Leaked password protection is currently reported as disabled by the Supabase security advisor.

## Supabase performance advisor

Non-blocking warnings detected:

- some RLS policies evaluate auth helpers per row and can be optimized with init-plan patterns;
- multiple permissive policies exist on some tables;
- several indexes are currently reported unused.

Because the database is new and has little production workload, unused-index recommendations should not be acted on mechanically yet. RLS policy optimization can be addressed separately without changing the functional data model.

## Development status

More mature families:

- RLS initial: ready.
- Worker initial: partial, with risk-composition engine in place.
- Fire L1/L2/L3 and first-aid A/B-C: hybrid partial.
- Internal emergency/evacuation: partial.

Still mainly planned/draft:

- employer and updates;
- DL SPP common/sector/update;
- preposto and dirigente families;
- RLS updates;
- confined spaces;
- work at height/DPI fall protection;
- equipment initial/update families;
- additional statutory families not yet represented in the source catalog.

## Next implementation direction

Continue from the normalized Master Registry instead of creating a second parallel course registry. Add new statutory families as blueprints/variants/rules, then compose them from reusable Learning Units while keeping practical/presence requirements and final assessments separately traceable.
