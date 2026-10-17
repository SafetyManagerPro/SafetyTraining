# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend amministrazione live fino a `v21_018`; frontend admin/PWA `safety-training-v21-8` LIVE e smoke-verificato in produzione.

> Fonte operativa più recente. Dopo ogni modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF.md`: lo stato non deve restare soltanto in chat.

## Vincoli permanenti

NON sviluppare/modernizzare/finalizzare/pubblicare senza richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB:
- 10 corsi RSPP/ASPP esterni: `freeze_scope=external_rspp_aspp`
- 17 corsi specialistici: `freeze_scope=user_out_of_roadmap_specialist`

`mod_cantieri` resta UN SOLO corso catalogo con due `course_versions` role-specific. Non creare un 93° corso.
`company_admin` resta NON abilitato.

## Go-live didattico v20 — completato

- 60 `course_versions` go-live
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

## Backend amministrativo v21 — live

Migration principali fino all’ultimo blocco:
- v21_001–014: service layer, core CRUD, guardrail, RLS fixes, evidence service, SafetyManager, Detail, scoped capability/inviti
- `20261017042729_v21_015_restore_platform_evidence_status_guard`
- `20261017042912_v21_016_admin_membership_service`
- `20261017045703_v21_017_registry_identity_deduplication`
- `20261017045832_v21_018_fix_case_insensitive_registry_normalization`

### Nota evidence v21_015

Una riapplicazione accidentale di v21_007 aveva sovrascritto parte dell’hardening v21_008. v21_015 ha ripristinato status platform solo `completed|failed`, binding test/versione/requisito e coerenza pass/fail. Guard live verificato.

## Ultimo blocco: aziende multi-corsista + anti-doppioni

Il modello esistente supporta già **una azienda con molti corsisti**: ogni learner ha `company_id` e bulk enrollment già lavora sui corsisti dell’azienda dell’edizione. Non è stato necessario rifare il modello.

Precisazione: oggi il corsista ha **una azienda corrente**. È possibile riassociarlo a un’altra azienda compatibile della stessa organizzazione, ma non esiste ancora una tabella storica many-company/rapporti di lavoro.

### Aziende — P.IVA

- generated column `companies.vat_number_normalized`
- unique index tenant-scoped `(organization_id, vat_number_normalized)` quando non-null
- normalizzazione di spazi/separatori/case
- il prefisso italiano `IT` viene rimosso quando seguito da 11 cifre, quindi varianti equivalenti collidono
- il CF aziendale resta separato in `companies.fiscal_code_normalized`
- `admin_save_company()` solleva `company_vat_duplicate` per un doppione

### Corsisti — Codice Fiscale

- generated column `learners.fiscal_code_normalized`
- unique index tenant-scoped `(organization_id, fiscal_code_normalized)` quando non-null
- normalizzazione case-insensitive e senza separatori
- `admin_save_learner()` solleva `learner_fiscal_code_duplicate` per un doppione

### Preflight amministrativo

Nuova RPC:
- `admin_registry_conflict(p_entity_type, p_organization_id, p_identifier, p_exclude_id)`

Sicurezza:
- authenticated only
- anon/PUBLIC senza EXECUTE
- company usa `private.can_manage_company_registry()`
- learner usa `private.can_manage_training_org()`

Nuovo frontend:
- `apps/training/admin-registry-dedup-v21.js` v21.1
- caricato da `apps/training/index.html`
- intercetta submit Nuova/Modifica azienda e corsista
- se trova il doppione mostra nome azienda/corsista già presente
- l’edit esclude il record corrente tramite `p_exclude_id`
- se il preflight UI fallisce, il DB continua comunque a bloccare i doppioni

### QA v21_017–018

VERDE dopo correzione:
- P.IVA esistente trovata anche con `IT` + spazi
- CF esistente trovato anche se inserito tutto minuscolo
- duplicate create company respinta da RPC
- duplicate create learner respinta da RPC
- duplicate groups live dopo migration: `company_vat=0`, `learner_fiscal_code=0`
- privilege RPC: solo authenticated tra i ruoli browser verificati

Bug trovato e corretto durante il QA:
- v21_017 applicava la regex prima dell’uppercase, quindi lettere minuscole del CF potevano essere rimosse
- v21_018 ricrea normalizzazione/indici facendo uppercase PRIMA della regex
- i test case-insensitive passano dopo v21_018

## Ruoli / membership

`platform_admin`: globale.
`organization_admin`: gestione scoped di aziende/corsisti/edizioni/enrollment/evidence/detail/inviti.
`training_manager`: scoped, legge aziende e gestisce corsisti/edizioni/enrollment/evidence/detail/inviti.
`company_admin`: schema-only, NON abilitato.

Membership v21_016:
- `admin_memberships_overview`
- `admin_set_organization_membership`
- solo platform admin può assegnare/revocare `organization_admin|training_manager`
- direct DML browser su `organization_memberships` bloccato
- account Auth target deve oggi già esistere

Ultimo stato Auth conosciuto:
- 1 Auth user
- 1 platform admin
- 0 utenti Auth non-platform
- 0 membership scoped reali

## Frontend / PWA corrente

Moduli amministrativi rilevanti:
- `admin.js`
- `admin-registry-dedup-v21.js`
- `admin-backend-v21.js`
- `admin-details-v21.js`
- `requirement-evidence-admin-v21.js`
- `admin-capabilities-v21.js`
- `admin-memberships-v21.js`
- `course-catalog-governance-v21.js`

PWA:
- cache `safety-training-v21-8`
- `admin-registry-dedup-v21.js` in precache

## Altri componenti completati

- Detail Azienda/Corsista/Edizione server-side
- evidence gate pratico + Test Builder platform
- SafetyManager staging/governance con frozen/reference/placeholder esclusi
- Edge `invite-learner` v2 con scoped authorization e cross-tenant denial
- RLS recursion enrollments/course_editions risolta: NON ripristinare vecchie policy recursive

## Produzione — ultimo blocco funzionale verificato

Vercel:
- functional commit: `a142f43c6801ee3d097de3c6f31983f35764edfe`
- deployment: `dpl_4PuMTDchfaNp1huKhPrhxT31zh85`
- `READY`, target production
- alias ufficiale `safety-training-safety-manager.vercel.app`
- home HTTP 200
- HTML live contiene `admin-registry-dedup-v21.js`
- live `sw.js`: `safety-training-v21-8`
- nuovo modulo presente nella precache

Supabase:
- live fino a v21_018
- 0 gruppi duplicati P.IVA azienda / CF corsista dopo l’applicazione

I commit che aggiornano i due handoff dopo `a142f43...` sono docs-only. La verifica funzionale resta riferita al commit/deployment sopra per evitare un loop di handoff che documenta se stesso.

## Prossimo blocco esatto

1. **Invito corsista multicanale**: un solo invito server-side sicuro con token monouso/scadenza/revoca/audit; delivery `email | whatsapp | sms | manual | qr`.
2. **Azienda con molti corsisti**: selezione multipla, iscrizione e invito massivi dalla scheda azienda.
3. **Import CSV/Excel**: preview e classificazione `già presente / da creare / da verificare`, usando CF/P.IVA normalizzati prima di scrivere.
4. Mantenere link personali; non usare un unico link che identifichi automaticamente tutti i corsisti. Per QR condiviso aziendale serve una seconda verifica/codice personale.
5. Successivamente, invito/onboarding dedicato degli admin scoped e QA interattivo con account non-platform reale.
6. Non abilitare `company_admin`.
7. Aggiornare sempre entrambi gli handoff.

## Advisor noti

Non auto-fixare senza blocco dedicato:
- warning SECURITY DEFINER authenticated
- leaked password protection disabilitato
- `auth_rls_initplan`
- multiple permissive policies
- unused indexes
- FK legacy `training_blueprint_rules` non indicizzata

## Servizi

- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `safety-training`
- produzione: `safety-training-safety-manager.vercel.app`
