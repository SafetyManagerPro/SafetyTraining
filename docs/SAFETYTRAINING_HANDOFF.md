# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-17

Questo file è il riferimento persistente di SafetyTraining. Dopo OGNI modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF_LATEST.md`.

## Vincoli permanenti
NON sviluppare/modernizzare/finalizzare/pubblicare salvo richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB:
- 10 RSPP/ASPP esterni: `freeze_scope=external_rspp_aspp`
- 17 specialistici: `freeze_scope=user_out_of_roadmap_specialist`

`mod_cantieri` resta UN corso catalogo con due versioni role-specific. `company_admin` resta NON abilitato.

## Go-live didattico — COMPLETATO
- 60 `course_versions`
- 59 corsi distinti
- 290 `learning_unit_versions`
- 60/60 composizioni complete e verification path
- 36 test attivi
- 1.450 domande authored
- 660 test-question links
- soglia 70%
- 37 percorsi con gate pratico
- 73 requirement rows

## Amministrazione v21 — LIVE fino a v21_024
Migration recenti:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`
- `20261017161000_v21_023_preserve_current_company_training_history`
- `20261017180000_v21_024_fix_course_readiness_test_gate`

Restano attive v21_001–018: service layer admin, guardrail/RLS, evidence, SafetyManager governance, detail, scoped admin, membership e dedupe CF/PIVA.

## Admin UX v21.5 — LIST TOOLS LIVE
Commit funzionale: `bcfa4c565f0c595da6920a0e170ec69af801ccf3`.

Nuovi asset:
- `apps/training/admin-list-tools-v21.js`
- `apps/training/admin-list-tools-v21.css`

Il layer aggiunge senza cambiare schema/DB:
- ricerca dove non già presente;
- filtri contestuali;
- ordinamento per colonne utili;
- crescente/decrescente;
- reset;
- contatore risultati visibili/totali;
- persistenza dello stato per vista durante la sessione;
- occultamento delle sole card senza risultati nelle viste editoriali multi-tabella.

Copertura:
- Organizzazioni: filtro stato; sort nome/codice/stato.
- Aziende: filtri stato/organizzazione; sort azienda/organizzazione/P.IVA/ATECO/stato.
- Corsisti: filtri accesso/stato; sort corsista/azienda/organizzazione/mansione/stato.
- Corsi: filtri famiglia/governance/stato; sort corso/famiglia/durata/versione/stato.
- Edizioni: filtri stato/azienda; sort edizione/corso/azienda/stato/disponibilità.
- Iscrizioni: filtro stato; sort corsista/percorso/stato/progresso/ultima attività.
- Catalogo SafetyManager: ricerca + filtro stato + sort corso/codice/durata/stato.
- Blueprint/Master Registry: ricerca + filtro sviluppo + sort corso/blueprint-regola/profilo.
- Readiness: ricerca + filtro stato + sort corso/stato/struttura.

Le ricerche core admin esistenti vengono riusate, non duplicate. Nessun MutationObserver globale è stato introdotto: il layer reagisce a eventi espliciti e usa retry temporizzati limitati dopo i rendering.

## Responsive v21.5
`admin-list-tools-v21.css` integra `admin-responsive-v21.css`:
- toolbar wrap desktop;
- stacking a `<=860px`;
- griglia mobile a `<=560px`;
- controlli touch da almeno ~42px;
- tabelle sempre contenute in wrapper scrollabili;
- restano attivi breakpoints 1100/860/560/390, modali adattive, bottom-sheet mobile e safe-area.

## Smoke v21.5
### CI
GitHub Actions:
- workflow `SafetyTraining checks`
- run #296 / id `39049749400`
- SHA `bcfa4c565f0c595da6920a0e170ec69af801ccf3`
- SUCCESS.

### Vercel production
- deployment `dpl_8AzDcSTka84DrZyFkA2YUedd5XwH`
- target production
- state READY
- alias `safety-training-safety-manager.vercel.app`.

### HTTP production smoke
HTTP 200 confermati per:
- `/index.html` con `admin-list-tools-v21.css` e `.js` inclusi;
- `/admin-list-tools-v21.js` v21.5;
- `/admin-list-tools-v21.css` v21.5;
- `/sw.js` con `CACHE='safety-training-v21-12'` e nuovi asset nell'app shell.

### Smoke strutturale
Audit su markup/config di:
- amministrazione core;
- Catalogo SafetyManager;
- Blueprint/Master Registry;
- Readiness;
- CSS responsive.
Titoli e header attesi da filtri/sort risultano coerenti con le tabelle renderizzate nei file verificati.

