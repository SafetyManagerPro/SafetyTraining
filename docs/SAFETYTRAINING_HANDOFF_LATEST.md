# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend SafetyTraining live fino a `v21_022`; frontend/PWA SafetyTraining `safety-training-v21-9` live. Bridge sorgente SafetyManager v1.2 completato su `main`, ma deploy SafetyManager completo pendente per limite giornaliero Vercel Hobby.

> Fonte operativa più recente. Dopo ogni modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF.md`.

## Vincoli permanenti
NON sviluppare/modernizzare/finalizzare/pubblicare senza richiesta esplicita:
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

## Go-live didattico
Completato: 60 versioni / 59 corsi / 290 LU / 36 test / 1.450 domande / 660 link domanda-test / 37 percorsi gate pratico / 73 requirement rows.

## DB v21 — ultimo blocco live
Migration:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`

Restano attivi v21_001–018 inclusi service layer admin, RLS/guardrail, evidence, SafetyManager governance, scoped admin, membership e dedupe CF/PIVA.

## Inviti corsisti multicanale — COMPLETATO
Canali: Email, WhatsApp, SMS, Copia link, QR personale.

Token:
- 32 byte random / 64 hex
- raw solo all’emissione, SHA-256 nel DB
- monouso, scadenza 1–720h, revocabile/rigenerabile
- no DML browser diretto sulla tabella inviti

RPC admin:
- `admin_set_learner_contact`
- `admin_issue_learner_invite`
- `admin_record_learner_invite_delivery`
- `admin_revoke_learner_invite`

Activation:
- `learner_invite_public_info(token)` anon/authenticated con dati minimi mascherati
- `claim_learner_invite(token, identity_value)` authenticated-only
- verifica CF → email → ultime 4 telefono → manual review
- claim consuma token e collega `auth_user_id`

Email riusa Edge Function `invite-learner` v2 `verify_jwt=true`. WhatsApp usa deep link, SMS `sms:`, QR/copy link condividono lo stesso token personale.

## Azienda con molti corsisti / bulk — COMPLETATO
RPC `admin_company_bulk_context(company_id)`.
UI `Accessi & import`: azienda, corsisti, stato account/invito, select all, edizione, iscrivi, invita, iscrivi+invita, canale/scadenza.
Bulk enrollment passa da `admin_bulk_enroll()`. Limite UI inviti massivi 100.

Nota: learner ha una sola `company_id` corrente; non esiste ancora storico formale learner↔aziende.

## Import CSV / Excel — COMPLETATO
Frontend `admin-access-import-v21.js`:
- CSV comma/semicolon/tab
- XLS/XLSX via SheetJS
- Nome, Cognome, Email, Telefono/Cellulare, CF/Codice fiscale, Mansione/Ruolo

Backend:
- `admin_import_learners_preview(company_id, rows)` max 500
- `admin_import_learners_apply(company_id, rows, source)`

Classificazioni: `create`, `existing_same_company`, `existing_other_company`, `duplicate_in_file`, `needs_review`, `invalid`.
Azioni: `create`, `create_reviewed`, `reuse`, `link`, `skip`.
Dedupe usa CF normalizzato nell’intera organizzazione; altra azienda richiede `link` esplicito.

## Frontend SafetyTraining corrente
- `apps/training/admin-access-import-v21.js` v21.3
- `apps/training/learner-invite-activation-v21.js` v21.3
- `admin-registry-dedup-v21.js`
- `admin-backend-v21.js`
- `admin-details-v21.js`
- `requirement-evidence-admin-v21.js`
- `admin-capabilities-v21.js`
- `admin-memberships-v21.js`
- `course-catalog-governance-v21.js`

PWA SafetyTraining `safety-training-v21-9`.

## QA v21_019–022 — VERDE con rollback
Verificati: contatti, hash token, public info mascherata, wrong identity, revoca, claim, one-time, classi import, import apply create/reuse/link, bulk enrollment RPC, 0 DML browser inviti, residui QA 0.

Bug v21_022: con `search_path=''`, pgcrypto richiede `extensions.gen_random_bytes` e `extensions.digest`.

## Ruoli
- platform_admin: globale
- organization_admin: scoped
- training_manager: scoped; aziende read-only, resto training gestibile
- company_admin: NON abilitato

Membership admin resta platform-only e richiede Auth account preesistente.

# ULTIMO BLOCCO: SafetyManager → SafetyTraining bridge v1.2

## Sorgente SafetyManager
Repo: `SafetyManagerPro/SafetyManager`.

Il bridge preesistente `js/modules/safetytraining_bridge.js` è stato completato e reso indipendente dal loader grafico.

Funzioni ora nel sorgente `main`:
- `safetytraining.transfer` `schema_version:'1.2'`;
- azienda con external ID, ragione sociale, P.IVA/CF normalizzato, ATECO, indirizzo/sede;
- progetto con external ID, codice, course code/title, durata, norma, modalità, date, sede, presenza/pratica;
- contesto settore/rischi/fabbisogni;
- corsisti iscritti con external ID, enrollment external ID, nome, CF normalizzato, mansione;
- nessuna email/telefono inventati perché `corsisti` SafetyManager non contiene tali colonne;
- nessun documento, firma, dato sanitario o credenziale.

