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

I congelati restano esclusi da finalizzazione, modernizzazione e selettori di nuove erogazioni.

### Politica versioning contenuti
- Nuovi contenuti revisionati prima come `draft`.
- Storico vecchie versioni preservato.
- Nessun relink distruttivo delle vecchie edizioni.
- Go-live eseguito a step controllati `v20_097`–`v20_100`.
- `mod_cantieri` resta UN SOLO corso catalogo con due `course_versions` role-specific. Non creare un 93° corso.

## Contenuti / go-live v20 — COMPLETATO

Perimetro finale:
- 60 `course_versions`
- 59 corsi distinti
- 290 `learning_unit_versions`
- 60/60 composizioni complete
- 60/60 percorsi di verifica selezionati
- 36 versioni con Test Builder
- 37 versioni/corsi con gate pratico
- 0 candidati congelati

Famiglie authored attive completate:
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

Go-live:
- `20261016192402_v20_097_publish_candidate_learning_units`: 290/290 LU pubblicate
- `20261016192912_v20_098_publish_candidate_course_versions_blocked`: 60/60 versioni pubblicate ma inizialmente bloccate
- `20261016193110_v20_099_activate_candidate_tests_qa`: 36/36 test attivati in QA
- `20261016193922_v20_100_enable_candidate_course_versions_go_live`: 60/60 versioni `go_live_ready=true`

`v20_100` NON crea automaticamente edizioni o iscrizioni: rende solo selezionabili le versioni approvate.

## Test Builder / completamento

- 1.450 domande authored
- 290 LU × 5 domande
- 36 test attivi
- 660 test-question links
- soglia 70%
- scoring/pass lato DB
- evidenze test `platform` generate automaticamente dal DB

Gate:
- tabella `enrollment_requirement_evidence`
- 37 requisiti pratici obbligatori
- 73 requirement rows complessive
- il corsista non può autocertificare evidenze pratiche/esterne

## Amministrazione v21 — stato corrente

### Console e bridge backend
Console unica: `apps/training/admin.js`.
Tab:
- Dashboard
- Organizzazioni
- Aziende
- Corsisti
- Corsi
- Edizioni
- Iscrizioni
- Attività

Bridge RPC:
- `apps/training/admin-backend-v21.js`

Il bridge intercetta in capture phase le principali scritture legacy di `admin.js` e le instrada al service layer DB.

Scritture core via RPC:
- organizzazioni
- aziende
- corsisti
- corsi
- creazione/modifica/apertura/chiusura edizioni
- iscrizione multipla
- revoca/riattivazione iscrizione
- attiva/disattiva organizzazione/azienda/corsista

Dashboard/audit:
- `admin_dashboard_summary()`
- `admin_recent_actions()`

Inviti account:
- Edge Function `invite-learner`

### Detail amministrativi server-side
Modulo UI:
- `apps/training/admin-details-v21.js`

RPC:
- `admin_company_detail()`
- `admin_learner_detail()`
- `admin_edition_detail()`

La console aggiunge pulsante `Dettagli` alle righe Azienda/Corsista/Edizione.

Scheda Azienda include:
- anagrafica / organizzazione
- corsisti totali/attivi/account
- edizioni aperte/totali
- iscrizioni/in corso/completate
- lista corsisti con invito/account
- lista edizioni
- audit amministrativo recente dell'azienda

Scheda Corsista include:
- anagrafica / azienda / organizzazione
- stato account e invito
- tutte le iscrizioni
- corso/versione/edizione
- progress/tempo/score
- completion gate
- tentativi test
- evidenze requisiti
- audit amministrativo recente del corsista

Scheda Edizione include:
- corso/versione e `go_live_ready`
- azienda/organizzazione
- stato/modalità/disponibilità
- iscritti/account/da iniziare/in corso/completati/revocati
- numero gate pratici/verifiche
- corsisti con stato/progresso/score/evidenze
- audit edizione/enrollment recente

Le tre RPC detail sono platform-admin only lato server e non affidano l'autorizzazione al browser.

### Gate amministrativi
Modulo attivo:
- `apps/training/requirement-evidence-admin-v21.js`

Il vecchio `requirement-evidence-admin-v20.js` resta nel repository ma non viene caricato dalla nuova `index.html`.

Il modulo v21:
- non scrive direttamente `enrollment_requirement_evidence`
- usa `admin_set_requirement_evidence()`
- lascia al DB la risoluzione degli ID requisito
- impedisce modifiche manuali dei test gestiti dal Test Builder

