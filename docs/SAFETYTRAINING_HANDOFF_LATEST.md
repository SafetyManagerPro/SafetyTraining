# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend SafetyTraining live fino a `v21_022`; bridge SafetyManager v1.2 LIVE in produzione; doppio import E2E idempotente VERDE con rollback pulito.

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

Inviti multicanale LIVE: email, WhatsApp, SMS, copia link, QR; token SHA-256 monouso, revoca/scadenza, activation via Auth + identity check.
Bulk azienda e import CSV/XLSX LIVE; dedupe CF/PIVA tenant-scoped; `existing_other_company` richiede link esplicito nel flusso import standard.
PWA SafetyTraining: `safety-training-v21-9`.

# ULTIMO BLOCCO CHIUSO — SafetyManager → SafetyTraining v1.2

## SafetyManager sorgente e produzione
Repo: `SafetyManagerPro/SafetyManager`.
Bridge `js/modules/safetytraining_bridge.js`:
- `safetytraining.transfer` v1.2;
- direct startup load da `js/app.js`;
- pulsante globale + pulsante nella scheda progetto;
- normalizzazione P.IVA/CF e CF learner;
- blocco su dati essenziali mancanti e CF duplicati;
- mismatch azienda corrente learner/progetto = warning storico;
- esporta azienda, corso/progetto, date/sede, rischi e iscritti;
- niente documenti/firme/dati sanitari/credenziali;
- niente email/telefono inventati.

QA SafetyManager reale:
- 72 progetti con azienda/corso
- 138 iscrizioni
- 0 aziende senza P.IVA/CF
- 0 corsisti senza CF
- 0 CF duplicati nel progetto
- 40 mismatch azienda corrente/progetto gestiti come storico.

## Importer SafetyTraining
`import_safetymanager_package(jsonb)` accetta tutti i `1.x` e richiede platform admin.
Comportamento verificato:
- company mapping + fallback P.IVA/CF;
- learner mapping + fallback CF/email;
- project→edition mapping;
- enrollment mapping + fallback `(edition_id, learner_id)`;
- course code sconosciuto → placeholder draft `needs_configuration`;
- receipt su export UUID valido.

Nessuna migration SafetyTraining necessaria per v1.2.

## E2E doppio import — VERDE
Payload QA v1.2 importato due volte nella stessa transazione.

Primo import:
- created_company 1
- created_learners 1
- created_edition 1
- created_enrollments 1
- created_placeholder_course 1
- reused_enrollments 0.

Secondo import identico:
- stessi company/course/edition ID
- tutti `created_*` = 0
- reused_enrollments 1
- updated_or_reused_learners 1.

Idempotenza/dedupe quindi confermati. Rollback finale; query separata post-rollback: 0 mapping QA, 0 aziende QA, 0 learner QA, 0 righe catalogo QA.

## Produzione SafetyManager — LIVE verificata
Vercel:
- deployment `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`
- target production
- `READY`
- alias `safety-manager-ultimate-safety-manager.vercel.app`.

Smoke live HTTP 200:
- `/js/app.js`: direct load del bridge presente;
- `/js/modules/safetytraining_bridge.js`: v1.2 e warning storico presenti;
- `/sw.js`: `safetymanager-pwa-v11`, bridge nella APP_SHELL.

Il precedente blocco Vercel Hobby `api-deployments-free-per-day` è superato per questo deploy.

## Punto tecnico emerso da affrontare PRIMA di ulteriore automazione
L'importer SafetyManager oggi, quando trova un learner esistente, assegna `learners.company_id` all'azienda del progetto importato. Ma un progetto SafetyManager può essere storico mentre `learners.company_id` in SafetyTraining rappresenta l'azienda corrente. Questo può retrocedere impropriamente la company corrente a un datore storico.

Prossimo blocco raccomandato:
1. correggere in modo compatibile questa semantica (preservare company corrente oppure introdurre storico learner↔azienda);
2. mantenere idempotenza, dedupe tenant-scoped e mapping esterni;
3. QA esplicito su learner esistente in altra azienda e progetto storico;
4. aggiornare entrambi gli handoff SafetyTraining e SafetyManager.

Dopo: E2E learner non-platform invito → delivery → Auth → identità → claim → dashboard.

## Produzione SafetyTraining
Supabase live v21_022.
Functional commit SafetyTraining verificato: `74cbf21fcab2581551f8fa8587474695841f1598`; Actions #275 SUCCESS.
Vercel functional `dpl_EejAje6W4zzx6RSkYshpeNDNMP6U`, production READY, alias `safety-training-safety-manager.vercel.app`.

## Regole da non perdere
- non global-unique CF/PIVA;
- non divulgare duplicate identity di altri tenant;
- service_role solo server side;
- authorization mai da user_metadata;
- company_admin disabilitato;
- frozen courses intatti;
- no password su WhatsApp/SMS;
- raw invitation token mai persistito/auditato;
- identity verification claim obbligatoria;
- preservare fix RLS recursion.
