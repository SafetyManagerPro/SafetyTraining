# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend amministrazione live fino a `v21_016`; frontend admin/PWA repository cache `safety-training-v21-7`.

> Fonte operativa più recente. Dopo ogni modifica sostanziale aggiornare nello stesso blocco anche il promemoria di progetto: lo stato non deve restare soltanto in chat.

## Vincoli permanenti

NON sviluppare/modernizzare/finalizzare/pubblicare senza richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB:
- 10 corsi RSPP/ASPP esterni: `freeze_scope=external_rspp_aspp`
- 17 corsi specialistici: `freeze_scope=user_out_of_roadmap_specialist`

`mod_cantieri` resta UN SOLO corso catalogo con due `course_versions` role-specific. Non creare un 93° corso.

## Go-live didattico v20 — completato

- 60 `course_versions` go-live
- 59 corsi distinti
- 290 `learning_unit_versions`
- 60/60 composizioni complete
- 60/60 verification path selezionati
- 36 test attivi
- 1.450 domande authored
- 660 test-question links
- soglia 70%
- 37 percorsi con gate pratico
- 73 requirement rows complessive
- v20_097–v20_100 completati
- nessuna auto-creazione di edizioni/iscrizioni al go-live

## Backend amministrativo v21 — stato live

Migration DB correnti rilevanti:
- `20261016212444_v21_001_admin_backend_service_layer`
- `20261016212541_v21_002_admin_backend_core_crud`
- `20261016212933_v21_003_admin_backend_guardrails`
- `20261016213037_v21_004_fix_enrollment_rls_recursion`
- `20261016213106_v21_005_break_edition_enrollment_rls_cycle`
- `20261016213147_v21_006_admin_audit_actor_index`
- `20261016214908_v21_007_admin_requirement_evidence_service`
- `20261016215039_v21_008_harden_platform_requirement_evidence_status`
- `20261016215923_v21_009_restore_safetymanager_staging_compatibility`
- `20261016220140_v21_010_harden_safetymanager_course_configuration`
- `20261016220621_v21_011_admin_detail_read_service`
- `20261016221243_v21_012_scoped_admin_capabilities`
- `20261016221548_v21_013_scoped_invitation_visibility`
- `20261016221704_v21_014_allow_rls_training_scope_helper`
- `20261017042729_v21_015_restore_platform_evidence_status_guard`
- `20261017042912_v21_016_admin_membership_service`

### Incidente migration duplicata del 17/10

È stata rilevata una seconda applicazione accidentale di `v21_007_admin_requirement_evidence_service` con versione DB `20261017042346`. Aveva sovrascritto il guard introdotto da v21_008, rimuovendo la restrizione `platform` a soli stati `completed|failed`.

Correzione applicata immediatamente con `v21_015`:
- ripristinato `platform_evidence_status_invalid`
- piattaforma test solo `completed|failed`
- binding test/versione/requisito preservato
- pass/fail deve combaciare con il test attempt
- nessuna revoca manuale di evidence platform

Verifica live dopo la correzione: guard ripristinato = `true`.

## Ruoli e capability

### platform_admin
Accesso globale a organizzazioni, aziende, corsisti, corsi/editorial, edizioni, iscrizioni, gate, SafetyManager, audit e gestione membership amministrative.

### organization_admin
Solo sulle organizzazioni di membership:
- dashboard/audit scoped
- gestione aziende
- gestione corsisti
- edizioni/iscrizioni
- evidence gate
- detail amministrativi
- inviti account scoped

Non può gestire organizzazioni globali, corsi/editorial globali, SafetyManager globale o membership amministrative.

### training_manager
Solo sulle organizzazioni di membership:
- dashboard/audit scoped
- lettura aziende
- gestione corsisti
- edizioni/iscrizioni
- evidence gate
- detail amministrativi
- inviti account scoped

Non può modificare aziende, organizzazioni/corsi globali, SafetyManager o membership amministrative.

### company_admin
Esiste nello schema ma resta deliberatamente NON abilitato. Non abilitarlo senza progettazione esplicita company-only.

`admin_capabilities()` include ora anche:
- `manage_admin_memberships`: `true` solo per platform admin

## v21_016 — Membership administration

Nuove RPC:
- `admin_memberships_overview(uuid default null)`
- `admin_set_organization_membership(uuid,text,text,boolean)`

Regole server-side:
- solo `platform_admin`
- ruoli ammessi esclusivamente `organization_admin|training_manager`
- `company_admin` e qualunque altro ruolo respinti
- target risolto da email esatta/case-insensitive su `auth.users`
- account Auth deve esistere
- assegnazione/riattivazione solo su organizzazione attiva
- revoca possibile su membership esistente
- membership amministrative org-level sempre `company_id IS NULL`
- audit `membership.assign`, `membership.reactivate`, `membership.revoke`
- nessuna modifica a `platform_admins`

