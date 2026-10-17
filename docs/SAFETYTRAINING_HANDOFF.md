# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-17

Questo file è la fonte rapida di ripartenza quando si cambia chat. Per il dettaglio operativo dell’ultimo blocco usare anche `docs/SAFETYTRAINING_HANDOFF_LATEST.md`; i due file devono essere aggiornati insieme dopo ogni modifica sostanziale.

## Regola permanente di hand-off
Dopo OGNI modifica sostanziale a SafetyTraining (DB, backend, frontend, contenuti, deploy, QA o governance) aggiornare nello stesso blocco anche questo file e `docs/SAFETYTRAINING_HANDOFF_LATEST.md`. Non lasciare lo stato importante soltanto nella chat.

## Percorsi congelati / fuori roadmap
NON sviluppare, modernizzare, finalizzare o pubblicare salvo richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi, inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB:
- 10 corsi RSPP/ASPP esterni: `freeze_scope=external_rspp_aspp`
- 17 corsi specialistici: `freeze_scope=user_out_of_roadmap_specialist`

`mod_cantieri` resta UN SOLO corso catalogo con due `course_versions` role-specific. Non creare un 93° corso.
`company_admin` resta NON abilitato.

## Go-live didattico v20 — COMPLETATO
- 60 `course_versions`
- 59 corsi distinti
- 290 `learning_unit_versions`
- 60/60 composizioni complete
- 60/60 verification path
- 36 test attivi
- 1.450 domande authored
- 660 test-question links
- soglia 70%
- 37 percorsi con gate pratico
- 73 requirement rows
- v20_097–v20_100 completati

