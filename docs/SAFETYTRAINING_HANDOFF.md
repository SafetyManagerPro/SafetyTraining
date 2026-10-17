# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-17

Questo file è la fonte rapida di ripartenza quando si cambia chat. Dopo OGNI modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF_LATEST.md`.

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

## Go-live didattico v20 — COMPLETATO
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

## Amministrazione v21 — LIVE fino a v21_023
Ultime migration:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`
- `20261017161000_v21_023_preserve_current_company_training_history`

Restano attive v21_001–018: service layer admin, guardrail/RLS, evidence, SafetyManager governance, detail, scoped admin, membership e dedupe CF/PIVA.

### Anti-doppioni
- P.IVA e CF azienda normalizzati e unique tenant-scoped.
- CF learner normalizzato e unique tenant-scoped.
- `admin_registry_conflict()` = preflight UI; DB/RPC resta source of truth.
- Non rendere mai CF/PIVA global unique tra tenant.

## Storico azienda learner — v21_023 LIVE
`learners.company_id` rappresenta l'azienda corrente del learner e NON deve essere retrocessa da un import di progetto storico.

Nuova tabella:
- `learner_company_training_history`
- una riga per enrollment, con organization, learner, company storica del corso, edition, enrollment, periodo e riferimenti SafetyManager.
- RLS: platform admin oppure admin scoped sulla stessa organization.

Importer SafetyManager:
- il precedente importer è conservato internamente come `import_safetymanager_package_v21_legacy(jsonb)` senza EXECUTE pubblico/browser;
- il nuovo `import_safetymanager_package(jsonb)` salva l'azienda corrente dei learner già esistenti, esegue l'import legacy, ripristina la company corrente se il progetto era storico e registra la company del corso nello storico formale;
- restituisce anche `preserved_current_company` e `training_company_history_rows`.

RPC di lettura:
- `admin_learner_company_history(p_learner_id)` restituisce azienda corrente + storico training company, con authorization server-side.

QA reale transazionale:
- learner esistente con company corrente `COMUNE DI SAN MARTINO VALLE CAUDINA`;
- import di progetto storico con `G. & G. AUTO SERVICE S.A.S. DI NATALE GAETANO & C.`;
- `preserved_current_company=1`;
- company corrente dopo import invariata sul Comune;
- storico corso correttamente registrato su G. & G. Auto Service;
- `training_company_history_rows=1`;
- rollback finale;
- controllo post-rollback: 0 mapping QA, 0 catalog QA, 0 history QA.

Il problema azienda storica→corrente è quindi CHIUSO.

## Dashboard amministrativa — stabilizzata
Diagnosi 2026-10-17:
- le query DB della dashboard, simulate con ruolo authenticated/platform admin, rispondono correttamente;
- il problema non era un blocco dei dati;
- `admin-backend-v21.js` usava un `MutationObserver` globale che poteva richiamare ripetutamente `enhance()` mentre lo stesso enhance mutava il DOM, producendo refresh/server call ricorsive e la sensazione di caricamento infinito.

Fix live in `apps/training/admin-backend-v21.js` v21.3:
- rimosso il `MutationObserver` globale;
- refresh solo su eventi espliciti: apertura console, refresh, cambio tab, jump dashboard, auth state e rerender amministrativo;
- `enhanceSeq` scarta risposte stale/concorrenziali;
- dashboard alimentata/fallback tramite UNA sola RPC `admin_dashboard_summary()`;
- se il renderer legacy resta sul loader, il layer v21 sostituisce il loader con lo snapshot server-side;
- activity audit via `admin_recent_actions()` solo quando serve.

PWA SafetyTraining aggiornata a `safety-training-v21-10`, con JS/CSS/HTML network-first, così il browser non resta bloccato sul vecchio admin JS.

## Inviti corsisti multicanale — LIVE
Canali: email, WhatsApp, SMS, copia link, QR personale.
Token raw solo all'emissione, SHA-256 nel DB, monouso, scadenza/revoca. Claim Auth + identity verification obbligatoria. Nessun DML browser diretto sulla tabella inviti.

## Bulk azienda / import CSV-XLSX — LIVE
- `admin_company_bulk_context(company_id)`
- UI `Accessi & import`
- bulk enrollment tramite `admin_bulk_enroll()`
- preview import max 500 righe
- `existing_other_company` richiede `link` esplicito nel flusso standard.

## SafetyManager → SafetyTraining bridge v1.2 — LIVE + E2E VERDE
SafetyManager produce `safetytraining.transfer` v1.2 con azienda, corso/progetto, date/sede, rischi e iscritti, senza documenti/firme/dati sanitari/credenziali.
Mismatch azienda corrente/progetto = warning storico, non blocco.

QA SafetyManager in sola lettura:
- 72 progetti con azienda + corso
- 138 iscrizioni
- 0 aziende senza P.IVA/CF
- 0 corsisti senza CF
- 0 CF duplicati nello stesso progetto
- 40 mismatch azienda corrente/progetto gestiti come storico.

E2E doppio import precedente: idempotenza e dedupe verificati, rollback pulito.
Con v21_023 è stato aggiunto e verificato anche il caso learner esistente con altra azienda corrente.

## Produzione SafetyManager
Vercel `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`, commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`, production READY. Bridge v1.2 e PWA `safetymanager-pwa-v11` verificati live.

## Produzione SafetyTraining — stato corrente
Supabase live fino a `v21_023`.

Commit funzionali del blocco:
- `23e1822bb10a5395e4148e66dcfbe0e50e1a19b5` — migration/history v21_023
- `db5d7da2b04c040eff71a321b8271979044907b8` — stabilizzazione dashboard admin
- `e74418900ec0cb5e19b12441e3ebe90839cb3ae0` — PWA v21-10

GitHub Actions:
- SafetyTraining checks #283 SUCCESS sul fix dashboard
- SafetyTraining checks #284 SUCCESS sul PWA bump.

Vercel production più recente funzionale:
- `dpl_D4APzr14W8puJLePb4HDgiHKvrtP`
- commit `e74418900ec0cb5e19b12441e3ebe90839cb3ae0`
- target production
- `READY`
- alias `safety-training-safety-manager.vercel.app`.

Smoke live:
- `/admin-backend-v21.js` HTTP 200, v21.3, nessun MutationObserver, snapshot `admin_dashboard_summary()`;
- `/sw.js` HTTP 200, cache `safety-training-v21-10`.

## Advisor Supabase
Dopo v21_023 nessun nuovo problema di RLS mancante.
Restano warning noti da non auto-fixare alla cieca:
- `learner_invite_public_info` anon SECURITY DEFINER intenzionale/minimizzato;
- RPC authenticated SECURITY DEFINER con authorization server-side;
- leaked password protection disabilitato.

## Prossimi passi esatti
1. Verifica browser con sessione admin reale della console dopo aggiornamento PWA v21-10; backend, dati e asset production sono già verificati.
2. Poi E2E learner non-platform: invito → delivery → Auth → verifica identità → claim → dashboard.
3. Onboarding/invito dedicato per `organization_admin|training_manager`; membership resta source of truth.
4. `company_admin` resta disabilitato.
5. Aggiornare SEMPRE entrambi gli handoff.

## Servizi
- GitHub SafetyTraining: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel SafetyTraining: `safety-training`
- produzione SafetyTraining: `safety-training-safety-manager.vercel.app`
- GitHub SafetyManager: `SafetyManagerPro/SafetyManager`
- produzione SafetyManager: `safety-manager-ultimate-safety-manager.vercel.app`
