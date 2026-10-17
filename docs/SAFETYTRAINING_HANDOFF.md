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

## Amministrazione v21 — live fino a v21_022
Ultime migration:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`

Restano attive v21_001–018: service layer admin, guardrail/RLS, evidence, SafetyManager governance, detail, scoped admin, membership e dedupe CF/PIVA.

### Anti-doppioni
- P.IVA e CF azienda normalizzati e unique tenant-scoped.
- CF learner normalizzato e unique tenant-scoped.
- `admin_registry_conflict()` = preflight UI; DB/RPC resta source of truth.
- Non rendere mai CF/PIVA global unique tra tenant.

## Inviti corsisti multicanale — LIVE
Canali: email, WhatsApp, SMS, copia link, QR personale.

Token:
- 32 byte random / 64 hex
- raw solo all'emissione, SHA-256 nel DB
- monouso, scadenza 1–720h, revocabile/rigenerabile
- nessun DML browser diretto sulla tabella inviti

RPC principali:
- `admin_set_learner_contact`
- `admin_issue_learner_invite`
- `admin_record_learner_invite_delivery`
- `admin_revoke_learner_invite`
- `learner_invite_public_info(token)`
- `claim_learner_invite(token, identity_value)`

Verifica identità: CF → email → ultime 4 telefono → manual review.
Email riusa `invite-learner` v2 con `verify_jwt=true`; WhatsApp/SMS sono handoff client/deep-link, non provider server.

## Bulk azienda / import CSV-XLSX — LIVE
- `admin_company_bulk_context(company_id)`
- UI `Accessi & import`
- bulk enrollment tramite `admin_bulk_enroll()`
- max 100 inviti UI per operazione
- preview import max 500 righe
- classificazioni: `create`, `existing_same_company`, `existing_other_company`, `duplicate_in_file`, `needs_review`, `invalid`
- azioni: `create`, `create_reviewed`, `reuse`, `link`, `skip`
- learner esistente in altra azienda richiede `link` esplicito nel flusso CSV/XLSX.

Nota modello: `learners.company_id` rappresenta una sola azienda corrente; non esiste ancora storico formale learner↔aziende.

## Frontend SafetyTraining
Principali moduli attivi:
- `apps/training/admin-access-import-v21.js` v21.3
- `apps/training/learner-invite-activation-v21.js` v21.3
- `admin-registry-dedup-v21.js`
- `admin-backend-v21.js`
- `admin-details-v21.js`
- `requirement-evidence-admin-v21.js`
- `admin-capabilities-v21.js`
- `admin-memberships-v21.js`
- `course-catalog-governance-v21.js`

PWA SafetyTraining: `safety-training-v21-9`.

## SafetyManager → SafetyTraining bridge v1.2 — LIVE + E2E VERDE
Repo sorgente: `SafetyManagerPro/SafetyManager`.

SafetyManager produce `safetytraining.transfer` v1.2 con:
- azienda + P.IVA/CF normalizzato + ATECO + indirizzo/sede;
- progetto/corso + durata + norma + modalità + date + sede + presenza/pratica;
- contesto fabbisogni/rischi;
- corsisti iscritti + enrollment external ID + CF normalizzato + mansione;
- nessun documento/firma/dato sanitario/credenziale;
- nessuna email/telefono inventati.

Controlli SafetyManager:
- blocco su identificativi essenziali/CF mancanti;
- blocco su CF duplicato nello stesso progetto;
- mismatch azienda corrente learner vs azienda progetto = warning storico, non blocco.

QA dati reali SafetyManager in sola lettura:
- 72 progetti con azienda + corso;
- 138 iscrizioni;
- 0 aziende senza P.IVA/CF;
- 0 corsisti senza CF;
- 0 CF duplicati nello stesso progetto;
- 40 mismatch azienda corrente/progetto gestiti come storico/warning.

### Importer SafetyTraining
`import_safetymanager_package(jsonb)`:
- richiede platform admin;
- accetta `schema_version` `1.x`, incluso v1.2;
- mapping idempotenti per company, learner, project, enrollment;
- dedupe azienda via P.IVA/CF e learner via CF/email;
- course code sconosciuto => placeholder tecnico draft `needs_configuration`;
- enrollment dedupe tramite external mapping e fallback `(edition_id, learner_id)`.

Nessuna migration SafetyTraining è stata necessaria per v1.2.

### E2E transazionale doppio import
Payload QA v1.2 importato due volte nella stessa transazione.

Primo import:
- `created_company=1`
- `created_learners=1`
- `created_edition=1`
- `created_enrollments=1`
- `created_placeholder_course=1`
- `reused_enrollments=0`.

Secondo import identico:
- stessi company/course/edition ID;
- tutti i contatori `created_*` = 0;
- `reused_enrollments=1`;
- `updated_or_reused_learners=1`.

Conclusione: idempotenza/dedupe verificati. Dopo `ROLLBACK`, controllo separato = 0 mapping QA, 0 aziende QA, 0 learner QA, 0 catalog rows QA.

### Produzione SafetyManager verificata
Vercel:
- deployment `dpl_2bAGCma5NeQVgv2L49rdhZ2yaZVm`
- commit `3cc579b80dbec9c1cc68e4158ce2c0c3fe592175`
- production / `READY`
- alias `safety-manager-ultimate-safety-manager.vercel.app`.

Smoke live HTTP 200:
- `app.js` carica direttamente il bridge;
- bridge live è v1.2 e contiene warning storico;
- `sw.js` live = `safetymanager-pwa-v11` con bridge in APP_SHELL.

Il precedente limite Hobby `api-deployments-free-per-day` non blocca più questo deploy.

## Punto di hardening emerso
`import_safetymanager_package()` oggi, quando riusa un learner esistente, imposta `learners.company_id` all'azienda del progetto importato. Poiché SafetyManager può esportare un progetto storico e SafetyTraining usa `company_id` come azienda corrente, questo comportamento può trasformare un datore storico nel datore corrente. Non correggere alla cieca: prossimo blocco consigliato = preservare la company corrente o introdurre storico learner↔azienda, mantenendo idempotenza e compatibilità.

## QA inviti v21_019–022
Già verificati con rollback: contatti, hash token, public info mascherata, wrong identity, revoca, claim, one-time, import preview/apply, bulk enrollment, 0 DML browser inviti, residui QA 0.
Bug v21_022 corretto: con `search_path=''`, usare `extensions.gen_random_bytes` e `extensions.digest`.

## Ruoli
- `platform_admin`: globale
- `organization_admin`: scoped
- `training_manager`: scoped; aziende read-only, training gestibile
- `company_admin`: NON abilitato

Membership v21_016 resta platform-only; account Auth target deve preesistere.

## Advisor Supabase
Non auto-fixare senza blocco dedicato:
- SECURITY DEFINER authenticated previsti con authorization server-side
- warning anon SECURITY DEFINER su `learner_invite_public_info` intenzionale e minimizzato
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy `training_blueprint_rules` non indicizzata

## Produzione SafetyTraining
Supabase live fino a `v21_022`.
SafetyTraining functional commit verificato: `74cbf21fcab2581551f8fa8587474695841f1598`; Actions `SafetyTraining checks` #275 SUCCESS.
Vercel functional: `dpl_EejAje6W4zzx6RSkYshpeNDNMP6U`, production READY, alias `safety-training-safety-manager.vercel.app`, PWA `safety-training-v21-9`.

## Prossimi passi esatti
1. Hardening storico azienda nel bridge importer SafetyTraining: non sovrascrivere impropriamente `learners.company_id` con un'azienda storica.
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