## Amministrazione v21 — stato corrente
Supabase live fino a:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`

Restano attive v21_001–v21_018: service layer amministrativo, guardrail, fix RLS, evidence gate, SafetyManager governance, Detail, scoped admin, membership administration e anti-doppioni CF/P.IVA.

## Anti-doppioni v21_017–018
Aziende:
- P.IVA normalizzata in `companies.vat_number_normalized`
- unique tenant-scoped `(organization_id, vat_number_normalized)`
- prefisso IT/spazi/separatori/case normalizzati

Corsisti:
- CF normalizzato in `learners.fiscal_code_normalized`
- unique tenant-scoped `(organization_id, fiscal_code_normalized)`
- case-insensitive e senza separatori

`admin_registry_conflict()` fornisce preflight UI; `admin_save_company()` e `admin_save_learner()` restano la barriera DB definitiva.

## Inviti multicanale v21_019–022 — LIVE
Canali supportati:
- `email`
- `whatsapp`
- `sms`
- `manual` / copia link
- `qr`

`learners` include `phone`.
`learner_account_invitations` include `token_hash`, `token_prefix`, `delivery_channel`, `recipient_phone`, `issued_at`, `expires_at`, `revoked_at`, `consumed_at`.

Sicurezza:
- token casuale 32 byte / 64 hex
- raw token restituito solo all’emissione; nel DB resta SHA-256
- monouso, scadenza 1–720h, revoca/rigenerazione
- browser senza DML diretto sulla tabella inviti
- audit emissione, delivery, revoca e accettazione

RPC admin:
- `admin_set_learner_contact`
- `admin_issue_learner_invite`
- `admin_record_learner_invite_delivery`
- `admin_revoke_learner_invite`

Attivazione:
- `learner_invite_public_info(token)` anon/authenticated con dati minimi/mascherati
- `claim_learner_invite(token, identity_value)` richiede sessione Auth valida
- identità: CF, altrimenti email, altrimenti ultime 4 cifre telefono, altrimenti manual review
- claim consuma token e collega `learners.auth_user_id`

Email riusa Edge Function `invite-learner` v2, `verify_jwt=true`, con platform admin oppure scoped admin stessa org e cross-tenant denial.
WhatsApp usa deep link, SMS usa `sms:`, QR/link usano lo stesso token personale.

## Aziende con molti corsisti / bulk v21_020 — LIVE
Il modello resta 1 azienda → molti corsisti tramite `learners.company_id`.
Un learner ha una sola azienda corrente; non esiste ancora storico rapporti di lavoro many-company.

RPC `admin_company_bulk_context(company_id)`.
UI `Accessi & import`:
- azienda
- elenco corsisti e stato account/invito
- select all / selezione parziale
- edizione compatibile
- iscrivi selezionati
- invita selezionati
- iscrivi + invita
- canale e scadenza invito

Bulk enrollment passa da `admin_bulk_enroll()`. Massimo 100 inviti per operazione UI.

## Import CSV / Excel v21_020 — LIVE
Frontend:
- CSV comma/semicolon/tab
- XLS/XLSX via SheetJS
- colonne: Nome, Cognome, Email, Telefono/Cellulare, CF/Codice fiscale, Mansione/Ruolo

RPC:
- `admin_import_learners_preview(company_id, rows)` max 500
- `admin_import_learners_apply(company_id, rows, source)`

Classificazioni: `create`, `existing_same_company`, `existing_other_company`, `duplicate_in_file`, `needs_review`, `invalid`.
Azioni: `create`, `create_reviewed`, `reuse`, `link`, `skip`.
CF presente => dedupe sull’intera organizzazione. Esistente in altra azienda => `link` esplicito.

## Frontend / PWA SafetyTraining
Moduli principali attivi:
- `apps/training/admin-access-import-v21.js` v21.3
- `apps/training/learner-invite-activation-v21.js` v21.3
- `admin-registry-dedup-v21.js`
- `admin-backend-v21.js`
- `admin-details-v21.js`
- `requirement-evidence-admin-v21.js`
- `admin-capabilities-v21.js`
- `admin-memberships-v21.js`
- `course-catalog-governance-v21.js`

PWA cache corrente SafetyTraining: `safety-training-v21-9`.

## QA v21_019–022
QA transazionale + rollback verificato:
- update contatti
- token hashato, raw non persistito
- public info mascherata
- identità errata respinta
- revoca
- claim corretto
- token consumato / monouso
- import preview con classi previste
- import apply: create 1, reuse 1, link 1, errori 0
- bulk enroll RPC
- DML browser tabella inviti: 0 grant
- residui QA: 0

Bug trovato e corretto in v21_022: con `search_path=''`, pgcrypto richiede `extensions.gen_random_bytes` e `extensions.digest`.

## Ruoli
- `platform_admin`: globale
- `organization_admin`: scoped su organizzazioni di membership
- `training_manager`: scoped; aziende read-only, training gestibile
- `company_admin`: NON abilitato

Membership v21_016 resta platform-only; account Auth target deve preesistere.

## SafetyManager → SafetyTraining bridge v1.2 — SORGENTE COMPLETO, DEPLOY COMPLETO PENDENTE
Repo sorgente: `SafetyManagerPro/SafetyManager`.

Il bridge `js/modules/safetytraining_bridge.js` è stato completato lato SafetyManager con formato `safetytraining.transfer` v1.2:
- azienda + P.IVA/CF normalizzato + ATECO + indirizzo/sede;
- progetto/corso + durata + norma + modalità + date + sede + presenza/pratica;
- contesto fabbisogni/rischi;
- corsisti iscritti + enrollment ID + CF normalizzato + mansione;
- nessun documento/firma/dato sanitario/credenziale;
- nessuna email/telefono inventati perché lo schema SafetyManager `corsisti` non li possiede.

Controlli sorgente:
- blocco se mancano identificativi essenziali o CF corsista;
- blocco su CF duplicato nello stesso progetto;
- cambio azienda corrente del corsista rispetto all’azienda storica del progetto = warning, non blocco.

UI sorgente:
- pulsante globale SafetyTraining;
- pulsante contestuale nella scheda Progetto;
- bridge caricato direttamente da `js/app.js` nell'HEAD sorgente;
- cache sorgente prevista `safetymanager-pwa-v11`.

QA SafetyManager DB in sola lettura:
- 72 progetti con azienda + corso;
- 138 iscrizioni;
- 0 aziende senza P.IVA/CF;
- 0 corsisti senza CF;
- 0 gruppi CF duplicati nello stesso progetto;
- 40 mismatch azienda corrente/progetto, correttamente trattati come storico/warning.

### Compatibilità SafetyTraining
`apps/training/integration-import.js` accetta già `schema_version` che inizia con `1.` e usa:
- `import_safetymanager_package(p_payload)`
- `sync_safetymanager_training_context(p_payload)`

Il backend SafetyTraining ha già mapping idempotenti e dedupe CF/P.IVA. Nessuna migration SafetyTraining è necessaria per accettare il payload v1.2.

### Stato deploy SafetyManager
Ultimo deployment SafetyManager production verificato:
- `dpl_8kpuPLosszeyf4jpsin7bVEK15ba`
- `READY`
- commit `cff8aea4945d216f26af5988db0635b8d7cf526d`

È quindi live solo il primo hardening v1.2, non ancora tutto il blocco successivo (warning storico, PWA v11, direct startup load).
Tentativo di deployment forzato dell'HEAD completo fallito con Vercel `402 payment_required`, codice `api-deployments-free-per-day`: limite giornaliero Hobby superato (>100). NON dichiarare il bridge completo live finché non viene pubblicato e smoke-verificato.

## Advisor Supabase
Non auto-fixare senza blocco dedicato:
- warning SECURITY DEFINER authenticated per RPC con authorization server-side
- warning anon SECURITY DEFINER su `learner_invite_public_info`: intenzionale e contenuto
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy `training_blueprint_rules` non indicizzata

## Produzione / CI SafetyTraining — ultimo blocco verificato
Supabase live fino a `v21_022`.

Functional SafetyTraining HEAD verificato prima dei docs:
- `74cbf21fcab2581551f8fa8587474695841f1598`
- GitHub Actions `SafetyTraining checks` #275: SUCCESS

Vercel SafetyTraining:
- deployment `dpl_EejAje6W4zzx6RSkYshpeNDNMP6U`
- commit `74cbf21fcab2581551f8fa8587474695841f1598`
- target production, `READY`
- alias `safety-training-safety-manager.vercel.app`
- home HTTP 200
- PWA `safety-training-v21-9`

I successivi aggiornamenti handoff sono docs-only; non creare loop di documentazione che documenta se stessa.

## Prossimi passi esatti
1. Appena Vercel SafetyManager consente nuove deployment, pubblicare il `main` sorgente completo e smoke-verificare `app.js`, bridge v1.2 e `sw.js` v11.
2. Fare E2E SafetyManager → JSON → SafetyTraining su un progetto di prova; ripetere l’import per verificare idempotenza/dedupe.
3. Fare E2E browser learner non-platform: emissione invito → delivery → Auth → verifica identità → claim → dashboard.
4. Progettare onboarding/invito dedicato per `organization_admin|training_manager`; membership resta source of truth.
5. Eventuale storico learner↔aziende se serve conservare formalmente i cambi azienda nel tempo.
6. `company_admin` resta disabilitato.
7. Aggiornare SEMPRE entrambi gli handoff.

## Servizi
- GitHub SafetyTraining: `SafetyManagerPro/SafetyTraining`
- Supabase SafetyTraining: `ejkwvatmzdqqjozpxntk`
- Vercel SafetyTraining: `safety-training`
- produzione SafetyTraining: `safety-training-safety-manager.vercel.app`
- GitHub sorgente SafetyManager: `SafetyManagerPro/SafetyManager`
