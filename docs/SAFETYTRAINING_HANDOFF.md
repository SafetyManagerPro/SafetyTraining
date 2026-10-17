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

### Modello invito

`learners` ora include `phone`.
`learner_account_invitations` include:
- `token_hash`
- `token_prefix`
- `delivery_channel`
- `recipient_phone`
- `issued_at`
- `expires_at`
- `revoked_at`
- `consumed_at`

Sicurezza:
- token casuale 32 byte / 64 hex
- il token raw viene restituito solo al momento dell’emissione; nel DB viene salvato SHA-256
- token monouso
- scadenza configurabile 1–720h (UI: 72h, 7 giorni, 30 giorni)
- rigenerare un invito sostituisce il token precedente
- revoca cancella `token_hash`
- browser senza DML diretto sulla tabella inviti
- audit emissione, delivery, revoca e accettazione

RPC admin:
- `admin_set_learner_contact`
- `admin_issue_learner_invite`
- `admin_record_learner_invite_delivery`
- `admin_revoke_learner_invite`

Attivazione:
- `learner_invite_public_info(token)` è intenzionalmente disponibile anon/authenticated e restituisce soltanto dati minimi/mascherati
- `claim_learner_invite(token, identity_value)` richiede una sessione Auth valida
- verifica identità in ordine: CF; altrimenti email; altrimenti ultime 4 cifre telefono; senza dati sufficienti => manual review
- se il profilo ha email, l’email dell’account Auth deve coincidere
- impedito riuso dello stesso Auth account per un altro learner e collegamento dello stesso learner ad altro account
- claim consuma il token e collega `learners.auth_user_id`

Non è stato creato un nuovo endpoint pubblico con service role: un primo design con Edge Function pubblica è stato scartato dai controlli di sicurezza. Il flusso definitivo usa Supabase Auth + RPC con autorizzazione server-side.

### Email

Si riusa Edge Function `invite-learner` v2 (`verify_jwt=true`):
- platform admin globale oppure `organization_admin|training_manager` stessa org
- cross-tenant negato
- accetta `redirect_to` con il link tokenizzato
- compatibilità verificata: l’upsert della funzione aggiorna solo stato/consegna e NON sovrascrive i nuovi campi token/scadenza/revoca

### WhatsApp / SMS / link / QR

- WhatsApp: deep link `wa.me` con testo precompilato; nessuna WhatsApp Business API richiesta
- SMS: handoff al client tramite `sms:`; nessun provider SMS configurato
- Copy link: link personale copiabile
- QR: QR personale generato client-side
- tutti usano lo stesso token server-side sicuro; cambia solo il delivery channel

## Aziende con molti corsisti / bulk v21_020 — LIVE

Il modello resta 1 azienda → molti corsisti tramite `learners.company_id`.
Nota: un learner ha una sola azienda corrente; non esiste ancora storico rapporti di lavoro many-company.

RPC:
- `admin_company_bulk_context(company_id)`

Nuova UI `Accessi & import` permette:
- scegliere azienda
- vedere corsisti e stato account/invito
- selezionare tutti/alcuni
- scegliere edizione compatibile
- `Iscrivi selezionati`
- `Invita selezionati`
- `Iscrivi + invita`
- canale e scadenza invito

Il vecchio bulk enrollment frontend viene intercettato e instradato su `admin_bulk_enroll()`; non usa più l’insert diretto nel nuovo flusso.
Massimo inviti per singola operazione UI: 100.

## Import CSV / Excel v21_020 — LIVE

Frontend:
- CSV comma/semicolon/tab
- XLS/XLSX via SheetJS caricato dinamicamente
- colonne riconosciute: Nome, Cognome, Email, Telefono/Cellulare, CF/Codice fiscale, Mansione/Ruolo

RPC:
- `admin_import_learners_preview(company_id, rows)` max 500 righe
- `admin_import_learners_apply(company_id, rows, source)`

Classificazioni preview:
- `create`
- `existing_same_company`
- `existing_other_company`
- `duplicate_in_file`
- `needs_review`
- `invalid`

