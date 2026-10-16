# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-16

Questo file è la fonte rapida di ripartenza quando si cambia chat.

## Decisioni utente da NON perdere

### Regola permanente di hand-off
Dopo OGNI modifica sostanziale a SafetyTraining (DB, backend, frontend, contenuti, deploy, QA o governance) aggiornare nello stesso blocco anche questo file `docs/SAFETYTRAINING_HANDOFF.md`.
Non lasciare modifiche importanti documentate solo nella chat: il repository deve contenere sempre il punto reale di ripartenza.

### Percorsi congelati / fuori roadmap
NON sviluppare, modernizzare, finalizzare o pubblicare salvo richiesta esplicita dell'utente:
- CSP/CSE
- Ponteggi
- Lavori su funi, inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB:
- 10 corsi RSPP/ASPP esterni: `freeze_scope=external_rspp_aspp`
- 17 corsi specialistici: `freeze_scope=user_out_of_roadmap_specialist`

I congelati sono esclusi dalla finalizzazione e dal selettore per nuove edizioni.

### Politica versioning contenuti
- Nuovi contenuti revisionati prima come `draft`.
- Storico vecchie versioni preservato.
- Nessun relink distruttivo delle vecchie edizioni.
- Go-live eseguito a step controllati `v20_097`–`v20_100`.
- `mod_cantieri` resta UN SOLO corso catalogo con due `course_versions` role-specific. Non creare un 93° corso.

## Contenuti e go-live v20 — COMPLETATO

Perimetro finale attivo:
- 60 `course_versions`
- 59 corsi distinti
- 290 `learning_unit_versions`
- 60/60 composizioni complete
- 60/60 percorsi di verifica selezionati
- 36 versioni con Test Builder
- 37 versioni/corsi con gate pratico
- 0 candidati congelati

Famiglie authored completate nel perimetro attivo:
- Lavoratori generale/specifica/aggiornamenti
- Preposto e Dirigente + aggiornamenti
- Datore 16h + aggiornamento
- RLS + aggiornamenti
- Primo soccorso + aggiornamenti
- Antincendio livelli/aggiornamenti
- Attrezzature/aggiornamenti
- Emergenze/evacuazione
- Lavori in quota
- DL-RSPP Datore comune + Agricoltura + Pesca + Chimico/Petrolchimico + Costruzioni + aggiornamento
- Modulo Cantieri Datore 6h
- Modulo Cantieri Dirigente 6h

Sequenza go-live:
- `20261016192402_v20_097_publish_candidate_learning_units`: 290/290 LU pubblicate
- `20261016192912_v20_098_publish_candidate_course_versions_blocked`: 60/60 versioni pubblicate ma bloccate
- `20261016193110_v20_099_activate_candidate_tests_qa`: 36/36 test attivati in QA
- `20261016193922_v20_100_enable_candidate_course_versions_go_live`: 60/60 versioni `go_live_ready=true`

`v20_100` NON crea automaticamente edizioni o iscrizioni: abilita soltanto le versioni approvate alla selezione amministrativa.

## Test Builder / completamento

Banca authored:
- 1.450 domande
- 290 LU × 5 domande
- 660 test-question links
- 36 test attivi
- soglia 70%
- scoring/pass lato DB

Gate:
- tabella `enrollment_requirement_evidence`
- 37 requisiti pratici obbligatori
- 73 requirement rows complessive sulle 60 versioni
- il corsista non può autocertificare evidenze pratiche/esterne
- il Test Builder crea evidenze `platform` automaticamente tramite DB

## Amministrazione v21

### Frontend
Console unica `apps/training/admin.js`:
- Dashboard
- Organizzazioni
- Aziende
- Corsisti
- Corsi
- Edizioni
- Iscrizioni
- Attività

Bridge backend:
- `apps/training/admin-backend-v21.js`

Il bridge viene caricato subito dopo `admin.js` e intercetta in capture phase le scritture core prima delle vecchie scritture dirette presenti fisicamente in `admin.js`.

Operazioni core instradate via RPC:
- organizzazioni
- aziende
- corsisti
- corsi
- creazione/modifica edizioni
- apertura/chiusura edizioni
- iscrizione multipla
- revoca/riattivazione iscrizione
- attiva/disattiva organizzazione/azienda/corsista

Dashboard e audit:
- `admin_dashboard_summary()` riallinea KPI dashboard
- `admin_recent_actions()` alimenta la sezione audit nella tab Attività
- inviti account restano sull'Edge Function `invite-learner`

### Gate amministrativi v21
Il vecchio modulo `requirement-evidence-admin-v20.js` resta nel repository per storico/fallback ma NON è più caricato dalla nuova `index.html`.

