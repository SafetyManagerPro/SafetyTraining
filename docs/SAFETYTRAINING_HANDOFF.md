# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-16

Questo file è la fonte rapida di ripartenza quando si cambia chat. Va aggiornato dopo ogni blocco sostanziale.

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

### Politica di versioning
- Nuovi contenuti sono stati creati e revisionati prima come `draft`.
- Storico delle vecchie versioni preservato.
- Nessun relink distruttivo delle vecchie edizioni.
- Il go-live è stato eseguito a step controllati `v20_097`–`v20_100`, con assertion e rollback QA prima di ogni promozione.

## Contenuti authored completati

Completati nel perimetro attivo:
- Lavoratori generale/specifica/aggiornamenti: `general-authored-v4`, `worker-authored-v3`
- Preposto e Dirigente + aggiornamenti: `role-authored-v3`
- Datore 16h + aggiornamento: `datore-authored-v3`
- RLS + aggiornamenti: `rls-authored-v3`
- Primo soccorso + aggiornamenti: `first-aid-authored-v3`
- Antincendio livelli/aggiornamenti: `fire-authored-v3`
- Attrezzature/aggiornamenti: `equipment-authored-v3`
- Emergenze/evacuazione: `emergency-authored-v3` + shared authored
- Lavori in quota: `height-authored-v3`
- DL-RSPP Datore comune + Agricoltura + Pesca + Chimico/Petrolchimico + Costruzioni + aggiornamento: `dl-rspp-authored-v3`
- Modulo Cantieri Datore 6h: `datore-cantieri-authored-v3`
- Modulo Cantieri Dirigente 6h: `dirigente-cantieri-authored-v3`

`mod_cantieri` resta UN SOLO corso catalogo; ha due `course_versions` candidate role-specific (Datore e Dirigente). Non creare un 93° corso.

## Finalizzazione / go-live — COMPLETATO

Perimetro finale:
- 60 `course_versions` candidate
- 59 corsi distinti
- 290 `learning_unit_versions` distinte collegate
- 60/60 composizioni complete
- 60/60 percorsi di verifica selezionati
- 36 versioni con Test Builder
- 37 versioni/corsi con gate pratico richiesto
- 0 candidati congelati

### `v20_097` — Learning Unit
Migration Supabase: `20261016192402_v20_097_publish_candidate_learning_units`
- pubblicate 290/290 LU candidate
- teacher/learner/explanation quality gate già verde
- nessuna `course_version` promossa in questo step

### `v20_098` — Course versions pubblicate ma bloccate
Migration Supabase: `20261016192912_v20_098_publish_candidate_course_versions_blocked`
- pubblicate 60/60 `course_versions`
- `go_live_ready=false`
- `administrative_assignment_blocked=true`
- nessuna nuova edizione creata

### `v20_099` — Test Builder attivo in QA
Migration Supabase: `20261016193110_v20_099_activate_candidate_tests_qa`
- attivati 36/36 test preparati nel batch `v20_091`
- soglia 70%
- binding esatto alla `course_version`
- scoring/pass calcolati lato DB, non dal browser
- rollback E2E superato con risposta corretta -> 100% / passed=true
- le course versions erano ancora non assegnabili durante il QA

### `v20_100` — GO-LIVE nuove edizioni
Migration Supabase: `20261016193922_v20_100_enable_candidate_course_versions_go_live`
- 60/60 `course_versions`: `go_live_ready=true`
- 0 `administrative_assignment_blocked`
- 0 candidati congelati
- 290/290 LU pubblicate
- 36/36 test attivi
- 37/37 gate pratici con `completion_mode` valorizzato
- 0 candidate editions
- 0 candidate enrollments

Importante: `v20_100` NON crea automaticamente edizioni né iscrizioni. Rende solo le versioni approvate selezionabili per nuove edizioni amministrative.

## Test Builder

Banca authored:
- 1.450 domande
- 290 LU × 5 domande
- explanation pubblica
- answer key separata

Test go-live:
- 36 test attivi
- 660 test-question links
- 30 domande per percorsi iniziali/ruolo quando previsto
- 10 per aggiornamenti e questionari teorici attrezzature
- soglia 70%

Runtime DB sicuro:
- `private.prepare_test_attempt()`
- `private.grade_test_answer()`
- `private.sync_test_attempt_score()`
- score/pass non scrivibili dal browser corsista

## Gate di completamento

Tabella: `enrollment_requirement_evidence`.

Regola: 100% LU digitali NON basta se il percorso richiede pratica/addestramento/verifica.

Stato finale:
- 37 requisiti pratici obbligatori nel perimetro go-live
- 0 requisiti pratici senza `completion_mode`
- 73 requirement rows di verifica complessive sulle 60 versioni
- 60/60 versioni hanno una modalità di verifica selezionata
- 36 verifiche sono `selected_mode=test`

Staff può registrare/revocare evidenze pratiche/esterne; il corsista non può autocertificarle.

## Amministrazione / inviti / portale corsista

### Admin v21 — backend service layer IN CORSO
La console amministrativa v21 è stata riscritta come interfaccia unica, ma inizialmente effettuava ancora diverse scritture direttamente sulle tabelle Supabase.
Dal 2026-10-16 è iniziata la separazione netta tra UI e backend amministrativo.

Migration applicate e salvate nel repository:
- `20261016212444_v21_001_admin_backend_service_layer`
- `20261016212541_v21_002_admin_backend_core_crud`

Nuovo registro privato:
- `private.admin_audit_log`
- nessun accesso diretto a `anon` / `authenticated`
- conserva actor, azione, entità, tenant, before/after state, context e timestamp

