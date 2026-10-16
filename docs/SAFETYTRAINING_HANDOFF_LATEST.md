# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-16
Stato: backend amministrazione v21 fino a `v21_014`, frontend capability fino a cache `safety-training-v21-6`.

> Questo file integra/supersede operativamente `docs/SAFETYTRAINING_HANDOFF.md` per le modifiche successive a v21_011. Dopo ogni blocco sostanziale aggiornare sempre il promemoria di progetto; non lasciare lo stato soltanto nella chat.

## Vincoli permanenti

NON sviluppare/modernizzare/finalizzare/pubblicare senza richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB già attivi:
- 10 corsi RSPP/ASPP esterni: `freeze_scope=external_rspp_aspp`
- 17 corsi specialistici: `freeze_scope=user_out_of_roadmap_specialist`

`mod_cantieri` resta UN SOLO corso catalogo con due course_versions role-specific. Non creare un 93° corso.

## Go-live didattico v20 già completato

- 60 course_versions go-live
- 59 corsi distinti
- 290 learning_unit_versions
- 36 test attivi
- 660 test-question links
- 37 percorsi con gate pratico
- v20_097–v20_100 completati
- nessuna auto-creazione di edizioni/iscrizioni al go-live

## Backend amministrativo v21 — migration live

Migration Supabase applicate e salvate nel repository:
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
- `20261016222858_v21_012_scoped_admin_capabilities`
- `20261016223712_v21_013_scoped_invitation_visibility`
- `20261016224026_v21_014_allow_rls_training_scope_helper`

Supabase project: `ejkwvatmzdqqjozpxntk`.

## Audit / service layer

Tabella privata:
- `private.admin_audit_log`

Accesso diretto negato a browser authenticated; lettura tramite RPC autorizzata.

RPC amministrative principali:
- `admin_capabilities()`
- `admin_save_organization()`
- `admin_save_company()`
- `admin_save_learner()`
- `admin_save_course()`
- `admin_set_active()`
- `admin_create_edition()`
- `admin_update_edition()`
- `admin_bulk_enroll()`
- `admin_set_enrollment_revoked()`
- `admin_dashboard_summary()`
- `admin_recent_actions()`
- `admin_company_detail()`
- `admin_learner_detail()`
- `admin_edition_detail()`
- `admin_set_requirement_evidence()`

## Ruoli amministrativi v21_012

### platform_admin
Pieno accesso amministrativo e globale:
- organizzazioni
- aziende
- corsisti
- corsi/editorial
- edizioni/iscrizioni/gate
- SafetyManager integration
- audit globale

### organization_admin
Scope solo sulle organizzazioni di membership:
- dashboard scoped
- gestione aziende della propria organizzazione
- gestione corsisti
- creazione/modifica edizioni
- enrollment/revoke/restore
- gate evidenze
- detail azienda/corsista/edizione
- audit scoped
- inviti account scoped

NON può:
- creare/modificare organizzazioni globali
- creare/modificare corsi globali/editorial
- usare integrazione SafetyManager globale
- operare su altre organizzazioni

### training_manager
Scope solo sulle organizzazioni di membership:
- dashboard scoped
- lettura aziende
- gestione corsisti
- creazione/modifica edizioni
- enrollment/revoke/restore
- gate evidenze
- detail azienda/corsista/edizione
- audit scoped
- inviti account scoped

NON può:
- creare/modificare aziende
- gestire organizzazioni globali
- gestire corsi globali/editorial
- SafetyManager globale
- operare cross-tenant

### company_admin
Ruolo esistente nello schema ma NON abilitato alla console amministrativa v21 in questo blocco. Lasciarlo fuori finché non viene progettato esplicitamente lo scope company-only.

## Capability RPC

`admin_capabilities()` restituisce:
- `admin_console`
- `platform_admin`
- ruoli scoped
- capability granulari
- scopes organizzazione

Capability correnti:
- view_dashboard
- manage_organizations
- manage_companies
- manage_learners
- manage_courses
- manage_editions
- manage_enrollments
- manage_evidence
- view_activity
- manage_safetymanager
- view_editorial_tools

Helper privati:
- `private.can_manage_training_org(uuid)`
- `private.can_manage_company_registry(uuid)`

`private.can_manage_training_org()` ha EXECUTE per authenticated/service_role perché viene invocata da una policy RLS; il private schema non è esposto come RPC pubblica.

## QA ruoli scoped

Non esistono attualmente membership reali organization_admin/training_manager nel progetto.

QA effettuato senza creare utenti permanenti:
- dentro transazione è stato temporaneamente rimosso il flag platform dell'admin esistente
- inserita membership QA
- sessione simulata come authenticated
- tutto ripristinato con ROLLBACK

