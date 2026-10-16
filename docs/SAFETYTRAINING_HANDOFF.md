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

### Politica di versioning contenuti
- Nuovi contenuti revisionati prima come `draft`.
- Storico vecchie versioni preservato.
- Nessun relink distruttivo delle vecchie edizioni.
- Go-live eseguito a step controllati `v20_097`–`v20_100`.

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

Contenuti authored completati nel perimetro attivo:
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

`mod_cantieri` resta UN SOLO corso catalogo con due `course_versions` role-specific. Non creare un 93° corso.

### Sequenza go-live
- `20261016192402_v20_097_publish_candidate_learning_units`: 290/290 LU pubblicate
- `20261016192912_v20_098_publish_candidate_course_versions_blocked`: 60/60 versioni pubblicate ma amministrativamente bloccate
- `20261016193110_v20_099_activate_candidate_tests_qa`: 36/36 test attivati in QA
- `20261016193922_v20_100_enable_candidate_course_versions_go_live`: 60/60 versioni `go_live_ready=true`

`v20_100` NON crea automaticamente edizioni o iscrizioni: abilita le versioni approvate alla selezione amministrativa.

## Test Builder / completamento

Banca authored:
- 1.450 domande
- 290 LU × 5 domande
- explanation pubblica
- answer key separata

Test go-live:
- 36 test attivi
- 660 test-question links
- soglia 70%
- scoring/pass lato DB

Gate:
- tabella `enrollment_requirement_evidence`
- 37 requisiti pratici obbligatori
- 0 requisiti pratici senza `completion_mode`
- 73 requirement rows complessive sulle 60 versioni
- il corsista non può autocertificare evidenze pratiche/esterne

## Amministrazione v21

### Frontend amministrativo
Console unica in `apps/training/admin.js` con:
- Dashboard
- Organizzazioni
- Aziende
- Corsisti
- Corsi
- Edizioni
- Iscrizioni
- Attività

Dal blocco v21 backend è presente anche:
- `apps/training/admin-backend-v21.js`

Il file viene caricato subito dopo `admin.js` ed è il bridge tra UI amministrativa e service layer Supabase.

Funzioni del bridge:
- intercetta in capture phase i submit/modifiche core prima delle vecchie scritture dirette di `admin.js`
- instrada le scritture sulle RPC v21
- mantiene `admin.js` come layer UI/lettura
- usa `admin_dashboard_summary()` per riallineare i KPI dashboard al backend
- usa `admin_recent_actions()` per mostrare nella tab Attività l'audit amministrativo separato dagli eventi didattici
- mantiene l'invio account tramite Edge Function `invite-learner`

Scritture core instradate via RPC:
- organizzazioni
- aziende
- corsisti
- corsi
- creazione/modifica edizioni
- apertura/chiusura edizioni
- iscrizione multipla
- revoca/riattivazione iscrizione
- attiva/disattiva organizzazione/azienda/corsista

Service worker aggiornato:
- cache corrente `safety-training-v21-2`
- `admin-backend-v21.js` incluso negli asset offline

Nota architetturale: le vecchie funzioni di scrittura dentro `admin.js` restano fisicamente presenti per ora, ma a runtime il bridge intercetta le operazioni sensibili prima che vengano eseguite. I guardrail DB v21 restano la seconda barriera se il bridge non fosse caricato. Consolidare in futuro il bridge dentro `admin.js` solo dopo stabilizzazione, senza cambiare comportamento.

### Backend amministrativo v21 — SERVICE LAYER ATTIVO

Migration Supabase applicate e salvate nel repository con timestamp esatto:
- `20261016212444_v21_001_admin_backend_service_layer`
- `20261016212541_v21_002_admin_backend_core_crud`
- `20261016212933_v21_003_admin_backend_guardrails`
- `20261016213037_v21_004_fix_enrollment_rls_recursion`
- `20261016213106_v21_005_break_edition_enrollment_rls_cycle`
- `20261016213147_v21_006_admin_audit_actor_index`

#### Audit amministrativo
Nuova tabella privata:
- `private.admin_audit_log`

Registra:
- actor user
- azione
- entity type/id
- organization
- before state
- after state
- context
- timestamp

Accesso diretto negato a `anon` e `authenticated`; lettura amministrativa tramite RPC protetta.
Indici presenti su data, entità, organizzazione e actor user.

#### RPC amministrative
RPC pubbliche protette da controllo esplicito `private.is_platform_admin()`:
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

Le RPC che richiedono privilegi usano `SECURITY DEFINER`, `search_path=''`, grant solo a `authenticated` e controllo interno platform-admin. Il warning del Supabase linter `authenticated_security_definer_function_executable` è quindi ATTESO per queste funzioni: non rimuovere il controllo interno né convertire automaticamente senza riprogettare il service layer.

#### Regole enforce lato DB
Ora il database impedisce anche se il browser tenta una scrittura diretta:
- azienda deve appartenere a organizzazione attiva
- spostamento azienda tra tenant bloccato senza operazione dedicata
- corsista deve appartenere a organizzazione attiva
- azienda del corsista deve appartenere allo stesso tenant ed essere attiva
- spostamento corsista tra tenant bloccato senza operazione dedicata
- edizione: tenant immutabile dopo creazione
- edizione: azienda coerente col tenant
- edizione: date valide
- edizione archiviata terminale
- nuova/aperta edizione solo su versione pubblicata, finalizzata, `go_live_ready=true`, corso attivo e non congelato/escluso
- iscrizione: binding `edition_id`/`learner_id` immutabile
- nuova iscrizione solo su edizione aperta
- corsista da iscrivere deve essere attivo, nello stesso tenant e compatibile con l'azienda dell'edizione
- bulk enrollment idempotente grazie a `(edition_id, learner_id)`
- revoca/riattivazione calcolata lato backend
- disattivazione di organizzazione/azienda/corso bloccata in presenza di edizioni aperte incompatibili
- nuovo corso + `course_version` v1 `draft` creati nella stessa transazione