### Catalogo SafetyManager governance
Modulo legacy:
- `apps/training/course-catalog.js`

Filtro governance v21:
- `apps/training/course-catalog-governance-v21.js`

Esclude dal selettore mapping:
- corsi non `go_live_ready`
- corsi non finalizzati
- corsi congelati
- corsi esclusi
- reference library
- placeholder SafetyManager

La protezione definitiva resta lato DB in `configure_safetymanager_course()`.

### PWA / cache
Cache corrente:
- `safety-training-v21-5`

Asset amministrativi v21 cacheati:
- `admin-backend-v21.js`
- `admin-details-v21.js`
- `requirement-evidence-admin-v21.js`
- `course-catalog-governance-v21.js`

## Backend amministrativo v21 — migration live

Migration Supabase applicate e presenti nel repository con timestamp esatto:
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

### Audit amministrativo
Tabella privata:
- `private.admin_audit_log`

Accesso diretto negato a `anon` e `authenticated`.
Lettura tramite RPC autorizzata.
Registra actor, azione, entity type/id, organizzazione, before/after state, context, timestamp.

### RPC core platform-admin
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
- `admin_company_detail()`
- `admin_learner_detail()`
- `admin_edition_detail()`

Tutte le RPC core sensibili fanno autorizzazione server-side; `TO authenticated` NON è considerato autorizzazione sufficiente.

### RPC evidenze staff
- `admin_set_requirement_evidence()`

Autorizzazione:
- utente autenticato
- `private.can_access_company(org, company)`
- non amplia il diritto a qualunque authenticated

Regole:
- solo `practical|verification`
- manuale solo `completed|failed|revoked`
- requisito obbligatorio e realmente legato al corso/versione dell'iscrizione
- practical sempre evidenza esterna
- test platform non modificabili manualmente
- complete/fail/revoke auditati
- ricalcolo enrollment/completion gate automatico

### Guardrail evidenze
Trigger `enrollment_requirement_evidence_context_guard`:
- binding enrollment/kind/key immutabile
- ID requisito risolti dal DB
- practical legato al corso reale
- verification legato alla versione reale
- platform evidence richiede test attempt completato della stessa iscrizione/versione/requisito
- completed platform => `passed=true`
- failed platform => `passed=false`
- platform evidence solo `completed|failed`, mai `revoked`

### Guardrail core
DB blocca:
- incoerenze tenant azienda/corsista/edizione
- spostamenti tenant non dedicati
- date edizione invalide
- riapertura di edizione archiviata
- apertura edizioni su versioni non go-live/frozen/escluse
- enrollment non compatibili
- modifica binding enrollment
- disattivazioni incompatibili con edizioni aperte

Trigger core:
- `companies`
- `learners`
- `course_editions`
- `enrollments`

## SafetyManager integration — v21_009/v21_010

### Problema corretto
`import_safetymanager_package()` utilizzava `course_editions.metadata`, ma la colonna non esisteva. L'import di un corso nuovo falliva con `column "metadata" of relation "course_editions" does not exist`.

Inoltre i primi guardrail v21 bloccavano lo staging SafetyManager intenzionale per corsi `needs_configuration`.

### v21_009
Aggiunto:
- `course_editions.metadata jsonb not null default '{}'`

Eccezione staging strettamente limitata:
- platform admin
- `source_system=safetymanager`
- edizione `draft|closed`
- source/project enrollment coerenti con l'edizione
- tenant/azienda/corsista ancora obbligatoriamente coerenti

Le normali edizioni Admin `draft` NON accettano enrollment.
Aprire una edizione richiede sempre versione go-live valida.

### v21_010
`configure_safetymanager_course()` ora:
- platform-admin lato DB
- `search_path=''`
- per `ready|hybrid`: corso attivo, non congelato/escluso/reference
- versione published + finalization_candidate + go_live_ready
- salva `course_version_id` validato
- aggiorna le edizioni SafetyManager alla versione validata
- audit `safetymanager.course_configure`
- respinge corsi congelati/non-go-live

Irrigidite anche:
- `import_safetymanager_package()`
- `sync_safetymanager_training_context()`
- `preview_safetymanager_composition()`
- `get_course_readiness()`
- `set_course_verification_path()`

Per queste RPC: `search_path=''`, revoke `public/anon`, autorizzazione server-side esistente preservata.

### Normalizzazione catalogo
Prima:
- 10 voci `ready|hybrid`
- 4 `hybrid` senza mapping go-live valido
- 2 mapping congelati già `needs_configuration`

