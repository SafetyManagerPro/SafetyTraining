> **ARCHIVIO STORICO, NON ARCHITETTURA ATTIVA (23 ottobre 2026).** Questo documento descrive l'ipotesi v19 di singolo database; **non va più usata come base di sviluppo**. In produzione SafetyManager Pro e SafetyTraining sono autonomi, hanno **due progetti Supabase e due sistemi Auth distinti**. La comunicazione è facoltativa tramite export/import manuale. Per regole correnti vedi `README.md`, `docs/START_HERE_COLLABORATORS.md` e `docs/SAFETYTRAINING_HANDOFF_LATEST.md`.

---

# Safety Platform v19 — architettura fondativa

## Decisione principale

Una sola piattaforma, un solo database Supabase e un solo sistema di autenticazione, con due front-end specializzati:

- **SafetyManager Pro**: aziende, corsisti, progetti, docenti, fascicoli, attestati, scadenze e amministrazione.
- **Safety Training**: aula, presentazioni, learning unit, e-learning interno, progressi, domande di comprensione e test.

Le due applicazioni non duplicano anagrafiche o corsi. Condividono le stesse identità e gli stessi record.

```text
                 SUPABASE / AUTH
                       │
       ┌───────────────┴───────────────┐
       │                               │
 SafetyManager Pro               Safety Training
 amministrazione                 didattica / LMS
       │                               │
       └──────────── dati unici ───────┘
```

## Riutilizzo del database esistente

Il progetto SafetyManagerPro possiede già le tabelle centrali. La v19 le considera fonte canonica:

- `enti` = organizzazioni / soggetti gestori;
- `aziende` = aziende clienti;
- `corsisti` = persone/corsisti, anche senza account;
- `docenti` = docenti;
- `progetti` = edizioni/progetti formativi gestionali;
- `iscrizioni` = iscrizioni amministrative;
- `training_sessions`, `session_attendance`, `session_attendance_events` = aula/presenze;
- `test_digitali` = evidenza test amministrativa già esistente;
- `normative_rule_sets` e `normative_training_rules` = motore normativo esistente.

Non vengono create copie di queste entità.

## Nuovo livello identità e multiutente

Le nuove tabelle `platform_*` collegano `auth.users` alle entità esistenti:

- un corsista può esistere senza login;
- quando serve l'e-learning, `platform_corsista_accounts` collega il suo record a un account Auth;
- un docente può avere un account tramite `platform_docente_accounts`;
- `platform_memberships` assegna più ruoli allo stesso utente e limita il perimetro a ente/azienda.

Ruoli iniziali: `super_admin`, `organization_admin`, `training_manager`, `teacher`, `tutor`, `company_admin`, `learner`.

## LMS interno, non certificante per impostazione predefinita

La v19 separa sempre **apprendimento** e **certificazione**. Un percorso può essere completato e superato senza essere dichiarato certificato.

Stati didattici:
`not_started → in_progress → completed → passed/failed`

Stati certificazione separati:
`not_applicable | not_certified | certifiable | certified`

Per la fase attuale l'impostazione predefinita è `not_certified`.

## Date senza vincolo di certificabilità

Ogni edizione LMS può essere:

- `immediate`: disponibile appena il corsista viene iscritto;
- `start_only`: parte da una data e non ha scadenza obbligatoria;
- `window`: disponibile tra due date;
- `manual`: apertura/chiusura decisa dall'amministratore.

`recommended_due_at` è una scadenza consigliata; `block_after_due=false` consente di continuare anche in ritardo.

## Learning Unit

Le 90 schede già costruite non diventano 90 corsi. Diventano **Learning Unit riutilizzabili**. Il contenuto completo resta versionato in `training_learning_unit_versions.content`.

Esempio: la Learning Unit “Rischio biologico” può essere impiegata in percorsi per operatori ecologici, polizia locale, verde, lavoratori rischio alto e RLS.

## Completamento di una Learning Unit

La piattaforma registra almeno:

1. contenuti obbligatori visualizzati;
2. tempo **attivo** e non semplice pagina aperta;
3. una o più interazioni;
4. domanda di comprensione, quando prevista;
5. esito e tentativi.

Il client invia heartbeat; dopo inattività o pagina nascosta il tempo non viene conteggiato. Il server conserva gli eventi e aggiorna il riepilogo.

## Corso dinamico

Il builder futuro usa:

`ATECO + mansione + attività + DVR/rischi reali → proposta di percorso`

L'ATECO non decide da solo il corso. La proposta deve essere validabile dall'operatore.

## Compatibilità con SafetyManager

Una `training_edition` può essere indipendente e quindi puramente didattica, oppure collegarsi a un `progetti.id`. Allo stesso modo una `training_enrollment` può essere indipendente oppure collegarsi a `iscrizioni.id`.

Questo consente subito percorsi interni liberi e, in futuro, integrazione con attestati/fascicoli senza rifare il modello dati.