Limite: da questa chat non è disponibile un browser interattivo per eseguire realmente click/screenshot a 1440/820/390. È quindi completato lo smoke strutturale + produzione HTTP, ma NON va dichiarato completato il visual smoke reale multi-viewport.

## Admin UX v21.4 — ancora vigente
### Organizzazioni
- `+ Nuova organizzazione` per platform admin;
- creazione/modifica via `admin_save_organization`;
- edit mostra nome, codice, stato, ID, timestamp.

### Aziende
Edit completo dei campi correnti `companies`; normalizzati e metadata restano read-only.

### Corsisti
Campo unico `Cognome/Nome`, coerente con SafetyManager `full_name`:
- legacy Nome+Cognome riunito;
- `metadata.source_full_name` prevale se presente;
- save in `first_name`, `last_name=null` senza migrazione distruttiva.

### Edizioni
`Disattiva` archivia via `admin_update_edition(status='archived')`; nessuna cancellazione fisica di iscrizioni/progressi/audit/storico.

### Guide
Restano attive spiegazioni contestuali di Catalogo SafetyManager, Percorso SafetyTraining, Learning Unit preview, Master Registry, Blueprint, varianti/regole, libreria/profili, moduli e Readiness.

## Readiness v21_024
Il gate usa test attivi e domande attive collegate; NON il legacy `bank_required`.

Stato verificato:
- totale 92
- published 65
- ready_for_review 22
- needs_configuration 2
- ready_for_publish 0
- blocked 3

Blocked intenzionali/frozen:
1. `amb_confinati` — `user_out_of_roadmap_specialist`
2. `rspp_aspp_a` — `external_rspp_aspp`
3. `rspp_aspp_b` — `external_rspp_aspp`

Non sbloccarli per portare il contatore a zero.

## Storico azienda learner — v21_023 LIVE
Regola definitiva:
- `learners.company_id` = azienda corrente;
- company storica corso/enrollment = `learner_company_training_history`;
- import SafetyManager storico non deve riassegnare la company corrente.

## Inviti / import — LIVE
Inviti personali multicanale: email, WhatsApp, SMS, manuale, QR. Token raw solo all'emissione, SHA-256 persistito, monouso, scadenza/revoca, identity verification obbligatoria.

Bulk/import:
- `admin_company_bulk_context(company_id)`;
- preview import max 500;
- `existing_other_company` richiede collegamento esplicito;
- nessuna riassegnazione nascosta della company corrente.

## SafetyManager bridge v1.2 — invariato
SafetyManager continua a esportare `full_name` unico, azienda/progetto/corso, rischi e iscritti; niente documenti, firme, dati sanitari o credenziali. Mismatch company corrente/progetto resta warning storico, non hard error.

## Sicurezza / invarianti
- CF/PIVA unique solo tenant-scoped.
- Non divulgare duplicate identity cross-tenant.
- service_role solo server-side.
- Authorization mai da user_metadata.
- No password su WhatsApp/SMS.
- Raw invitation token mai persistito/loggato.
- Identity verification claim obbligatoria.
- Preservare fix RLS recursion.
- `learners.company_id` è current company, non storico corso.
- Nessuna pubblicazione automatica di contenuti/corsi.
- Non reintrodurre MutationObserver/polling globale nell'admin.
- `company_admin` resta disabilitato.

## Produzione corrente
- PWA `safety-training-v21-12`
- latest functional: `bcfa4c565f0c595da6920a0e170ec69af801ccf3`
- GitHub Actions #296 SUCCESS
- Vercel: `dpl_8AzDcSTka84DrZyFkA2YUedd5XwH`, production READY
- alias: `safety-training-safety-manager.vercel.app`

I commit successivi di solo handoff/documentazione NON sostituiscono questo SHA come latest functional.

## Prossimi passi esatti
1. Visual browser smoke reale a circa 1440 / 820 / 390 px su Dashboard, Organizzazioni, Aziende, Corsisti, Edizioni, Catalogo SafetyManager, Blueprint, Readiness e reader didattico.
2. Correggere eventuali difetti visuali/interaction e ripetere.
3. E2E learner non-platform: invito → delivery → Auth → verifica identità → claim → dashboard → replay rejected → cleanup.
4. Onboarding scoped admin `organization_admin|training_manager`.
5. `company_admin` resta disabilitato.

## Servizi
- GitHub SafetyTraining: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `prj_u0IT97WJ3ARGJJUhuYUWA6MyS24U`
- produzione: `safety-training-safety-manager.vercel.app`
