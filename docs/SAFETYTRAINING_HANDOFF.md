# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-17

Questo file è la fonte rapida di ripartenza quando si cambia chat. Per il dettaglio operativo dell’ultimo blocco usare anche `docs/SAFETYTRAINING_HANDOFF_LATEST.md`; i due file devono essere aggiornati insieme dopo ogni modifica sostanziale.

## Regola permanente di hand-off

Dopo OGNI modifica sostanziale a SafetyTraining (DB, backend, frontend, contenuti, deploy, QA o governance) aggiornare nello stesso blocco anche questo file e `docs/SAFETYTRAINING_HANDOFF_LATEST.md`. Non lasciare lo stato importante soltanto nella chat.

## Percorsi congelati / fuori roadmap

NON sviluppare, modernizzare, finalizzare o pubblicare salvo richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi, inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB:
- 10 corsi RSPP/ASPP esterni: `freeze_scope=external_rspp_aspp`
- 17 corsi specialistici: `freeze_scope=user_out_of_roadmap_specialist`

`mod_cantieri` resta UN SOLO corso catalogo con due `course_versions` role-specific. Non creare un 93° corso.

## Go-live didattico v20 — COMPLETATO

Perimetro:
- 60 `course_versions`
- 59 corsi distinti
- 290 `learning_unit_versions`
- 60/60 composizioni complete
- 60/60 verification path
- 36 test attivi
- 1.450 domande authored
- 660 test-question links
- soglia 70%
- 37 percorsi con gate pratico
- 73 requirement rows
- v20_097–v20_100 completati
- nessuna auto-creazione di edizioni/iscrizioni

## Amministrazione v21 — stato corrente

Supabase live fino a:
- `20261017042729_v21_015_restore_platform_evidence_status_guard`
- `20261017042912_v21_016_admin_membership_service`

Le migration precedenti v21_001–v21_014 restano attive. Timestamp corretti di v21_012–014:
- `20261016221243_v21_012_scoped_admin_capabilities`
- `20261016221548_v21_013_scoped_invitation_visibility`
- `20261016221704_v21_014_allow_rls_training_scope_helper`

### Correzione v21_015

Il 17/10 è stata rilevata una riapplicazione accidentale di `v21_007` (`20261017042346`) che aveva sovrascritto l’hardening v21_008 del guard evidence. `v21_015` ha ripristinato:
- platform evidence solo `completed|failed`
- binding test/versione/requisito
- coerenza passed/fail col test attempt
- impossibilità di revoca manuale dell’evidence platform

Verifica live: `platform_evidence_status_invalid` presente nel guard.

## Ruoli

### platform_admin
Globale: organizzazioni, aziende, corsisti, corsi/editorial, edizioni, enrollment, gate, SafetyManager, audit, membership amministrative.

### organization_admin
Scope sulle proprie organizzazioni:
- aziende
- corsisti
- edizioni/iscrizioni
- gate
- detail
- audit/inviti scoped

Nessuna gestione globale corsi/organizzazioni/SafetyManager/membership.

### training_manager
Scope sulle proprie organizzazioni:
- lettura aziende
- corsisti
- edizioni/iscrizioni
- gate
- detail
- audit/inviti scoped

Non modifica aziende e non usa funzioni globali.

### company_admin
Presente nello schema ma NON abilitato. Non abilitarlo senza progettazione esplicita company-only.

## Membership administration v21_016

Nuove RPC platform-only:
- `admin_memberships_overview(uuid default null)`
- `admin_set_organization_membership(uuid,text,text,boolean)`

Regole:
- ruoli ammessi solo `organization_admin|training_manager`
- `company_admin` respinto
- account target deve esistere in `auth.users`
- risoluzione tramite email case-insensitive
- assegnazione/riattivazione solo su organizzazione attiva
- membership org-level con `company_id IS NULL`
- audit assign/reactivate/revoke
- non modifica `platform_admins`

Hardening:
- revocato DML browser su `organization_memberships`
- rimossa policy `memberships_manage`
- mutation solo via RPC platform-only

QA rollback v21_016 VERDE:
- assign organization_admin
- assign training_manager
- overview 2/2
- revoke
- company_admin respinto
- org inattiva respinta
- non-platform bloccato
- 0 residui QA
- 0 DML grants authenticated