Azioni applicabili:
- `create`
- `create_reviewed`
- `reuse`
- `link`
- `skip`

Regole importanti:
- CF presente => dedupe sull’intera organizzazione
- esistente in altra azienda => serve azione esplicita `link`
- auto-create richiede CF
- reviewed create senza CF richiede almeno un contatto
- audit `learner.import`

## Frontend / PWA

Nuovi moduli:
- `apps/training/admin-access-import-v21.js` v21.3
- `apps/training/learner-invite-activation-v21.js` v21.3

Restano attivi:
- `admin.js`
- `admin-registry-dedup-v21.js`
- `admin-backend-v21.js`
- `admin-details-v21.js`
- `requirement-evidence-admin-v21.js`
- `admin-capabilities-v21.js`
- `admin-memberships-v21.js`
- `course-catalog-governance-v21.js`

PWA cache corrente: `safety-training-v21-9`.
Entrambi i moduli nuovi sono caricati da `index.html` e presenti nella precache.

## QA v21_019–022

QA transazionale + rollback:
- update contatti: OK
- token hashato nel DB, raw non persistito: OK
- public info mascherata: OK
- identità errata respinta: OK
- revoca invalida il token: OK
- claim corretto: OK
- token consumato / monouso: OK
- seconda accettazione respinta: OK
- import preview con tutte le classificazioni previste: OK
- import apply: create 1, reuse 1, link 1, errori 0
- bulk enroll RPC: OK
- DML browser tabella inviti: 0 grant
- rollback finale: 0 aziende QA, 0 learner QA, 0 link Auth QA, 0 audit QA

Durante QA è stato trovato un errore reale: con `search_path=''`, `gen_random_bytes()` e `digest()` non qualificati non erano risolti. Corretto in `v21_022` usando `extensions.gen_random_bytes` e `extensions.digest`.

## Ruoli

- `platform_admin`: globale
- `organization_admin`: scoped su organizzazioni di membership
- `training_manager`: scoped, aziende read-only ma corsisti/edizioni/enrollment/evidence/inviti gestibili
- `company_admin`: NON abilitato

Membership v21_016 resta platform-only; l’account Auth target deve ancora preesistere.

## Advisor Supabase

Non auto-fixare senza blocco dedicato:
- warning SECURITY DEFINER authenticated per RPC con authorization server-side
- nuovo warning anon SECURITY DEFINER su `learner_invite_public_info`: intenzionale e contenuto; richiede token ad alta entropia e restituisce solo dati mascherati/minimi
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy `training_blueprint_rules` non indicizzata

## Produzione / CI — blocco funzionale verificato

Supabase live fino a `v21_022`.

GitHub functional HEAD verificato prima dell’aggiornamento handoff:
- `74cbf21fcab2581551f8fa8587474695841f1598`
- `SafetyTraining checks` #275: SUCCESS

Vercel:
- deployment functional `dpl_EejAje6W4zzx6RSkYshpeNDNMP6U`
- commit `74cbf21fcab2581551f8fa8587474695841f1598`
- target production, stato READY
- alias `safety-training-safety-manager.vercel.app`
- home live HTTP 200
- HTML live contiene `admin-access-import-v21.js` e `learner-invite-activation-v21.js`
- `sw.js` live HTTP 200, cache `safety-training-v21-9`, entrambi i moduli in precache

Gli aggiornamenti successivi dei due handoff sono docs-only; non creare loop di documentazione che documenta se stessa.

## Prossimi passi esatti

1. fare E2E browser reale del ciclo corsista con un account/email di prova non-platform: emissione → ricezione/condivisione → Auth → verifica identità → claim → dashboard
2. progettare onboarding/invito dedicato degli amministratori scoped `organization_admin|training_manager` (membership resta source of truth; `company_admin` escluso)
3. opzionale: provider SMS reale; oggi SMS usa il client del dispositivo e WhatsApp usa deep link
4. opzionale: storico rapporti learner↔aziende se serve conservare cambi azienda nel tempo
5. mantenere `company_admin` disabilitato
6. aggiornare SEMPRE entrambi gli handoff

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`
