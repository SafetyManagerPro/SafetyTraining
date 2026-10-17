# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend SafetyTraining LIVE fino a `v21_023`; dashboard amministrativa stabilizzata e PWA `safety-training-v21-10` LIVE; storico azienda learner formalizzato e import storico verificato.

> Fonte operativa più recente. Dopo ogni modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF.md`.

## Vincoli permanenti
NON sviluppare/modernizzare/finalizzare/pubblicare senza richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB: 10 RSPP/ASPP esterni `external_rspp_aspp`; 17 specialistici `user_out_of_roadmap_specialist`.
`mod_cantieri` resta UN corso con due versioni role-specific. `company_admin` resta NON abilitato.

## Stato SafetyTraining
Go-live didattico completato: 60 versioni / 59 corsi / 290 LU / 36 test / 1.450 domande / 660 link domanda-test / 37 gate pratici / 73 requirement rows.

DB live fino a:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`
- `20261017161000_v21_023_preserve_current_company_training_history`

Inviti multicanale LIVE: email, WhatsApp, SMS, copia link, QR; token SHA-256 monouso, revoca/scadenza, activation via Auth + identity check.
Bulk/import LIVE; dedupe CF/PIVA tenant-scoped.

# ULTIMO BLOCCO CHIUSO — storico azienda + dashboard admin

## v21_023 — azienda corrente separata dallo storico training
Regola definitiva:
- `learners.company_id` = azienda corrente;
- l'azienda del corso/iscrizione storico vive in `learner_company_training_history`;
- importare un vecchio progetto SafetyManager NON deve cambiare la company corrente di un learner già esistente.

Nuovo backend:
- tabella `learner_company_training_history` con una riga per enrollment;
- backfill degli enrollment già esistenti con company dell'edizione;
- nuovo wrapper `import_safetymanager_package(jsonb)` che preserva l'azienda corrente e registra la company storica;
- legacy importer rinominato `import_safetymanager_package_v21_legacy(jsonb)` e non esposto al browser;
- RPC `admin_learner_company_history(p_learner_id)` scoped per leggere current company + storico.

### QA reale — VERDE
Usato un learner reale già esistente:
- current company: `COMUNE DI SAN MARTINO VALLE CAUDINA`;
- import storico da `G. & G. AUTO SERVICE S.A.S. DI NATALE GAETANO & C.`.

Esito:
- import ok;
- `preserved_current_company=1`;
- current company finale ancora Comune;
- storico training company = G. & G. Auto Service;
- `training_company_history_rows=1`;
- rollback finale;
- residui QA post-rollback: 0 mapping, 0 catalog, 0 history.

Il problema di sovrascrittura azienda corrente è CHIUSO.

## Dashboard amministrativa — causa e fix
Le query DB originali della dashboard sono state simulate con ruolo authenticated/platform admin e rispondono correttamente. Il problema non era nei dati.

Causa frontend individuata:
- `admin-backend-v21.js` aveva un `MutationObserver` globale;
- ogni mutazione DOM poteva rischedulare `enhance()`;
- `enhance()` interrogava il backend e poteva mutare nuovamente il DOM;
- risultato possibile: refresh ripetuti, server call concorrenti e console apparentemente bloccata sul caricamento.

Fix `admin-backend-v21.js` v21.3:
- rimosso completamente il MutationObserver globale;
- refresh solo su apertura console, pulsante refresh, cambio tab, jump dashboard, auth state e rerender esplicito;
- sequence guard `enhanceSeq` contro risposte stale;
- dashboard snapshot/fallback tramite UNA RPC `admin_dashboard_summary()`;
- se il renderer legacy resta sul loader, il backend bridge sostituisce il loader con lo snapshot autorizzato;
- activity audit caricato solo nella tab dedicata.

## PWA / cache
PWA aggiornata a `safety-training-v21-10` per espellere il JS precedente.
JS/CSS/HTML sono network-first.

## Produzione SafetyTraining
Commit funzionali:
- `23e1822bb10a5395e4148e66dcfbe0e50e1a19b5` — v21_023 storico company
- `db5d7da2b04c040eff71a321b8271979044907b8` — dashboard loading fix
- `e74418900ec0cb5e19b12441e3ebe90839cb3ae0` — PWA v21-10

GitHub Actions:
- checks #283 SUCCESS
- checks #284 SUCCESS.

Vercel production funzionale:
- `dpl_D4APzr14W8puJLePb4HDgiHKvrtP`
- commit `e74418900ec0cb5e19b12441e3ebe90839cb3ae0`
- READY / production
- alias `safety-training-safety-manager.vercel.app`.

Smoke live:
- `/admin-backend-v21.js` HTTP 200 con v21.3, summary RPC unica e nessun MutationObserver;
- `/sw.js` HTTP 200, `safety-training-v21-10`.

## SafetyManager bridge v1.2
SafetyManager production resta `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`, READY, bridge v1.2 e PWA v11 live.
Il doppio import E2E precedente resta verde/idempotente. Con v21_023 è verde anche il caso storico learner già associato ad altra azienda corrente.

## Advisor Supabase
Dopo v21_023 nessun nuovo finding di RLS mancante.
Restano warning noti:
- `learner_invite_public_info` anon SECURITY DEFINER intenzionale;
- RPC authenticated SECURITY DEFINER con authorization interna;
- leaked password protection disabilitato.
Non auto-fixare il gruppo senza blocco dedicato.

## Prossimo passo esatto
1. Smoke della console con sessione browser admin reale dopo aggiornamento del service worker v21-10. Backend, DB e asset live sono già verificati.
2. E2E learner non-platform: invito → delivery → Auth → identità → claim → dashboard.
3. Onboarding scoped admin `organization_admin|training_manager`.
4. `company_admin` resta disabilitato.

## Regole da non perdere
- CF/PIVA unique solo tenant-scoped;
- non divulgare duplicate identity cross-tenant;
- service_role solo server-side;
- authorization mai da user_metadata;
- no password su WhatsApp/SMS;
- raw invitation token mai persistito;
- identity verification claim obbligatoria;
- preservare fix RLS recursion;
- `learners.company_id` è current company, non storico corso.
