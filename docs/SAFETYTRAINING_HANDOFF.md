# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-16

Questo file è la fonte rapida di ripartenza quando si cambia chat. Va aggiornato dopo ogni blocco sostanziale.

## Decisioni utente da NON perdere

### Percorsi fuori roadmap / congelati
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

### Politica di pubblicazione
- Nuove LU e nuove composizioni: prima `draft`.
- Nessun auto-publish e nessun auto-relink.
- Le candidate diventano ufficiali solo con passaggio esplicito di go-live.
- Storico delle vecchie versioni da preservare.

## Stato contenuti authored

Completati e candidati:
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

`mod_cantieri` resta UN SOLO corso catalogo; il Blueprint `employer_construction_addon` seleziona variante Datore/Dirigente tramite ruolo. Non creare un 93° corso.

## Finalizzazione candidate — COMPLETA lato preparazione

Migrations principali:
- `v20_084` freeze specialistici fuori roadmap
- `v20_085` gate pratici antincendio / confine prova evacuazione
- `v20_086` normalizzazione Blueprint/finalization scope
- `v20_087` composizioni candidate authored
- `v20_088` candidate role-specific `mod_cantieri`
- `v20_089` verification paths
- `v20_090` banca domande authored
- `v20_091` candidate tests
- `v20_091` secure test runtime
- `v20_092` completion gate per iscrizione
- `v20_093` Blueprint finalization review
- `v20_094` normalizzazione URL Napo
- `v20_095` cleanup metadata attivazione test
- `v20_096` registro inviti account corsisti

Stato candidate:
- 60 `course_versions` candidate
- 59 corsi (due candidate per `mod_cantieri`: Datore e Dirigente)
- tutte `draft`
- 365 link LU authored-ready
- 60/60 composition/linking complete
- 60/60 verification configured
- 36 candidate con Test Builder
- 37 candidate con requisiti pratici
- 0 candidate editions
- 0 candidate enrollments
- nessuna candidate pubblicata

## Test Builder

Banca nuova authored:
- 1.450 domande
- 290 LU candidate × 5 domande
- 3 alternative
- explanation pubblica
- answer key separata

Test candidate:
- 36 test
- 660 test-question links
- 0 duplicati
- 30 domande per iniziali/ruolo quando previsto
- 10 per aggiornamenti e questionari teorici attrezzature
- soglia 70%
- tutti `active=false`

Runtime sicuro DB:
- `private.prepare_test_attempt()`
- `private.grade_test_answer()`
- `private.sync_test_attempt_score()`
- score/pass non scrivibili dal browser corsista
- binding test/LU alla `course_version` assegnata

## Gate di completamento

Tabella: `enrollment_requirement_evidence`.

Regola: 100% LU digitali NON basta se la versione richiede pratica/addestramento/verifica.

Verificato in rollback:
- PLE: contenuti 100% resta `in_progress` finché non risultano pratica + prova finale + test teorico
- Datore 16h: contenuti 100% resta `in_progress` finché non supera il test finale

UI:
- staff può registrare/revocare evidenze esterne/pratiche
- corsista vede lo stato dei gate ma non può autocertificarli
- test di piattaforma si chiudono solo dal motore DB

## Blueprint QA

- 22 Blueprint in QA
- 0 varianti orfane
- 0 regole con varianti inesistenti
- regola verifica Lavoratori aggiunta
- duplicato pratico lavori in quota disattivato
- vecchie regole RLS update duplicate disattivate
- `publication_blocked=true` ancora intenzionale fino al go-live
- congelati esclusi dalla finalizzazione

## Binding app / versioning

Corretto il bug per cui il client cercava l'ultima LU pubblicata globale.
Ora un corsista apre esattamente le LU collegate alla `course_version_id` della propria edizione.
Commit storico: `44c858b0...`.

## Napo / risorse esterne

- bridge `video_plan -> player` attivo
- `video_plan.media_url` = video diretto
- `video_plan.url` = pagina ufficiale fallback
- 23/23 video plan authored hanno pagina + media diretto
- slug Napo obsoleti: 0
- fallback resiliente attivo
- corsi authored con riferimenti Napo disponibili

## Amministrazione / inviti / portale corsista

### Modello esistente
- `course_editions`
- `learners`
- `enrollments`
- `learner.auth_user_id`
- `claim_learner_account()` collega account Auth all'anagrafica tramite email verificata

### Inviti account — implementato
Migration:
`20261016190217_v20_096_learner_account_invitation_registry`

Tabella:
`learner_account_invitations`

Stati:
- not_sent
- sent
- accepted
- failed
- revoked

Trigger aggiorna automaticamente a `accepted` quando `learners.auth_user_id` viene collegato.

Edge Function Supabase:
`invite-learner`
- verify_jwt=true
- solo platform admin
- usa `auth.admin.inviteUserByEmail`
- se account Auth già esistente usa recovery/reset password
- service role mai esposta al browser
- registra invii/errori/stato

UI Admin:
- tab Corsisti: stato Account/Invito + `Invita`/`Reinvia`
- tab Iscrizioni: stato account + `Invita`/`Reinvia`
- primo accesso: `learner-onboarding-v20.js`, scelta password + claim learner

### Iscrizione multipla — implementata
`admin-bulk-enrollment-v20.js`
- selezione edizione open
- filtra corsisti compatibili per organizzazione/azienda
- esclude chi è già iscritto
- selezione multipla
- inserimento in blocco
- opzione invito immediato agli account non attivi
- vincolo DB `UNIQUE(edition_id, learner_id)` protegge dai duplicati

### Edizioni — overview implementata
`admin-edition-overview-v20.js`
Mostra per edizione:
- iscritti
- account attivi
- da iniziare
- in corso
- completati
- pulsante `Gestisci corsisti`

### Portale corsista — assigned courses only
`learner-dashboard.js` già gestisce `I miei corsi` e route guard per assegnazioni.
Aggiunto `learner-access-guard-v20.js`:
- Home corsista -> `I miei corsi`
- nasconde catalogo completo
- nasconde ricerca globale
- nasconde modalità Aula/Docente
- nasconde strumenti docente/libreria
- impedisce `library/*`
- sidebar resta limitata alle assegnazioni
- corsi revocati rimossi dalla vista

Service worker cache aggiornata durante questi blocchi per evitare PWA stale.

## Stato dati amministrativi al momento del blocco

- 3 learners attivi
- 0 course editions
- 0 enrollments
- quindi nessun utente reale è stato contaminato dai test amministrativi

## Stato pubblicazione

NON ancora eseguito:
- candidate `course_versions` restano draft
- 36 test restano inattivi
- 22 Blueprint restano publication-blocked
- nessuna edizione candidate
- nessuna iscrizione candidate

Questo è voluto: il prossimo grande passaggio dopo QA amministrativo è il go-live controllato.

## Prossimi passi consigliati

1. Chiudere CI/Vercel del blocco Admin corrente.
2. QA end-to-end amministrativo senza email reali: edizione -> iscrizione -> visibilità learner -> gate -> revoca.
3. Definire/promuovere le candidate approvate a `published` senza toccare congelati.
4. Attivare i 36 test solo sulle versioni pubblicate.
5. Creare una vera edizione pilota e testarla con account corsista controllato.
6. Solo dopo: go-live per nuove edizioni.

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`

Ultimo commit applicativo al momento di questo aggiornamento: `0ce0f04aa2c1a09836ef808e1311ad0ff9a862c1` (`Add edition learner overview`).
