# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-16

Questo file è la fonte rapida di ripartenza quando si cambia chat. Va aggiornato dopo ogni blocco sostanziale.

## Decisioni utente da NON perdere

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

### Inviti account
Migration: `20261016190217_v20_096_learner_account_invitation_registry`
Tabella: `learner_account_invitations`.
Edge Function: `invite-learner` (`verify_jwt=true`, solo platform admin, service role server-side).

UI:
- Corsisti: stato account/invito + `Invita` / `Reinvia`
- Iscrizioni: stato account + invito
- `learner-onboarding-v20.js`: scelta password + `claim_learner_account()`

### Iscrizioni / edizioni
- `admin-bulk-enrollment-v20.js`: iscrizione multipla, filtro organizzazione/azienda, anti-duplicato, invito opzionale
- `admin-edition-overview-v20.js`: iscritti, account attivi, da iniziare, in corso, completati, `Gestisci corsisti`
- `admin-edition-version-selector-v20.js`: per nuove edizioni mostra candidate solo se `go_live_ready=true`; esclude congelati e librerie interne; prima del go-live faceva fallback alla legacy

### Portale corsista
`learner-access-guard-v20.js`:
- Home -> `I miei corsi`
- solo assegnazioni
- catalogo completo/ricerca/modalità Aula-Docente/strumenti interni nascosti
- corsi revocati rimossi dalla vista

## QA amministrativo

QA in transazione con `ROLLBACK` superato:
- creazione edizione temporanea
- filtro corsisti compatibili
- iscrizione multipla
- vincolo anti-duplicato `(edition_id, learner_id)`
- revoca
- binding alla versione corretta
- trigger account/invito

Dopo rollback: nessun dato QA residuo.

Dati reali attuali al go-live:
- 3 learners attivi
- i 3 learners attuali non hanno email valorizzata: possono essere iscritti, ma NON possono ricevere un invito account finché l'email non viene completata
- 0 edizioni candidate create automaticamente
- 0 iscrizioni candidate create automaticamente

## Produzione / QA tecnico

Prima di `v20_100`:
- GitHub SHA `d3c4ee7b6839a289ed338183f34e442a1007a71f`
- CI SafetyTraining checks #207: `SUCCESS`
- Vercel produzione sullo stesso SHA: `READY`
- alias pubblico `safety-training-safety-manager.vercel.app` risponde 200
- moduli Admin, Inviti, Onboarding, Test Builder, learner guard e selector versioni realmente serviti dal deployment
- runtime Vercel: nessun error/warning negli ultimi 30 minuti controllati

Il commit successivo deve contenere questa documentazione e la migration esatta `v20_100`; verificarne CI e Vercel prima di considerare chiuso il blocco.

## Security / performance warnings noti — fuori scope

NON auto-fixare salvo richiesta esplicita:
- funzioni `SECURITY DEFINER` autenticate note
- leaked password protection disabilitato
- warning RLS initplan / multiple permissive policies
- FK non indicizzata `training_blueprint_rules`
- unused indexes

## Prossimo lavoro operativo

Il contenuto approvato è ora pronto per NUOVE edizioni. Non creare edizioni o iscrizioni senza dati reali dell'attività da gestire.

Flusso successivo corretto:
1. completare email dei corsisti che devono avere accesso digitale
2. creare una vera edizione dal pannello Admin scegliendo la versione `approvata`
3. iscrivere i corsisti (singolo o bulk)
4. inviare gli inviti account
5. verificare frequenza/progresso, test e gate pratici
6. completamento/certificazione e integrazione SafetyManager quando i requisiti risultano soddisfatti

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- Produzione: `safety-training-safety-manager.vercel.app`
