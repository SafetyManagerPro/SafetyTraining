# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend SafetyTraining LIVE fino a `v21_024`; amministrazione UX v21.4 e PWA `safety-training-v21-11` LIVE; readiness corretta e storico azienda learner v21_023 preservato.

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

## Stato didattico
Go-live didattico completato: 60 versioni / 59 corsi / 290 LU / 36 test / 1.450 domande / 660 link domanda-test / 37 gate pratici / 73 requirement rows.

## Ultimo blocco — admin UX v21.4 + readiness v21_024
### Organizzazioni
- aggiunto `+ Nuova organizzazione` per platform admin;
- creazione/modifica tramite `admin_save_organization`;
- modifica mostra nome, codice, stato, ID e timestamp.

### Aziende
La modifica mostra tutti i campi correnti della tabella `companies`:
- organization, ragione sociale, P.IVA, CF, ATECO, stato;
- ID, P.IVA/CF normalizzati, created/updated e metadata.
I campi normalizzati e metadata sono read-only: restano generati/governati dal backend per non rompere dedupe o integrazione.

### Corsisti — nome unico SafetyManager-compatible
UI anagrafica ora usa un solo campo `Cognome/Nome`.
- record legacy `first_name + last_name` vengono riuniti in visualizzazione;
- `metadata.source_full_name`, se presente, ha precedenza;
- al salvataggio il valore unico viene scritto in `first_name` con `last_name = null`, mantenendo compatibilità schema/RPC senza migrazione distruttiva;
- payload SafetyManager v1.2 NON cambia: continua a fornire `full_name` unico.

### Edizioni
Aggiunto `Disattiva` invece di cancellazione fisica.
- usa `admin_update_edition(... status='archived' ...)`;
- preserva iscrizioni, avanzamenti, audit, storico e `learner_company_training_history`;
- conferma esplicita prima dell'archiviazione.

### Catalogo / Blueprint / Readiness — guida contestuale
Nuovo `admin-guidance-v21.js` spiega direttamente nella UI:
- Catalogo SafetyManager = requisito/catalogo amministrativo sorgente, non materiale didattico;
- Percorso SafetyTraining = versione didattica governata realmente erogabile;
- Learning Unit preview = composizione proposta, non pubblicazione automatica;
- Master Registry = governance/mapping fra codice SafetyManager, blueprint, variante e regole;
- Blueprint = modello riusabile della famiglia corso;
- varianti/regole = scelta della composizione in base a ruolo/rischio/pratica;
- libreria/profili = contenuti riusabili;
- moduli = contenitori concreti ordinati di una specifica versione corso;
- altri contenuti = DPI/fonti/checklist/supporti, non sostituiscono moduli/verifiche/requisiti.

`Parziale` = modello di composizione non ancora chiuso come riusabile per tutte le varianti; non significa necessariamente che il corso specifico non sia pubblicato.
`Ibrido parziale` = parte digitale + componente pratica/presenza esterna e modello Master Registry non chiuso in ogni variante/regola; non è un errore di caricamento.

## v21_024 — Readiness corretta
Problema trovato: `get_course_readiness()` usava il vecchio flag metadata `bank_required` come proxy dei test richiesti. I 36 test reali attivi non dipendono da quel flag, quindi molti corsi risultavano falsamente `missing_test_definition`.

Fix live:
- test definito = test attivo;
- banca valida = domande attive collegate >= minimo richiesto;
- `missing_test_definition` solo se i test attivi sono realmente meno dei test richiesti;
- `platform_question_bank_incomplete` usa le domande attive reali;
- nessun corso frozen viene auto-sbloccato.

Readiness dopo il fix:
- totale 92
- `published`: 65
- `ready_for_review`: 22
- `needs_configuration`: 2
- `ready_for_publish`: 0
- `blocked`: 3

I soli 3 bloccati sono intenzionalmente fuori roadmap/frozen:
- `amb_confinati` — Ambienti sospetti di inquinamento o confinati - 12h — `user_out_of_roadmap_specialist`;
- `rspp_aspp_a` — RSPP/ASPP Modulo A - 28h — `external_rspp_aspp`;
- `rspp_aspp_b` — RSPP/ASPP Modulo B comune - 48h — `external_rspp_aspp`.
Tutti e tre restano con `missing_test_definition` perché NON devono essere sviluppati nel perimetro attuale.