Validazione:
- blocco su azienda/identificativo fiscale/corso/corsisti/CF mancanti;
- blocco su CF duplicato nello stesso progetto;
- P.IVA normalizzata uppercase/alphanumeric, prefisso `IT` rimosso davanti a 11 cifre;
- CF uppercase/alphanumeric;
- se l’azienda corrente del learner differisce dall’azienda storica del progetto: warning, non errore.

UI:
- pulsante globale SafetyTraining nella navbar;
- pulsante contestuale nella scheda progetto con progetto pre-selezionato;
- progetto non salvato non esportabile;
- direct startup load da `js/app.js` nell'HEAD sorgente.

PWA sorgente prevista: `safetymanager-pwa-v11`.
`npm run check` ora include `node --check js/modules/safetytraining_bridge.js`.
Il repo SafetyManager non ha workflow GitHub Actions configurati, quindi non dichiarare CI automatica.

## QA SafetyManager dati reali in sola lettura
- 72 progetti con azienda e corso;
- 138 righe iscrizione;
- 0 aziende senza P.IVA/CF;
- 0 corsisti senza CF;
- 0 gruppi CF duplicati nello stesso progetto;
- 40 iscrizioni con azienda corrente learner diversa dal progetto: casi storici, warning.

## Compatibilità destinazione SafetyTraining
Lato SafetyTraining NON è servita una modifica funzionale:
- `apps/training/integration-import.js` accetta già `schema_version` `1.x`;
- `import_safetymanager_package()` importa azienda/corsisti/corso/edizione/iscrizioni con `external_mappings` idempotenti;
- `sync_safetymanager_training_context()` aggiorna la composizione didattica/rischi;
- dedupe CF/P.IVA v21_017–018 resta la barriera definitiva.

Quindi nessuna nuova migration DB SafetyTraining per il payload v1.2.

## Commit funzionali SafetyManager
- `cff8aea4945d216f26af5988db0635b8d7cf526d` — hardening bridge v1.2
- `20976a470698e8d2bf2a86d3a35a4e34d3202a3f` — PWA v11
- `bddb8106c61fc4384f4dd564f7c5ba6636395ebb` — syntax check bridge
- `58ccfe9ac2e4a7972cd0a6c611ff97debbf71f12` — historical company context warning
- `6e3c7e14f6a103fd56e69728420d3669667c9ca6` — direct startup load

## Produzione SafetyManager — NON ancora allineata all’intero blocco
Vercel project: `safety-manager-ultimate`.

Ultimo production verificato:
- `dpl_8kpuPLosszeyf4jpsin7bVEK15ba`
- `READY`
- commit `cff8aea4945d216f26af5988db0635b8d7cf526d`

Quindi in produzione c’è il primo hardening v1.2, ma NON sono ancora verificati live i commit successivi con:
- cambio azienda storico = warning;
- PWA `safetymanager-pwa-v11`;
- direct load da `app.js`.

Tentato deployment production forzato del `main` completo: Vercel ha restituito `402 payment_required`, codice `api-deployments-free-per-day`, limite giornaliero Hobby superato (>100). Non cambiare billing/piano automaticamente e non dichiarare il blocco completo live.

## Produzione SafetyTraining
Backend live v21_022.
Functional HEAD SafetyTraining verificato prima dei docs:
- `74cbf21fcab2581551f8fa8587474695841f1598`
- Actions `SafetyTraining checks` #275: SUCCESS

Vercel:
- `dpl_EejAje6W4zzx6RSkYshpeNDNMP6U`
- commit `74cbf21fcab2581551f8fa8587474695841f1598`
- READY / production
- alias `safety-training-safety-manager.vercel.app`
- PWA `safety-training-v21-9`

## Prossimi passi esatti
1. Appena il limite deployment SafetyManager si libera, pubblicare `main` completo su `safety-manager-ultimate`.
2. Smoke live: `js/app.js` direct load, bridge v1.2 con warning storico, `sw.js` v11.
3. E2E SafetyManager → export JSON → SafetyTraining import; ripetere lo stesso import per confermare idempotenza/dedupe.
4. E2E learner non-platform: invito → delivery → Auth → identità → claim → dashboard.
5. Onboarding admin scoped `organization_admin|training_manager`.
6. Eventuale storico formale learner↔aziende.
7. `company_admin` resta disabilitato.
8. Aggiornare sempre entrambi gli handoff.

## Servizi
- GitHub SafetyTraining: `SafetyManagerPro/SafetyTraining`
- Supabase SafetyTraining: `ejkwvatmzdqqjozpxntk`
- Vercel SafetyTraining: `safety-training`
- produzione SafetyTraining: `safety-training-safety-manager.vercel.app`
- GitHub SafetyManager source: `SafetyManagerPro/SafetyManager`