Stato reale al momento del QA:
- 1 Auth user
- 1 platform admin
- 0 utenti Auth non-platform
- 0 membership reali organization_admin/training_manager

## Capability

`admin_capabilities()` restituisce ruoli/scopes e capability granulari. Da v21_016 include:
- `manage_admin_memberships=true` solo per platform admin

## Frontend amministrativo / PWA

Moduli principali:
- `apps/training/admin.js`
- `apps/training/admin-backend-v21.js`
- `apps/training/admin-details-v21.js`
- `apps/training/requirement-evidence-admin-v21.js`
- `apps/training/admin-capabilities-v21.js`
- `apps/training/admin-memberships-v21.js`
- `apps/training/course-catalog-governance-v21.js`

Correzione del 17/10:
- `admin-capabilities-v21.js` esisteva nel repo ma non era caricato da `index.html`
- `sw.js` era ancora `safety-training-v21-5`, non v21-6 come indicava il vecchio promemoria
- ora `index.html` carica capability + membership
- cache corrente: `safety-training-v21-7`
- capability e membership sono nella precache

Nuova UI platform-only:
- nav `Ruoli amministrativi`
- assegnazione via email Auth + organizzazione + ruolo
- elenco attivi/revocati
- revoca/riattivazione
- nessuna creazione Auth e nessuna modifica platform admin

## Componenti già completati

### Backend core
RPC e guardrail per organizzazioni, aziende, corsisti, corsi, edizioni, iscrizioni, dashboard e audit.

### Detail
RPC/UI server-side per azienda, corsista ed edizione con progress, account/inviti, test, evidenze e audit.

### Gate evidence
- `admin_set_requirement_evidence()`
- practical esterno
- Test Builder platform non modificabile manualmente
- completion gate automatico
- v21_015 ripristina hardening dello status platform

### SafetyManager
- staging draft compatibile
- `course_editions.metadata` presente
- mapping solo published/finalized/go_live_ready
- frozen/reference/placeholder esclusi
- 0 ready/hybrid invalidi

### Inviti
Edge `invite-learner` v2 live:
- platform admin globale
- org admin/training manager stessa org
- cross-tenant 403
- learner/org attivi
- RLS inviti scoped

## RLS legacy

Risolta la ricorsione `enrollments` ↔ `course_editions` con helper RLS-safe. NON ripristinare vecchie policy recursive.

## Advisor noti

Non auto-fixare senza blocco dedicato:
- SECURITY DEFINER authenticated per RPC con auth server-side
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy `training_blueprint_rules` non indicizzata

## Produzione / CI — VERIFICATO

Supabase live fino a v21_016; Edge invite v2 live.

GitHub:
- HEAD verificato prima dell’ultimo aggiornamento handoff: `c2e647dcdb0cd909ff3257d177ad7b2c6429a052`
- `SafetyTraining checks` run #257 sullo stesso HEAD: `SUCCESS`

Vercel:
- il precedente `build-rate-limit / upgradeToPro` è rientrato
- deployment production del commit `c2e647...`: `dpl_3ydRm3ZeBoqyPYAxnnu3DSgNZmyW`, stato `READY`
- alias `safety-training-safety-manager.vercel.app` confermato sul deployment
- home produzione risponde `200 OK`
- `index.html` live contiene `admin-capabilities-v21.js` e `admin-memberships-v21.js`
- `sw.js` live è `safety-training-v21-7` e precache entrambi i moduli

Questa è una smoke verification HTTP/static asset. Non è ancora un QA interattivo logged-in completo con un account scoped reale, perché al momento del QA non esistevano utenti Auth non-platform né membership scoped reali.

## Prossimi passi esatti

1. quando serve operativamente, creare/avere un account Auth non-platform e assegnargli `organization_admin` o `training_manager` dalla nuova UI
2. fare QA interattivo logged-in di console scoped, inviti, Detail, Gate e visibilità membership
3. non abilitare `company_admin`
4. dopo stabilizzazione valutare consolidamento dei bridge legacy in `admin.js`
5. aggiornare SEMPRE entrambi gli handoff

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`
