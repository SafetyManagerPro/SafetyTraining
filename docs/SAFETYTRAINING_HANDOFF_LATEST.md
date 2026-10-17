# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend live fino a `v21_022`; frontend/PWA `safety-training-v21-9` LIVE e smoke-verificato in produzione.

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

Nuove migration:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`

Repo allineato agli stessi timestamp live.

## Inviti corsisti multicanale — COMPLETATO

Canali:
- Email
- WhatsApp
- SMS
- Copia link
- QR personale

### Token

- 32 byte random = 64 caratteri hex
- raw token restituito solo all’emissione
- nel DB resta SHA-256 (`token_hash`)
- prefix breve solo per audit
- monouso
- scadenza 1–720h; UI 72h / 7gg / 30gg
- revocabile
- rigenerazione invalida il precedente
- no DML browser diretto sulla tabella inviti

Campi aggiunti a `learner_account_invitations`:
`token_hash`, `token_prefix`, `delivery_channel`, `recipient_phone`, `issued_at`, `expires_at`, `revoked_at`, `consumed_at`.
`learners` include ora `phone`.

RPC admin:
- `admin_set_learner_contact`
- `admin_issue_learner_invite`
- `admin_record_learner_invite_delivery`
- `admin_revoke_learner_invite`

RPC activation:
- `learner_invite_public_info(token)` anon/authenticated: valida il token e restituisce solo dati minimi mascherati
- `claim_learner_invite(token, identity_value)` authenticated-only: verifica identità, email Auth/binding, consuma token e collega `auth_user_id`

Verifica identità:
1. CF se presente
2. altrimenti email
3. altrimenti ultime 4 cifre telefono
4. altrimenti manual review

Non è stato introdotto un endpoint pubblico service-role: il design Edge pubblico con privilegi elevati è stato scartato. Attivazione = Supabase Auth + RPC server-side.

### Email compatibility

Si riusa `invite-learner` Edge Function v2, `verify_jwt=true`.
È stata ispezionata dopo l’introduzione dei token:
- supporta `redirect_to`
- mantiene autorizzazione platform/scoped e cross-tenant denial
- gli upsert di delivery non scrivono i nuovi campi token, quindi `token_hash`, expiry/revocation restano preservati

WhatsApp usa `wa.me`, SMS usa `sms:` del dispositivo, QR/copy link non richiedono provider esterni.

## Azienda con molti corsisti / bulk — COMPLETATO

Nuova RPC `admin_company_bulk_context(company_id)`.
Nuova voce admin **Accessi & import**:
- azienda
- elenco corsisti
- stato account/invito
- select all / selezione parziale
- edizione compatibile
- iscrivi selezionati
- invita selezionati
- iscrivi + invita
- scelta canale/scadenza

Il bulk enrollment passa da `admin_bulk_enroll()`; il vecchio submit diretto viene intercettato dal modulo v21.3.
Limite UI inviti massivi: 100 per operazione.

Nota modello: learner ha una sola `company_id` corrente. Non esiste ancora uno storico learner↔aziende.

## Import CSV / Excel — COMPLETATO

Frontend `admin-access-import-v21.js`:
- CSV comma/semicolon/tab
- XLS/XLSX via SheetJS runtime
- riconosce Nome, Cognome, Email, Telefono/Cellulare, CF/Codice fiscale, Mansione/Ruolo

Backend:
- `admin_import_learners_preview(company_id, rows)` max 500
- `admin_import_learners_apply(company_id, rows, source)`

Classificazioni:
- `create`
- `existing_same_company`
- `existing_other_company`
- `duplicate_in_file`
- `needs_review`
- `invalid`

Azioni:
- `create`
- `create_reviewed`
- `reuse`
- `link`
- `skip`

Dedupe usa il CF normalizzato nell’intera organizzazione. Per un learner già in altra azienda l’operatore deve scegliere esplicitamente `link`.

## Frontend corrente

Nuovi:
- `apps/training/admin-access-import-v21.js` v21.3
- `apps/training/learner-invite-activation-v21.js` v21.3

Esistenti rilevanti:
- `admin-registry-dedup-v21.js`
- `admin-backend-v21.js`
- `admin-details-v21.js`
- `requirement-evidence-admin-v21.js`
- `admin-capabilities-v21.js`
- `admin-memberships-v21.js`
- `course-catalog-governance-v21.js`

PWA `safety-training-v21-9`; i due nuovi moduli sono in `index.html` e precache.

### Learner activation UI

URL: `?learner_invite=<token>`.
Flusso:
- inspect pubblico mascherato
- account esistente: sign-in → identity check → claim
- nuovo account: sign-up → eventuale conferma email → riapertura stesso link → identity check → claim
- password signup min 10 caratteri
- dopo successo token rimosso dalla URL e, se `onboarding=1`, continua il learner onboarding.

## QA v21_019–022 — VERDE con rollback

Verificati:
- contatto email/telefono
- token hashato e raw non persistito
- inspect dati mascherati
- wrong identity respinta
- revoca
- claim corretto
- consumo / one-time
- tutte le classi import
- apply import: created 1 / reused 1 / linked 1 / errori 0
- bulk enrollment RPC
- 0 DML grant browser sulla tabella inviti
- residui finali QA: 0

Bug trovato in QA:
- con `search_path=''` pgcrypto non veniva risolto senza schema
- corretto in `v21_022` con `extensions.gen_random_bytes` e `extensions.digest`

## Ruoli

- platform_admin: globale
- organization_admin: scoped
- training_manager: scoped; aziende read-only, resto training gestibile
- company_admin: NON abilitato

Membership admin resta platform-only e oggi richiede che l’Auth account target esista già.

## Advisor

Non auto-fixare in questo blocco:
- SECURITY DEFINER authenticated: authorization server-side prevista
- `learner_invite_public_info` segnala anon SECURITY DEFINER: intenzionale, high-entropy token + output mascherato/minimo
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy `training_blueprint_rules` non indicizzata

## Produzione / CI

Functional HEAD verificato prima dei docs:
- `74cbf21fcab2581551f8fa8587474695841f1598`
- GitHub Actions `SafetyTraining checks` #275: SUCCESS

Vercel:
- deployment `dpl_EejAje6W4zzx6RSkYshpeNDNMP6U`
- commit `74cbf21fcab2581551f8fa8587474695841f1598`
- READY / production
- alias `safety-training-safety-manager.vercel.app`
- home HTTP 200
- live HTML include `admin-access-import-v21.js` + `learner-invite-activation-v21.js`
- live `sw.js` HTTP 200, cache `safety-training-v21-9`, entrambi in precache

I commit handoff successivi sono docs-only: non creare loop di aggiornamento handoff per documentare il commit che aggiorna l’handoff.

## Prossimi passi

1. E2E browser reale con learner di prova non-platform: emissione → delivery → Auth → verifica identità → claim → dashboard.
2. Onboarding/invito dedicato per `organization_admin|training_manager`; membership resta source of truth.
3. Eventuale provider SMS reale; attualmente SMS/WhatsApp sono handoff/deep-link.
4. Eventuale storico rapporti learner↔aziende.
5. `company_admin` resta disabilitato.
6. Aggiornare sempre entrambi gli handoff.

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`