Dopo v21_010:
- 6 `ready|hybrid`
- 0 `ready|hybrid` senza go-live valido
- 0 frozen marcati `ready|hybrid`

## Correzione RLS legacy
Risolta ricorsione RLS fra `enrollments` e `course_editions` con:
- `private.can_use_enrollment()` RLS-safe
- `private.can_manage_edition_id()`
- `private.current_user_has_edition_enrollment()`
- policy enrollment/edition senza ciclo cross-table

NON ripristinare le vecchie policy recursive.

## QA v21

### Core backend
QA E2E rollback:
- azienda
- corsista
- edizione go-live
- bulk enrollment
- lettura RLS
- revoke/restore
- dashboard/audit
- 0 residui

### Gate v21_007/v21_008
QA rollback:
- practical complete => evidenza external, gate 0→1, audit
- revoke => gate 1→0, audit
- manipolazione manuale Test Builder respinta
- 0 evidenze illegittime
- 0 residui
- authenticated non legge direttamente `private.admin_audit_log`

### SafetyManager v21_009/v21_010
QA rollback:
- import corso sconosciuto: placeholder + edizione draft + enrollment staging + needs_configuration
- normale draft Admin continua a bloccare enrollment
- import/sync/readiness funzionano con `search_path=''`
- mapping valido configurato e auditato
- mapping frozen respinto
- 0 residui

### Detail v21_011
QA rollback su dati temporanei collegati:
- company detail: nome corretto, 1 learner, 1 edition
- learner detail: email corretta, 1 enrollment
- edition detail: titolo corretto, 1 enrollment, course version presente, `go_live_ready=true`
- utente non-platform-admin respinto con `platform_admin_required`
- residui QA: 0

## Advisor Supabase dopo v21_011

Security:
- 22 warning `authenticated_security_definer_function_executable`, inclusi i nuovi detail RPC: attesi perché callable da authenticated ma con controllo platform-admin interno; non convertirli automaticamente
- leaked password protection disabilitato: warning noto

Performance:
- rimane una sola FK legacy non indicizzata: `training_blueprint_rules`
- `auth_rls_initplan`, multiple permissive policies e unused indexes restano warning noti
- non auto-fixare senza blocco dedicato

## CI / deploy

Ultimo commit funzionale verificato prima di questo handoff:
- `0c2ae3abb690bc05d1011d88158f8786b1d87902`

GitHub Actions:
- `SafetyTraining checks` run #242: `SUCCESS`

Vercel:
- status `FAILURE` esclusivamente per `build-rate-limit` / richiesta upgrade Pro
- NON è errore di compilazione SafetyTraining
- Supabase v21_001–v21_011 è live
- frontend v21-5 è nel repository ma non va considerato verificato in produzione finché Vercel non riesce a deployarlo

## Inviti / portale corsista

Inviti:
- `learner_account_invitations`
- Edge Function `invite-learner`
- onboarding `claim_learner_account()`

Portale corsista:
- Home → `I miei corsi`
- solo assegnazioni
- catalogo completo/strumenti interni nascosti
- corsi revocati rimossi

## Moduli amministrativi auditati

- `blueprint-admin.js`: read-only
- `course-readiness-admin.js`: read-only via RPC
- `integration-import.js`: import/sync via RPC
- `course-catalog.js`: mapping via RPC + filtro governance v21
- `requirement-evidence-admin-v21.js`: evidence write via RPC
- `admin-details-v21.js`: detail read via RPC

## Prossimo lavoro operativo

Command layer + read/detail layer amministrativo ora presenti.

Priorità successiva:
1. progettare e applicare ruoli granulari `organization_admin` / `training_manager` alle operazioni oggi platform-admin only, con scope tenant/azienda e senza privilege escalation
2. creare una RPC capability/permission summary per far mostrare alla UI solo le funzioni consentite al ruolo corrente
3. adattare progressivamente la console v21 a tali capability senza esporre il pannello editoriale globale a ruoli tenant
4. appena Vercel torna disponibile: deploy + QA browser reale di Admin bridge, Detail, Gate, Catalog governance e PWA v21-5
5. solo dopo QA produzione valutare revoca delle scritture dirette legacy su `enrollment_requirement_evidence`
6. consolidare i bridge dentro `admin.js` solo dopo stabilizzazione
7. aggiornare SEMPRE questo handoff dopo ogni blocco

Flusso operativo finale da preservare:
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