Modulo attivo:
- `apps/training/requirement-evidence-admin-v21.js`

Scritture Gate:
- nessun `upsert/update` diretto dal nuovo modulo
- usa `admin_set_requirement_evidence()`
- il browser passa solo enrollment, tipo requisito, chiave, stato e nota
- il DB risolve gli ID interni del requisito e controlla che il requisito appartenga esattamente al corso/versione dell'iscrizione

Service worker:
- cache corrente `safety-training-v21-3`
- include `admin-backend-v21.js`
- include `requirement-evidence-admin-v21.js`
- non cachea più il vecchio modulo Gate v20

Nota: finché Vercel non deploya il nuovo frontend, la produzione può ancora servire il vecchio modulo Gate v20. Per compatibilità NON sono ancora stati revocati i privilegi tabella legacy agli staff; i nuovi trigger DB v21_007/v21_008 proteggono comunque le scritture dirette contestualmente. Revocare INSERT/UPDATE diretti sulla tabella evidenze solo dopo il deploy del nuovo frontend e QA browser.

## Backend amministrativo v21 — SERVICE LAYER ATTIVO

Migration Supabase applicate e salvate nel repository con timestamp esatto:
- `20261016212444_v21_001_admin_backend_service_layer`
- `20261016212541_v21_002_admin_backend_core_crud`
- `20261016212933_v21_003_admin_backend_guardrails`
- `20261016213037_v21_004_fix_enrollment_rls_recursion`
- `20261016213106_v21_005_break_edition_enrollment_rls_cycle`
- `20261016213147_v21_006_admin_audit_actor_index`
- `20261016214908_v21_007_admin_requirement_evidence_service`
- `20261016215039_v21_008_harden_platform_requirement_evidence_status`

### Audit amministrativo
Tabella privata:
- `private.admin_audit_log`

Accesso diretto negato a `anon` e `authenticated`; lettura via RPC autorizzata.
Registra actor, azione, entity type/id, organizzazione, before/after state, context e timestamp.

### RPC core platform-admin
Protette da controllo esplicito platform-admin:
- `admin_save_organization()`
- `admin_save_company()`
- `admin_save_learner()`
- `admin_save_course()`
- `admin_set_active()`
- `admin_create_edition()`
- `admin_update_edition()`
- `admin_bulk_enroll()`
- `admin_set_enrollment_revoked()`
- `admin_recent_actions()`
- `admin_dashboard_summary()`

### RPC evidenze staff
- `admin_set_requirement_evidence()`

Autorizzazione:
- richiede utente autenticato
- usa `private.can_access_company(org, company)` per rispettare lo staff autorizzato del tenant/azienda
- NON amplia automaticamente tutto a qualunque authenticated

Regole:
- accetta solo `practical|verification`
- accetta manualmente solo `completed|failed|revoked`
- requisito deve essere `required` e legato al corso/versione reale dell'iscrizione
- practical sempre evidenza esterna
- verification `platform` non modificabile manualmente
- verification con `selected_mode=test` + `platform_or_external` è trattata come gestita dal Test Builder e non può essere completata manualmente
- complete/fail/revoke producono audit amministrativo
- i trigger di ricalcolo aggiornano automaticamente progress/stato/completion_gate dell'iscrizione

### Guardrail evidenze
Trigger `enrollment_requirement_evidence_context_guard` su INSERT/UPDATE:
- binding enrollment/kind/key immutabile
- ID requisito ricalcolati dal DB, non fidati dal browser
- requisito pratico deve appartenere al corso dell'iscrizione
- requisito verifica deve appartenere alla `course_version` dell'iscrizione
- evidenza platform richiede un `test_attempt` completato e collegato allo stesso enrollment/versione/requisito
- `completed` platform richiede `passed=true`
- `failed` platform richiede `passed=false`
- evidenza platform può avere solo `completed|failed`, non `revoked`
- il Test Builder resta l'unica sorgente valida per gli esiti test platform

### Guardrail core già attivi
DB impedisce anche in caso di tentativo browser diretto:
- incoerenze tenant azienda/corsista/edizione
- spostamenti tenant non dedicati
- date edizione non valide
- riapertura di edizione archiviata
- edizioni su versioni non go-live/frozen/escluse
- iscrizioni su edizioni non aperte o corsisti incompatibili
- modifica binding enrollment
- disattivazioni incompatibili con edizioni aperte
- nuovo corso + v1 draft atomici

Trigger core installati su:
- `companies`
- `learners`
- `course_editions`
- `enrollments`

## Correzione RLS legacy
Il QA v21 ha scoperto e corretto ricorsione RLS tra `enrollments` e `course_editions`.