Guardrail trigger installati su:
- `companies`
- `learners`
- `course_editions`
- `enrollments`

### Correzione RLS emersa dal QA
Il QA v21 ha scoperto una ricorsione RLS legacy tra `enrollments` e `course_editions`:
- `enrollments_manage_staff` consultava `course_editions`
- `editions_read` consultava nuovamente `enrollments`
- risultato possibile: `infinite recursion detected in policy for relation "enrollments"`

Correzioni applicate:
- `private.can_use_enrollment()` usa `row_security=off` solo nella lookup privilegiata interna
- nuovo `private.can_manage_edition_id()` con lookup RLS-safe
- nuovo `private.current_user_has_edition_enrollment()` con lookup RLS-safe
- policy `enrollments_manage_staff` riscritta tramite helper
- policy `editions_read` riscritta senza ciclo cross-table

Non ripristinare le vecchie policy recursive.

## QA backend/frontend v21

QA autorizzazioni:
- platform admin simulato: RPC admin accessibile
- non-admin simulato: rifiutato con `platform_admin_required` / SQLSTATE 42501

QA E2E backend in singola transazione con `ROLLBACK` superato:
1. creazione azienda QA
2. creazione corsista QA
3. creazione edizione su `course_version` go-live
4. bulk enrollment
5. lettura enrollment attraverso RLS
6. revoca iscrizione
7. riattivazione iscrizione
8. controllo `admin_dashboard_summary()`
9. controllo audit amministrativo
10. rollback

Residui dopo QA:
- aziende QA: 0
- corsisti QA: 0
- edizioni QA: 0
- audit QA: 0

QA bridge frontend:
- `admin-backend-v21.js` passa `node --check`
- `index.html` carica `admin-backend-v21.js` subito dopo `admin.js`
- `sw.js` cache `safety-training-v21-2` include il bridge
- `admin_dashboard_summary()` verificata come platform admin
- `admin_recent_actions()` verificata come platform admin
- snapshot QA corrente: 2 aziende attive, 3 corsisti attivi, 92 corsi attivi, 0 edizioni, 0 iscrizioni

## Advisor Supabase dopo v21

Security:
- warning sulle RPC `SECURITY DEFINER` esposte agli authenticated: intenzionale per il service layer, con verifica platform-admin interna
- leaked password protection ancora disabilitato: warning noto, non modificato in questo blocco

Performance:
- nuovo warning FK audit actor risolto con `v21_006`
- warning legacy `training_blueprint_rules` FK non indicizzata ancora fuori scope
- warning `auth_rls_initplan`, multiple permissive policies e unused indexes ancora presenti; non auto-fixare senza blocco dedicato

## CI / deploy dopo admin backend bridge v21

Ultimo commit funzionale verificato:
- `3e699b3324885c396e456e3a490a92a8b83e23b0`

Verifica:
- GitHub Actions `SafetyTraining checks` run #225: `SUCCESS`
- `admin-backend-v21.js`, `index.html` e `sw.js` superano i check del repository
- Vercel status sul commit: `FAILURE` esclusivamente per `build-rate-limit` / richiesta upgrade Pro
- il fallimento Vercel non è un errore di compilazione del codice SafetyTraining

Supabase è già aggiornato live con `v21_001`–`v21_006`; il frontend aggiornato è nel repository ma la produzione Vercel non può ricevere il nuovo commit finché il limite build non rientra o viene aumentato.

## Inviti / portale corsista

Inviti account:
- tabella `learner_account_invitations`
- Edge Function `invite-learner`
- onboarding con `claim_learner_account()`

Portale corsista:
- Home → `I miei corsi`
- solo assegnazioni
- catalogo completo e strumenti interni nascosti al corsista
- corsi revocati rimossi dalla vista

## Prossimo lavoro operativo

Backend amministrativo core ora collegato alla console tramite bridge RPC.

Priorità successiva consigliata:
1. completare il read/service layer amministrativo per ridurre progressivamente anche le query dirette sensibili dal frontend
2. aggiungere viste/detail amministrative per singola azienda, corsista ed edizione
3. definire ruoli amministrativi più granulari oltre al solo `platform_admin` (organization admin / training manager) senza allargare privilegi accidentalmente
4. consolidare `admin-backend-v21.js` dentro `admin.js` solo dopo stabilizzazione e QA browser
5. eseguire test browser reale su produzione appena Vercel torna disponibile
6. aggiornare questo handoff dopo ogni blocco

Flusso applicativo finale da preservare:
1. completare email dei corsisti che devono avere accesso digitale
2. creare una vera edizione scegliendo versione approvata
3. iscrivere corsisti singolarmente o bulk
4. inviare inviti account
5. verificare frequenza/progresso, test e gate pratici
6. completamento/certificazione e integrazione SafetyManager quando tutti i requisiti sono soddisfatti

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- Produzione: `safety-training-safety-manager.vercel.app`
