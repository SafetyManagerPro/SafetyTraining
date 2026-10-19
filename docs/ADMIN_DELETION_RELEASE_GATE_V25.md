# SafetyTraining — approval gates for destructive admin deletion

State: NOT RELEASED. The production database has read-only preview RPCs only. The execution RPC admin_execute_deletion_v25 is absent. This document is a review and test contract, not executable migration instructions.

## Frozen current facts (2026-10-19)

- User explicitly chose to continue development without testing restoration of the encrypted local backup. The backup file was created and internally checked, but is **not proven restorable**. External Storage/configuration is not included in the dump.
- Production preview only counts relations visible through PostgreSQL RLS. Indirect effects are informational and may not cover all constraints and triggers.
- Direct DELETE grants were revoked for anon and authenticated on sixteen protected public tables. No DELETE permission intentionally removed from service_role.
- Do not claim that a preview implies authorization to delete or that a test result constitutes real disaster recovery.

## Required server contract

The API must enforce all safeguards *server-side*, without trusting client role flags or client-selected effect counts.

1. **Auth and scope.** Server obtains `auth.uid()` and verifies platform_admin against protected authoritative state for every call. No user_metadata-based authorization; no service_role secret in browser.
2. **Operation scope.** Root and every selected dependent are identified by immutable primary keys. Reject unexpected tables, relationships, actions, duplicate identifiers, changed organization scope, and ambiguous composite keys.
3. **Full recursive impact graph.** Before committing, enumerate all rows that would be deleted, nullified, or prevented by FK constraints, including test_answers under test_attempts and learning_events/question_attempts under learning_sessions. Include dynamic FK introspection and triggers when applicable. Reject ANY unresolved or hidden impact. A selected root does not override explicit selections on descendants.
4. **Preview acknowledgement.** Every affected operation has table, unique row key, exact action (delete or unlink), source relationship, reason, and acknowledgement status. Count-only summaries are insufficient. A token must be minted server-side, linked to actor, root, exact decision set and graph hash, with a short expiry and single-use semantics. Never return token before graph complete.
5. **Serialized execution.** Execute in a single DB transaction after obtaining locks on the root/dependencies, rebuilding the graph, and checking that graph+actor+scope+selections still match the token. Concurrent changes invalidate the request and require a fresh preview.
6. **Audit integrity.** Insert an immutable audit event in the same transaction as the removal (or roll back both), including actor, operation id, root, full canonical decision set/impact graph digest, affected-row counts and execution timestamp. Do not log invitation secrets, personal data payloads, or database passwords.
7. **Safe failure and idempotency.** Duplicate/replayed token denied. Any failure rolls back all changes. Success response contains only commit attestation / audit id; no speculative success.
8. **Authorization bypass audit.** Confirm there are no alternative destructive endpoints, SECURITY DEFINER helpers with unbounded DELETE, or public grants that bypass the controlled path; recheck grants after migrations.

## Frontend execution gates (v22.5.4)

`admin_delete_capabilities_v25()` must advertise version v25, ready=true, execution_enabled=true; `admin_preview_deletion_v25` must return safe=true, execution_ready=true, graph_complete=true, audit_ready=true, a server token at least 32 chars, an impact array with every row individually selected and acknowledged, and empty warnings. Otherwise the browser never exposes the destructive confirmation. Browser checks are defense in depth, not substitutes for server-side authorization.

## Isolated acceptance testing — mandatory before production enablement

- Use an independently created **test Supabase project** or local isolated PostgreSQL, not SafetyTraining production, SafetyManagerPro or DVR.
- Install schema and fixtures only into the test environment. Seed synthetic companies, learners, editions, enrollments, lessons, attendance, progress, test attempts, answers, requirements, history, organizations, and integration contexts.
- Confirm positive path with synthetic data and an authorized synthetic admin. Verify audit row and FK consistency after commit.
- Confirm negative paths: non-admin, another organization, revoked admin, missing selection, nested cascade not selected, stale preview, modified row between preview and execution, replayed token, concurrent deletion, insufficient audit write permissions, composite key mismatch, large dependent graph, protected auth-linked learner, and expired token.
- Assert transaction rollback on injected error, and that no unrelated row or Storage object changed. Verify legacy read/create/update flows continue to work.
- Only after this, obtain separate release approval for production. Keep production execution disabled by default and use a server-only feature gate.
- Do not confuse this isolated deletion test with restoration of the separate local backup. Restoration remains unverified unless the user chooses to test it.

## Blocking items

1. No authorized isolated test environment currently designated.
2. Privileged DB-function inspection was blocked by platform security controls on 2026-10-19; do not bypass that restriction through alternative channels.
3. The destructive transactional RPC is not installed and not tested.
4. The preview currently provides indicative visible counts and not a complete row-by-row graph or signed, expiring execution token.

This release gate intentionally remains **NO-GO**.
