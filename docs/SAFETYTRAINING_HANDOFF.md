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
- nessuna auto-creazione di edizioni/iscrizioni

## Amministrazione v21 — stato corrente

Supabase live fino a:
- `20261017045703_v21_017_registry_identity_deduplication`
- `20261017045832_v21_018_fix_case_insensitive_registry_normalization`

Restano attive le migration v21_001–v21_016, inclusi service layer amministrativo, guardrail, fix RLS, evidence gate, SafetyManager governance, Detail, scoped admin, invite visibility e membership administration.

### Evidence guard

Il 17/10 era stata rilevata una riapplicazione accidentale di `v21_007` (`20261017042346`) che aveva sovrascritto l’hardening di v21_008. `v21_015` ha ripristinato:
- platform evidence solo `completed|failed`
- binding test/versione/requisito
- coerenza passed/fail col test attempt
- impossibilità di revoca manuale dell’evidence platform

### Registry identity / anti-doppioni — v21_017–018

Obiettivo: impedire doppioni anagrafici prima di introdurre import e inviti massivi.

Aziende:
- una azienda può avere molti corsisti tramite `learners.company_id`
- Partita IVA normalizzata in `companies.vat_number_normalized`
- indice univoco tenant-scoped `(organization_id, vat_number_normalized)`
- prefisso `IT`, spazi, separatori e maiuscole/minuscole sono normalizzati; `IT 00503390643` e `00503390643` collidono
- il Codice Fiscale aziendale resta un campo distinto (`companies.fiscal_code_normalized`) e NON sostituisce la P.IVA come chiave anti-doppione principale

Corsisti:
- Codice Fiscale normalizzato in `learners.fiscal_code_normalized`
- indice univoco tenant-scoped `(organization_id, fiscal_code_normalized)`
- controllo case-insensitive e senza separatori
- ogni corsista ha una azienda corrente (`company_id`) e può essere spostato/riassociato nella stessa organizzazione; NON esiste ancora uno storico many-company dedicato

RPC/guardrail:
- `admin_registry_conflict(text,uuid,text,uuid)` per preflight UI
- `admin_save_company()` blocca P.IVA duplicata con `company_vat_duplicate`
- `admin_save_learner()` blocca CF duplicato con `learner_fiscal_code_duplicate`
- enforcement doppio: preflight UI + vincolo/controllo DB, quindi non aggirabile con chiamate dirette/import future
- `admin_registry_conflict` eseguibile da `authenticated`, non da `anon/PUBLIC`, e rispetta lo scope amministrativo server-side

QA:
- P.IVA con `IT` + spazi riconosciuta come la stessa azienda
- CF completamente minuscolo riconosciuto come lo stesso corsista
- tentativi di creazione duplicata via RPC respinti
- gruppi duplicati live dopo la migration: 0 aziende P.IVA, 0 corsisti CF
- v21_017 aveva un difetto nell’ordine regex/uppercase per lettere minuscole; trovato nel QA e corretto immediatamente con v21_018

Frontend:
- nuovo `apps/training/admin-registry-dedup-v21.js` v21.1
- intercetta il submit prima del salvataggio e mostra l’anagrafica esistente invece di un errore SQL
- se il preflight UI non è disponibile, il salvataggio resta comunque protetto dal DB

## Ruoli

### platform_admin
Globale: organizzazioni, aziende, corsisti, corsi/editorial, edizioni, enrollment, gate, SafetyManager, audit, membership amministrative.

### organization_admin
Scope sulle proprie organizzazioni: aziende, corsisti, edizioni/iscrizioni, gate, Detail, audit/inviti scoped. Nessuna gestione globale corsi/organizzazioni/SafetyManager/membership.

### training_manager
Scope sulle proprie organizzazioni: lettura aziende, gestione corsisti, edizioni/iscrizioni, gate, Detail, audit/inviti scoped. Non modifica aziende e non usa funzioni globali.

### company_admin
Presente nello schema ma NON abilitato. Non abilitarlo senza progettazione esplicita company-only.

## Membership administration v21_016

RPC platform-only:
- `admin_memberships_overview(uuid default null)`
- `admin_set_organization_membership(uuid,text,text,boolean)`

Regole principali:
- ruoli ammessi solo `organization_admin|training_manager`
- account target deve già esistere in `auth.users`
- membership org-level con `company_id IS NULL`
- audit assign/reactivate/revoke
- direct browser DML sulla tabella membership revocato
- vecchia policy `memberships_manage` rimossa

Stato reale dell’ultimo QA membership:
- 1 Auth user
- 1 platform admin
- 0 utenti Auth non-platform
- 0 membership reali organization_admin/training_manager

## Frontend amministrativo / PWA

Moduli principali:
- `apps/training/admin.js`
- `apps/training/admin-registry-dedup-v21.js`
- `apps/training/admin-backend-v21.js`
- `apps/training/admin-details-v21.js`
- `apps/training/requirement-evidence-admin-v21.js`
- `apps/training/admin-capabilities-v21.js`
- `apps/training/admin-memberships-v21.js`
- `apps/training/course-catalog-governance-v21.js`

Cache corrente: `safety-training-v21-8`.
`admin-registry-dedup-v21.js` è caricato da `index.html` e presente nella precache PWA.

## Componenti già completati

- Backend core RPC/guardrail per organizzazioni, aziende, corsisti, corsi, edizioni, iscrizioni, dashboard e audit.
- Detail server-side per Azienda, Corsista ed Edizione con progress, inviti/account, test, evidenze e audit.
- Gate evidence con practical esterno e Test Builder platform non modificabile manualmente.
- SafetyManager staging/governance con mapping solo published/finalized/go_live_ready, frozen/reference/placeholder esclusi.
- Edge `invite-learner` v2 live: platform admin globale oppure org admin/training manager della stessa org, cross-tenant 403, learner/org attivi.

## RLS legacy

Risolta la ricorsione `enrollments` ↔ `course_editions` con helper RLS-safe. NON ripristinare vecchie policy recursive.

## Advisor noti

Non auto-fixare senza blocco dedicato:
- SECURITY DEFINER authenticated per RPC con auth server-side
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy `training_blueprint_rules` non indicizzata

## Produzione / CI — ultimo blocco funzionale verificato

Supabase live fino a v21_018.

Vercel functional deployment:
- commit `a142f43c6801ee3d097de3c6f31983f35764edfe`
- deployment `dpl_4PuMTDchfaNp1huKhPrhxT31zh85`
- target production, stato `READY`
- alias `safety-training-safety-manager.vercel.app` assegnato
- home produzione HTTP 200
- HTML live carica `admin-registry-dedup-v21.js`
- `sw.js` live è `safety-training-v21-8` e precache il nuovo modulo

I commit successivi che aggiornano questi handoff sono documentazione-only; non implicano divergenza funzionale dal deployment verificato sopra.

## Prossimi passi esatti

1. progettare/implementare invito corsista multicanale basato su UN invito server-side sicuro: email, WhatsApp, SMS, copia link, QR; token monouso, scadenza, revoca, audit e `delivery_channel`
2. aggiungere flusso azienda → selezione molti corsisti → iscrizione/invito massivo, riusando l’anti-doppione CF/P.IVA
3. aggiungere import strutturato CSV/Excel con preflight `già presente / da creare / da verificare`, senza duplicare anagrafiche
4. progettare invito/onboarding dedicato per `organization_admin|training_manager`; oggi l’account Auth deve preesistere
5. eseguire QA interattivo logged-in con un vero account scoped quando disponibile
6. mantenere `company_admin` disabilitato
7. aggiornare SEMPRE entrambi gli handoff

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`
