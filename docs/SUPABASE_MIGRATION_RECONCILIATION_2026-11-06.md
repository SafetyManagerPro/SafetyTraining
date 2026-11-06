# SafetyTraining — reconciliation of Supabase migration history (2026-11-06)

This change is strictly repository-file metadata and original historical SQL. No SQL is re-run against production and no application code, enrollment, course, or learner data is changed.

- Source of truth: read-only `supabase_migrations.schema_migrations` on the production Supabase project.
- Original main commit: `89bc1b048dae5e5290429760a054f00882700854`.
- Original file count: 184; remote recorded migrations: 188.
- 136 local versions already matched; 46 file versions were renamed to the previously applied remote versions.
- 26 historical SQL bodies recovered byte-for-byte from the applied migration history (20 differing local historical scripts and six absent remote version entries).
- Two previously non-executed local scripts/manifests were preserved in `docs/migration-archives/` instead of being placed in the runnable migrations directory.
- The 188 resulting version identifiers exactly match the 188 recorded remote version identifiers. No new migration version is introduced.
- **Important:** 107 pre-existing local SQL bodies sharing already-recorded version identifiers are not byte-for-byte identical to the remote historical statements. They remain unchanged in this targeted fix and warrant a later separate audit of full fresh-database replay. Do not claim a full replay-validation solely from passing GitHub syntax checks.
- Keep this PR unmerged unless GitHub syntax checks, Supabase Preview, and the production data-integrity baseline have been reviewed.

For historical comparison the original local bodies remain retrievable in Git history at `89bc1b048dae5e5290429760a054f00882700854`. The release and schema are unchanged until a separately validated merge.