RPC amministrative protette da `private.is_platform_admin()`:
- `admin_save_company()`
- `admin_save_learner()`
- `admin_create_edition()`
- `admin_update_edition()`
- `admin_bulk_enroll()`
- `admin_set_enrollment_revoked()`
- `admin_recent_actions()`
- `admin_save_organization()`
- `admin_set_active()`
- `admin_save_course()`

Regole ora enforce lato DB:
- azienda e corsista devono appartenere all'organizzazione corretta
- azienda usata da corsista/edizione deve essere attiva e coerente col tenant
- nuova edizione solo su `course_version` pubblicata, `finalization_candidate=true`, `go_live_ready=true` e corso non congelato/escluso
- bulk enrollment solo su edizione aperta e corsisti attivi/compatibili
- anti-duplicato iscrizioni mantenuto e gestito in modo idempotente
- revoca/riattivazione iscrizione calcolata lato backend
- disattivazione organizzazione/azienda/corso bloccata se esistono edizioni aperte incompatibili con l'operazione
- creazione nuovo corso + `course_version` v1 bozza avviene in un'unica transazione DB
- funzioni `SECURITY DEFINER` con `search_path=''` e grant solo `authenticated`; l'autorizzazione reale resta verificata dentro ogni RPC

QA autorizzazioni:
- identità platform admin simulata: accesso alle RPC admin riuscito
- identità non-admin simulata: `platform_admin_required` / SQLSTATE 42501
- nessun dato reale creato durante il QA di autorizzazione

Prossimo step backend/admin:
1. collegare `apps/training/admin.js` alle RPC v21 eliminando le scritture sensibili dirette
2. portare l'activity tab anche su `admin_recent_actions()` per mostrare audit amministrativo separato dagli eventi didattici
3. QA transazionale delle RPC create/update/bulk/revoke senza lasciare dati residui
4. aggiornare ancora questo handoff nello stesso blocco

### Inviti account
Migration: `20261016190217_v20_096_learner_account_invitation_registry`
Tabella: `learner_account_invitations`.
Edge Function: `invite-learner` (`verify_jwt=true`, solo platform admin, service role server-side).

UI:
- Corsisti: stato account/invito + `Invita` / `Reinvia`
- Iscrizioni: stato account + invito
- `learner-onboarding-v20.js`: scelta password + `claim_learner_account()`

### Iscrizioni / edizioni
I vecchi moduli frammentati `admin-bulk-enrollment-v20.js`, `admin-edition-overview-v20.js`, `admin-edition-version-selector-v20.js`, ecc. sono stati rimossi dal caricamento dopo la riscrittura unificata v21. Le funzioni equivalenti vivono ora nella console `apps/training/admin.js`; il backend è in migrazione verso le RPC v21 sopra elencate.

### Portale corsista
`learner-access-guard-v20.js`:
- Home -> `I miei corsi`
- solo assegnazioni
- catalogo completo/ricerca/modalità Aula-Docente/strumenti interni nascosti
- corsi revocati rimossi dalla vista

## QA amministrativo

QA precedente in transazione con `ROLLBACK` superato:
- creazione edizione temporanea
- filtro corsisti compatibili
- iscrizione multipla
- vincolo anti-duplicato `(edition_id, learner_id)`
- revoca
- binding alla versione corretta
- trigger account/invito

Dopo rollback: nessun dato QA residuo.

Dati reali rilevati al go-live v20:
- 3 learners attivi
- i 3 learners rilevati allora non avevano email valorizzata: potevano essere iscritti, ma non ricevere invito account finché l'email non veniva completata
- 0 edizioni candidate create automaticamente
- 0 iscrizioni candidate create automaticamente

## Produzione / QA tecnico

Stato storico prima di `v20_100`:
- GitHub SHA `d3c4ee7b6839a289ed338183f34e442a1007a71f`
- CI SafetyTraining checks #207: `SUCCESS`
- Vercel produzione sullo stesso SHA: `READY`
- alias pubblico `safety-training-safety-manager.vercel.app` risponde 200
- runtime Vercel senza error/warning nel controllo effettuato allora

Stato sviluppo successivo:
- Admin frontend v21 unificato caricato in produzione
- service worker portato a cache `safety-training-v21-1`
- backend admin v21 ora presente su Supabase con migration `v21_001` e `v21_002`
- migration v21 salvate anche in `supabase/migrations/`
- dopo ogni successivo blocco verificare CI/Vercel e registrare qui SHA e risultato

## Security / performance warnings noti — fuori scope

NON auto-fixare salvo richiesta esplicita:
- funzioni `SECURITY DEFINER` autenticate note non appartenenti al nuovo backend v21
- leaked password protection disabilitato
- warning RLS initplan / multiple permissive policies
- FK non indicizzata `training_blueprint_rules`
- unused indexes

Nota: le nuove RPC admin v21 usano deliberatamente `SECURITY DEFINER`, ma con `search_path=''`, grant ristretto e controllo esplicito `private.is_platform_admin()`; non vanno confuse con i warning legacy sopra.

## Prossimo lavoro operativo

Priorità corrente: completare il backend amministrativo v21 e collegare la console unificata alle RPC prima di ampliare altre funzionalità.

Flusso applicativo finale da preservare:
1. completare email dei corsisti che devono avere accesso digitale
2. creare una vera edizione dal pannello Admin scegliendo la versione approvata
3. iscrivere i corsisti (singolo o bulk)
4. inviare gli inviti account
5. verificare frequenza/progresso, test e gate pratici
6. completamento/certificazione e integrazione SafetyManager quando i requisiti risultano soddisfatti

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- Produzione: `safety-training-safety-manager.vercel.app`