Correzioni:
- `private.can_use_enrollment()` con lookup privilegiata RLS-safe
- `private.can_manage_edition_id()`
- `private.current_user_has_edition_enrollment()`
- policy enrollment/edition riscritte senza ciclo cross-table

NON ripristinare le vecchie policy recursive.

## QA v21

### Core backend
QA E2E in transazione con `ROLLBACK` superato:
- azienda
- corsista
- edizione go-live
- bulk enrollment
- lettura enrollment via RLS
- revoke/restore
- dashboard summary
- audit
- 0 residui

### Bridge frontend
- `admin-backend-v21.js` passa sintassi
- `index.html` carica il bridge dopo `admin.js`
- dashboard/recent actions verificati via RPC come platform admin
- snapshot rilevato durante QA: 2 aziende attive, 3 corsisti attivi, 92 corsi attivi, 0 edizioni, 0 iscrizioni

### Gate v21_007/v21_008
QA con `ROLLBACK`:
1. creata iscrizione QA su corso con requisito pratico
2. `admin_set_requirement_evidence(... completed ...)` riuscita
3. evidenza salvata `external`
4. `recorded_by` corrisponde all'admin QA
5. `practical_completed` passato da 0 a 1
6. audit `requirement_evidence.complete` presente via `admin_recent_actions()`
7. revoke riuscito
8. `practical_completed` tornato a 0
9. audit `requirement_evidence.revoke` presente
10. tentativo manuale su verification `selected_mode=test` / platform-managed respinto con `platform_managed_verification_cannot_be_completed_manually`
11. zero evidenze create dal tentativo vietato
12. residui QA finali: 0 learners, 0 editions, 0 enrollments, 0 evidence

Durante il QA è stato verificato anche che `authenticated` NON può leggere direttamente `private.admin_audit_log`.

## Advisor Supabase

Security dopo v21_008:
- 19 warning `authenticated_security_definer_function_executable`: includono le RPC v21 intenzionalmente esposte a `authenticated` ma protette da autorizzazione interna; non convertirle automaticamente senza ridisegnare il service layer
- leaked password protection ancora disabilitato: warning noto

Performance:
- warning FK audit actor risolto in v21_006
- rimane una sola FK non indicizzata legacy: `training_blueprint_rules`
- `auth_rls_initplan`, multiple permissive policies e unused indexes restano warning noti; non auto-fixare senza blocco dedicato

## CI / deploy

Ultimo commit funzionale verificato prima dell'aggiornamento handoff:
- `d06f1132c1a0225b5943743d26ec66a651f9aee8`

GitHub Actions:
- `SafetyTraining checks` run #231: `SUCCESS`

Vercel:
- status ancora `FAILURE` esclusivamente per `build-rate-limit` / richiesta upgrade Pro
- NON è un errore di compilazione SafetyTraining
- Supabase v21_001–v21_008 è già live
- frontend v21-3 è nel repository ma non va considerato verificato in produzione finché Vercel non riesce a deployarlo

## Inviti / portale corsista

Inviti:
- `learner_account_invitations`
- Edge Function `invite-learner`
- onboarding `claim_learner_account()`

Portale corsista:
- Home → `I miei corsi`
- solo assegnazioni
- catalogo completo e strumenti interni nascosti
- corsi revocati rimossi dalla vista

## Prossimo lavoro operativo

Backend amministrativo core e Gate ora passano dal service layer.

Priorità successiva:
1. audit degli altri moduli amministrativi caricati (`course-catalog.js`, `blueprint-admin.js`, `course-readiness-admin.js`, `integration-import.js`) e separazione tra operazioni editoriali e operative
2. completare progressivamente il read/service layer amministrativo dove serve, senza duplicare RLS
3. aggiungere detail amministrativi per azienda, corsista ed edizione
4. progettare ruoli granulari `organization_admin` / `training_manager` per le funzioni che oggi sono platform-admin only
5. appena Vercel torna disponibile: deploy + QA browser reale del bridge, Gate v21 e PWA cache v21-3
6. solo dopo quel QA valutare revoca delle scritture dirette legacy su `enrollment_requirement_evidence`
7. consolidare i bridge dentro `admin.js` solo dopo stabilizzazione
8. aggiornare SEMPRE questo handoff dopo ogni blocco

Flusso finale da preservare:
1. completare email corsisti
2. creare edizione su versione approvata
3. iscrivere corsisti singolo/bulk
4. inviare inviti
5. verificare frequenza/progresso, test e gate pratici
6. completamento/certificazione e integrazione SafetyManager quando tutti i requisiti sono soddisfatti

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- Produzione: `safety-training-safety-manager.vercel.app`