Hardening importante:
- revocati `INSERT/UPDATE/DELETE/TRUNCATE` browser su `organization_memberships`
- rimossa la vecchia policy `memberships_manage`, che consentiva a un `organization_admin` CRUD diretto della tabella membership
- le mutation amministrative passano esclusivamente dalla RPC platform-only
- SELECT scoped preesistente resta separato

QA v21_016 in transazione + rollback — VERDE:
- assign `organization_admin`
- assign `training_manager`
- overview vede entrambi
- revoke `organization_admin`
- `company_admin` respinto con `unsupported_admin_membership_role`
- organizzazione inattiva respinta con `organization_inactive`
- caller non-platform respinto su overview e mutation con `platform_admin_required`
- residui finali: 0 org QA, 0 membership admin, 0 audit QA
- DML grants authenticated sulla tabella membership: 0
- policy `memberships_manage`: assente

Stato Auth al momento del QA:
- 1 utente Auth totale
- 1 platform admin
- 0 utenti Auth non-platform
- 0 membership reali `organization_admin|training_manager`

Quindi la nuova schermata partirà senza assegnazioni finché non esisteranno account Auth aggiuntivi.

## Frontend amministrativo

Moduli attivi/in repository:
- `apps/training/admin.js`
- `apps/training/admin-backend-v21.js`
- `apps/training/admin-details-v21.js`
- `apps/training/requirement-evidence-admin-v21.js`
- `apps/training/admin-capabilities-v21.js` v21.2
- `apps/training/admin-memberships-v21.js` v21.2
- `apps/training/course-catalog-governance-v21.js`

Correzione 17/10:
- `admin-capabilities-v21.js` esisteva ma NON era realmente caricato da `index.html`
- `sw.js` era ancora `safety-training-v21-5` nonostante il vecchio handoff dicesse v21-6
- ora `index.html` carica capability e membership module
- `sw.js` cache corrente repository: `safety-training-v21-7`
- entrambi i nuovi asset sono nella precache PWA

### UI Ruoli amministrativi

Nuova voce nav platform-only: `Ruoli amministrativi`.
Permette:
- assegnazione per email account Auth
- selezione organizzazione attiva
- scelta solo `Admin organizzazione` / `Training manager`
- elenco assegnazioni incluse revocate
- revoca e riattivazione
- messaggio chiaro che non crea utenti Auth e non modifica platform admin

La UI chiama soltanto le RPC v21_016; nessun CRUD diretto della tabella membership.

## Altri componenti v21 già completati

### Detail
RPC/server UI per Azienda, Corsista, Edizione con progress, account/inviti, test, gate ed audit.

### Gate evidence
- `admin_set_requirement_evidence()`
- Test Builder platform non modificabile manualmente
- context guard DB
- v21_015 ripristina l’hardening perso dalla migration duplicata

### SafetyManager
- staging draft compatibile
- `course_editions.metadata` presente
- mapping solo a versioni finalizzate/published/go_live_ready
- frozen/reference/placeholder esclusi
- catalogo normalizzato: 0 `ready|hybrid` con mapping go-live invalido

### Inviti
Edge Function `invite-learner` versione 2 live:
- platform admin globale oppure org admin/training manager della stessa org
- cross-tenant 403
- learner/org devono essere attivi
- RLS inviti scoped

## RLS legacy

Risolta ricorsione `enrollments` ↔ `course_editions` con helper RLS-safe. NON ripristinare le vecchie policy recursive.

## Advisor noti

Non auto-fixare senza blocco dedicato:
- warning SECURITY DEFINER authenticated per RPC con auth server-side
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy non indicizzata `training_blueprint_rules`

## Produzione / deploy

Supabase è live fino a `v21_016`.
Edge `invite-learner` v2 è live.

Vercel: negli ultimi controlli noti i deploy erano bloccati da `build-rate-limit / upgradeToPro`, NON da errore di compilazione SafetyTraining. Verificare nuovamente prima di dichiarare frontend v21-7 presente in produzione.

## Prossimi passi

1. verificare GitHub Actions sul HEAD contenente v21_015/v21_016 + UI v21-7
2. verificare se il rate limit Vercel è rientrato; se sì deploy + QA browser reale
3. creare account Auth scoped reale solo quando serve operativamente, poi assegnare membership dalla nuova schermata
4. dopo stabilizzazione produzione valutare consolidamento dei bridge legacy dentro `admin.js`
5. NON abilitare `company_admin` senza blocco di progettazione dedicato
6. aggiornare SEMPRE entrambi gli handoff dopo modifiche sostanziali

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`