organization_admin QA — VERDE:
- capability corrette
- creazione azienda propria consentita
- corsista proprio consentito
- edizione + bulk enrollment propri consentiti
- detail proprio consentito
- azienda cross-org negata
- corso globale negato
- organizzazione globale negata
- dashboard scoped corretta

training_manager QA — VERDE:
- manage_companies=false
- creazione azienda negata
- corsista consentito
- edizione + enrollment consentiti
- detail learner/edition consentiti
- dashboard scoped corretta

Residui QA finali: 0 membership, 0 aziende/corsisti/edizioni/inviti QA.

## Inviti account v21_013/v21_014

Edge Function `invite-learner` aggiornata e DEPLOYATA su Supabase:
- versione 2
- `verify_jwt=true`
- service role soltanto server-side

Autorizzazione:
- platform_admin globale
- oppure organization_admin/training_manager sulla STESSA organization del corsista
- cross-tenant => 403
- learner e organization devono essere attivi

Registro `learner_account_invitations`:
- lettura scoped via RLS per training admin autorizzato
- browser non riceve accesso diretto in scrittura

QA RLS inviti — VERDE:
- manager di org1 vede solo invito org1
- invito org2 invisibile
- detail corsista mostra invite status corretto
- rollback completo

Nota: non è stato creato un auth user scoped permanente, quindi non è stato inviato un vero invito email in QA; logica di autorizzazione DB/RLS è stata verificata separatamente e Edge Function v2 è attiva.

## Frontend amministrativo v21

Moduli attivi:
- `apps/training/admin.js`
- `apps/training/admin-capabilities-v21.js`
- `apps/training/admin-backend-v21.js`
- `apps/training/admin-details-v21.js`
- `apps/training/requirement-evidence-admin-v21.js`
- `apps/training/course-catalog-governance-v21.js`

`admin-capabilities-v21.js`:
- chiama `admin_capabilities()`
- abilita console anche per organization_admin/training_manager
- nasconde funzioni non consentite
- training_manager vede aziende ma senza mutation controls
- Corsi/Organizzazioni/SafetyManager/editorial restano nascosti ai ruoli scoped quando non autorizzati
- usa compatibility shim TEMPORANEO solo durante `SAFETY_ADMIN.refreshRole()` per superare il vecchio check UI platform-only
- lo shim viene immediatamente rimosso e NON altera l'autorizzazione reale server-side

Tutte le autorizzazioni reali restano nelle RPC/RLS DB.

PWA cache corrente:
- `safety-training-v21-6`

## Detail / Gate / SafetyManager già completati

Detail server-side:
- Azienda
- Corsista
- Edizione

Gate:
- `admin_set_requirement_evidence()`
- Test Builder platform non modificabile manualmente
- guardrail context su evidence

SafetyManager:
- staging draft compatibile
- metadata edizioni ripristinati
- mapping solo a versioni finalizzate/go_live_ready
- frozen/reference/placeholder esclusi
- catalogo normalizzato: 0 ready/hybrid senza mapping go-live valido

## RLS legacy corretto

Risolta ricorsione `enrollments` ↔ `course_editions`.
NON ripristinare vecchie policy recursive.

## Advisor noti

Non auto-fixare salvo blocco dedicato:
- warning SECURITY DEFINER authenticated: attesi per RPC esposte ma con authorization server-side
- leaked password protection disabilitato
- auth_rls_initplan
- multiple permissive policies
- unused indexes
- FK legacy non indicizzata `training_blueprint_rules`

## Produzione / deploy

Supabase v21_001–v21_014 è live.
Edge `invite-learner` v2 è live.

Vercel negli ultimi controlli rifiutava i nuovi deploy per `build-rate-limit` / richiesta upgrade Pro; non era un errore di compilazione SafetyTraining.
Finché il build-rate-limit non rientra, considerare frontend v21-6 presente nel repository ma NON ancora QA browser in produzione.

## Prossimo lavoro consigliato

1. creare gestione controllata delle membership amministrative (assegna/revoca organization_admin e training_manager), inizialmente platform-admin only
2. aggiungere overview membership per organizzazione
3. non abilitare company_admin finché non viene progettato scope company-only
4. appena Vercel torna disponibile: deploy + QA browser reale di capability UI, Detail, Gate, Catalog governance, inviti e PWA v21-6
5. solo dopo QA produzione valutare rimozione definitiva dei fallback legacy e consolidamento dei bridge dentro `admin.js`
6. aggiornare SEMPRE il promemoria dopo ogni blocco sostanziale

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`