Semantica stati:
- `blocked`: hard blocker strutturale;
- `needs_configuration`: struttura presente ma scelta/configurazione richiesta;
- `ready_for_review`: nessun hard blocker, resta revisione/validazione/pratica;
- `ready_for_publish`: gate tecnici soddisfatti, pubblicazione comunque manuale;
- `published`: versione pubblicata, senza implicare che la pratica esterna del singolo learner sia completata.

## Responsive / device adaptation
Nuovo `admin-responsive-v21.css` integra i layer esistenti `responsive-v2.css` e `mobile-reader-v3.css`:
- tabelle admin/Blueprint/Readiness scrollabili senza overflow pagina;
- modali adattive e bottom-sheet su mobile;
- form, toolbar, card e azioni responsive;
- composizione SafetyManager adattiva;
- guide 3 colonne desktop / 2 tablet / 1 mobile;
- safe-area e breakpoints 1100/860/560/390;
- il reader didattico esistente usa layout nativo su tablet/mobile invece di ridurre il canvas desktop 1600x900.

Audit eseguito su codice/stili + smoke degli asset production. Non è stato eseguito in questo blocco un test visuale con browser reale su matrice fisica di viewport; resta utile come QA finale non bloccante.

## QA v21.4/v21.024
Transazione + rollback verificata:
- creazione organizzazione;
- creazione azienda con normalizzazione P.IVA/CF;
- learner con `Cognome/Nome` unico (`first_name='ROSSI MARIO'`, `last_name=null`);
- archiviazione edizione con `admin_update_edition`;
- assertion tutte verdi;
- residui post rollback: 0 organizzazioni QA, 0 aziende QA, 0 learner QA.

## Storico azienda learner — v21_023 invariato
Regola definitiva:
- `learners.company_id` = azienda corrente;
- azienda storica del corso/iscrizione = `learner_company_training_history`;
- importer SafetyManager preserva current company e registra training company storica.
Non regredire questa separazione.

## Produzione
Migration live:
- `20261017180000_v21_024_fix_course_readiness_test_gate.sql`

Commit funzionali principali:
- `72d78d8ece8defde197bd552430bf98faa69a94b` — responsive admin;
- `f578a9781503771169aad3437c249dedc4fa77f7` — wiring admin UX/guidance/responsive;
- `1a20d513b7b3d1af5367d15bc5af2c27fffabe50` — PWA v21-11;
- `dda51b92ff7c06b5f60b6bf708f53a764b73410d` — migration readiness v21.024;
- `87c077aa2d11bd29ade8a79a091c267975606b76` — fix intercept modifica organizzazione / latest functional.

GitHub Actions:
- SafetyTraining checks #292 SUCCESS (`dda51b9...`);
- SafetyTraining checks #293 SUCCESS (`87c077a...`).

Vercel production:
- deployment `dpl_8ardDTVN2hJ46Q2GEx9LNYzmT11V`;
- commit `87c077aa2d11bd29ade8a79a091c267975606b76`;
- production / READY;
- alias `safety-training-safety-manager.vercel.app`.

Smoke live HTTP 200:
- `/admin-ux-v21.js` v21.4;
- `/admin-guidance-v21.js` v21.4;
- `/admin-responsive-v21.css`;
- `/sw.js` con cache `safety-training-v21-11` e nuovi asset in APP_SHELL.

## Prossimo passo esatto
1. Smoke visuale con sessione browser admin reale ai viewport desktop/tablet/mobile, soprattutto Organizzazioni, Aziende, Corsisti, Edizioni, Catalogo SafetyManager, Blueprint e Readiness.
2. E2E learner non-platform: invito → delivery → Auth → verifica identità → claim → dashboard.
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
- `learners.company_id` è current company, non storico corso;
- non reintrodurre MutationObserver/polling globale nell'admin.
