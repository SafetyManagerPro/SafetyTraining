# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-18
Stato corrente: **v22 didactic quality / Practice Lab LIVE** sui 65 corsi non congelati; backend admin v21 preservato; PWA `safety-training-v22-11`.

Questo file è il riferimento persistente di SafetyTraining. Dopo OGNI modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF_LATEST.md`.

## Vincoli permanenti
NON sviluppare/modernizzare/finalizzare/pubblicare salvo richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB attivo: 27 catalog entry frozen complessive. `mod_cantieri` resta UN corso catalogo con due versioni role-specific. `company_admin` resta NON abilitato.

## v22 — standard didattico LIVE
`published` non equivale più a “corso finito”. Ogni corso non frozen deve avere contenuti operativi, scenario, supporto visuale, media/fonti, verifica e almeno un’esperienza specifica della mansione/ruolo/settore/attrezzatura.

Nuovi oggetti:
- `training_scenarios_v22`
- `practice_labs_v22`
- `course_scenarios_v22`
- `course_practice_labs_v22`
- `get_course_quality_v22()` per audit platform-admin.

Tabelle v22 con RLS attiva; nessun accesso anon. Authenticated legge contenuti attivi, mutazione riservata a platform admin. `get_course_quality_v22()` è SECURITY DEFINER ma controlla `private.is_platform_admin()` prima di restituire dati.

### Audit finale DB
Dopo `v22_009`:
- non frozen: **65**
- frozen: **27**
- 65/65 Safety Scenario specifico
- 65/65 Practice Lab specifico
- 65/65 verification path
- **38** corsi con pratica fisica da validare
- frozen toccati da v22: **0**
- 50 Safety Scenario
- 50 Practice Lab
- 123 link corso-scenario
- 123 link corso-lab
- 23 Practice Lab fisici
- 0 riferimenti visual errati `idea-safe-moves.svg`.

## Migration v22 LIVE e presenti nel repository
1. `20261017173942_v22_001_practice_scenarios_quality`
2. `20261017175140_v22_002_quality_gap_gate_and_profile_practice`
3. `20261017175534_v22_003_equipment_specific_practice`
4. `20261017175654_v22_004_emergency_fire_first_aid_specific_practice`
5. `20261017175827_v22_005_workers_roles_rls_management_specific_practice`
6. `20261017175941_v22_006_dl_spp_sector_specific_practice`
7. `20261017180016_v22_007_quality_specificity_gate`
8. `20261017180645_v22_008_bind_practice_labs_to_requirement_evidence`
9. `20261017185410_v22_009_fix_safe_moves_visual_and_v22_indexes`

Nota: `v22_002` nel repo conserva dati e legami ma non duplica la definizione intermedia della funzione quality, superseded dalla definizione definitiva in `v22_007`; il replay della catena raggiunge lo stesso stato finale.

## Copertura v22
### Profili storici
`backoffice`, `frontoffice`, `ecologici`, `polizia`, `verde`, `fondamenti`: scenario specifico + lab specifico + verifica competenze tramite simulazione.

### Attrezzature
Esperienze specifiche per CMM, carrelli industriali, telescopici/rotativi, carroponte, gru a torre, gru autocarro, CRF, MMT, escavatore, PLE, pompe calcestruzzo e trattori. Gli aggiornamenti usano il modello della macchina con contesto refresh/near-miss.

### Emergenze
Antincendio L1/L2/L3 e aggiornamenti; Primo Soccorso B/C e aggiornamento; Primo Soccorso A e aggiornamento; evacuazione con via bloccata + drill specifico.

### Lavoratori / ruoli
Formazione generale; rischio basso/medio/alto; aggiornamento lavoratori; Datore base/update; Dirigente base/update; specificità anche su `mod_cantieri`, `lav_quota`, RLS e aggiornamenti, Preposto e aggiornamento.

### DL-SPP
Laboratori/scenari distinti per comune, aggiornamento, agricoltura, pesca, costruzioni, chimico-petrolchimico.

## Quality Score v22.007
Gold = score >=85 **e zero gap**.
Gate:
- LU;
- contenuto operativo;
- caso/scenario;
- supporto visuale;
- Safety Scenario;
- Scenario specifico;
- Practice Lab;
- Practice Lab specifico;
- media/demo;
- fonti;
- verification path;
- test bank completo quando richiesto.

UI admin: `apps/training/course-quality-v22.js`, voce **Qualità didattica v22**; ricerca/filtri integrati con `admin-list-tools-v21.js`.

## Reader / Course Experience
Asset:
- `apps/training/course-experience-v22.js`
- `apps/training/course-experience-v22.css`

Mostra Fondamenti vs Specifico, Safety Scenario, tutte le grafiche associate, video/video hub/fonti, Practice Lab, sequenza, checklist, errori critici, stop condition e avviso esplicito quando la pratica manuale richiede validazione docente.

## Pratica fisica / evidence
Riutilizzare sempre:
- `course_practical_requirements`
- `enrollment_requirement_evidence`
- `admin_set_requirement_evidence`

NON creare un secondo sottosistema.

`requirement-evidence-admin-v21.js` è ora v22.008:
- carica il rubric del Practice Lab;
- mostra checklist/errori/stop prima della validazione;
- `Valida pratica` registra via RPC;
- nota evidenza per data/docente/esito/checklist;
- pratica manuale mai completata automaticamente;
- rimosso il MutationObserver globale legacy da questo modulo.

Evacuazione: requisito pratico `v22_evacuation_drill`.

## Visual / media / fonti
Fonti principali: INAIL, Corpo Nazionale Vigili del Fuoco, Croce Rossa Italiana, EU-OSHA/Napo. Distinguere sempre video, video hub e fonte tecnica.

`v22_009`:
- fix `idea-safe-moves.svg` → `video-safe-moves.svg`;
- indici `course_scenarios_v22_scenario_idx` e `course_practice_labs_v22_lab_idx`.

Audit visual v22 pulito.

## Runtime / PWA
PWA `safety-training-v22-02`.
`index.html` e service worker includono Quality + Course Experience v22.

## CI
Latest functional Git HEAD prima dei soli commit handoff:
- `8597519376cfc7319598b5bc579d6b6d08818b2e`
- workflow `SafetyTraining checks` #321
- run `39060240487`
- **SUCCESS**.

## Vercel production
Alias: `safety-training-safety-manager.vercel.app`.

Deployment production READY osservato:
- `dpl_APLAbwNW3FbEHoCDw7Ft18xF4RGC`
- metadata Git SHA `462df67bef8fc356a56b4dc321d5e0c2bc5c9ea2`.

HTTP smoke sull’alias conferma però runtime v22 finale:
- `/course-experience-v22.js` = v22.007, specificità + multi-visual + Practice Lab;
- `/course-quality-v22.js` = v22.007 specificity gate;
- `/requirement-evidence-admin-v21.js` = v22.008, rubric pratica + `Valida pratica`, no global MutationObserver;
- `/sw.js` = `safety-training-v22-02`.

Tentativo di deploy esplicito del latest functional `8597519...` bloccato da Vercel con `402 api-deployments-free-per-day` (>100 deployment/giorno). Non modificare billing/piano automaticamente. Il blocco riguarda solo il riallineamento metadata SHA: `v22_009` è già LIVE nel DB e non modifica il runtime frontend.

## Smoke completati
- audit DB/copertura v22;
- frozen isolation;
- audit visual asset;
- CI;
- HTTP production asset smoke;
- runtime Practice/Quality/Gate/PWA.

NON completato: visual browser smoke reale interattivo 1440 / 820 / 390 con click/screenshot. Non dichiararlo completato finché non viene eseguito con browser/Computer Use/Work.

## Amministrazione v21 — invarianti ancora vigenti
Backend resta LIVE fino a v21_024, con admin UX/list tools v21.5 integrati dal nuovo Quality v22.

Preservare:
- readiness usa test attivi + domande attive, non `bank_required`;
- `learners.company_id` = current company; storico in `learner_company_training_history`;
- inviti personali multicanale, token hash/monouso/identity verification;
- CF/PIVA unique tenant-scoped;
- no disclosure duplicate identity cross-tenant;
- service_role solo server-side;
- authorization mai da `user_metadata`;
- no password WhatsApp/SMS;
- raw invitation token mai persistito/loggato;
- fix RLS anti-recursion;
- nessuna pubblicazione automatica;
- non reintrodurre MutationObserver/polling globale;
- `company_admin` disabilitato;
- SafetyManager bridge v1.2 invariato;
- Edizione `Disattiva` = archive.

## Prossimi passi esatti
1. Dopo reset limite Vercel, deploy current `main` per riallineare metadata SHA; housekeeping, non modifica funzionale.
2. Visual browser smoke reale 1440 / 820 / 390 su Quality v22, reader Scenario/Practice, Gate pratica e principali viste admin.
3. E2E learner non-platform: invito → delivery → Auth → identity verify → claim → dashboard → replay rejected → cleanup.
4. Onboarding scoped admin `organization_admin|training_manager`.
5. `company_admin` resta disabilitato.

## Servizi
- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel: `prj_u0IT97WJ3ARGJJUhuYUWA6MyS24U`
- production alias: `safety-training-safety-manager.vercel.app`

## 2026-10-18 — SafetyTraining v22.1: stabilizzazione e monitoraggio
- Rimosso l'osservatore del DOM globale in learner-access-guard: ora osserva solo i figli diretti di #sideCourses, evita riscritture non necessarie e ascolta il rendering del pannello cloud.
- Rimosso MutationObserver da completion-gates-learner: rendering dei gate con id iscrizione stabile, aggiornamento solo quando cambiano i requisiti, refresh a pannello visibile (30 s), evento safety:cloud-panel-rendered generato da cloud-v20.
- Amministrazione > Corsisti: pannello di monitoraggio per iscrizione con corso, stato, barra del progresso contenuti (% da enrollments.progress_pct), minuti/ore attivi (active_seconds), durata nominale (courses.nominal_minutes), ultima attività; riepilogo aggregato. In Iscrizioni aggiunta barra percentuale.
- Progresso contenuti e tempo nominale sono metriche diverse e non provano da sole validità certificante o obblighi formativi.
- Cache PWA safety-training-v22-03; npm check include anche learner guard e completion gates.
- Nessuna modifica Supabase né corsi: 27 frozen immutati, company_admin disabilitato. CI, deploy e browser smoke restano da verificare per questo commit.

### Refinement 2026-10-18 — carichi amministrazione
- Monitoraggio Corsisti: fetch raggruppate in snapshot deduplicato per 30 secondi, evitando cinque nuove query a ogni tasto di ricerca. La cache viene invalidata premendo Aggiorna e al cambiamento dell'autenticazione; dati sempre filtrati dalle RLS del database. Non sono stati toccati corsi o schema.

### Rifinitura cache di sessione v22.1
- La cache del monitoraggio usa una generation id: su cambio autenticazione/refresh invalida anche la richiesta pendente. Risultati da sessioni precedenti non possono ripopolare la cache della nuova sessione.

## 2026-10-18 — v22.1 fase 2: navigazione corsista e corsi DB
- `learner-navigation-v22.js`: regole pure e testate di accessibilità delle assegnazioni: chiave stabile, stato, scadenza, deep link, deny per libreria tecnica e corsi non assegnati; i controlli server RLS restano autoritativi.
- `learner-dashboard.js`: menu corsista derivato da assegnazioni accessibili, NON dagli indici degli elementi riordinati. Clic su uno specifico `enrollment_id`; l'apertura asincrona carica la presentazione dal database prima del cambio route; errore visibile. Logout ripristina il menu generale.
- `catalog-browser.js`: deep link a corsi DB per corsisti autenticati **solo se assegnati e disponibili**, inclusi percorsi topic/deck; verifica versione e messaggio errore. No apertura arbitraria dalla libreria.
- `cloud-v20.js`: il tracciamento delle unità DB usa la chiave `source_stable_key` reale, invece dell'id di presentazione generato; preservata la chiave precedente per corsi locali. `db-slide-adapter.js` elimina dalla memoria le presentazioni DB su cambio identità (evita riuso dati tra account).
- CI `npm run check` include `node --test tests/learner-navigation.test.mjs`; SW `safety-training-v22-04` precache del modulo. Nessuna modifica DB, corsi frozen o configurazione ruoli.
- Limite noto: `training_course_bundle` legge l'ultima versione del corso. Se una edizione assegna una versione pubblicata precedente, si blocca l'apertura con messaggio esplicito invece di usare silenziosamente il materiale sbagliato. Per supportare snapshot precedenti serve un endpoint/versioned bundle controllato; seguire solo dopo test e revisione RLS.
- Smoke reale con sessioni corsista/docente, completamento frequenze ed E2E browser non ancora verificati.

## 2026-10-18 — v22.1 fase 3: strumenti pratica aggiuntivi
- La precedente consultazione testuale dei laboratori e il pulsante «Valida pratica» restano intatti.
- Aggiunto da Gate > Requisiti pratici il pulsante «+ Procedura guidata / checklist compilabile»: scheda istruttore distinta con passaggi e checklist (Da osservare / Eseguito / Da correggere / N/A), criticità, condizioni di stop, data, docente e note.
- Nuova tabella Supabase `enrollment_practice_assessments_v22` con RLS read staff e RPC `admin_save_practice_assessment_v22` verificante ruolo, iscrizione, requisiti e laboratorio associato; audit admin per ogni scrittura. Supporta bozze e registrazione. Nessun salvataggio modifica Gate o completa automaticamente l'iscrizione.
- Cache PWA safety-training-v22-05; nuova pagina accessibile solo dall'amministrazione Gate. Necessario collaudo autenticato con docente e admin.
- Nessun corso congelato modificato, company_admin resta disabilitato.

## 2026-10-18 — v22.2 prima tranche
- Scenari: scelte e conseguenze interattive affiancate al testo; esperienza usa debounce, cache per corso e messaggio Riprova in caso di errori.
- Quiz: lock invio risposta contro clic multipli.
- Storico docente: RPC staff-only `admin_practice_assessment_history_v22` applicata a Supabase; pulsante storico checklist che non modifica la validazione Gate.
- Cache PWA v22-06. Restano da verificare E2E browser, accessibilità completa e regressioni con account reali. Corsi frozen invariati.

## 2026-10-18 — v22.2 accessibility refinement
- Aggiunto modulo condiviso per focus iniziale, ritorno al pulsante originario e ciclo di Tab nei dialoghi Gate, quiz e checklist; gestione Escape preesistente preservata.
- Cache PWA v22-07 e verifica sintattica del nuovo modulo CI. Il collaudo con account reale e screen reader resta separato.

## 2026-10-18 — learner onboarding password accessibility
- Learner first-access form now includes a visually hidden, readonly email/username field with `autocomplete="username"`. It is populated only from the current Supabase authenticated user/session, never from arbitrary URL parameters. `autocomplete="new-password"` fields and activation handling unchanged.
- Added static regression test. Bumped PWA cache to `safety-training-v22-09` to load updated assets. No database changes, no user data changes.
- Workflow UX audit: admin tabs currently split company, courses, editions, learners, enrollment, invite. Recommended future additive guided enrollment flow: company -> approved course/edition -> learner -> enroll -> invite -> monitor, preserving all existing advanced screens. No workflow redesign deployed in this change.

## 2026-10-18 — v22.3 guided enrollment wizard (additive)
- Admin sidebar «Avvia percorso» and Dashboard CTA now open a guided company -> course/edition -> learners -> review -> submit flow. Existing Companies, Courses, Editions, Learners, Enrollments, Access/import screens are preserved.
- Reuses existing audited/auth-scoped RPC functions `admin_save_company`, `admin_create_edition`, `admin_save_learner`, `admin_bulk_enroll` and invite-learner Edge Function. No Supabase migrations nor frozen course edits. Prevents duplicate enrollment via server RPC conflict and checks learner/company compatibility.
- Allows reuse of existing approved course versions and open editions, creating new company/edition on explicitly labeled advancing actions, creation of new learners only at final confirmation. Gives clear counts and separate invited/failed statuses; alternate messaging channels remain in Access/import reachable after completion.
- User-driven sessionStorage draft retains only selected IDs and org references, not new learner PII; all operations require valid current session.
- Added isolated unit tests for approved/frozen versions, edition scope, roster scope, duplicate detection and draft privacy; cache `safety-training-v22-10`. Authenticated multi-role browser E2E pending; never use production learner records for testing.

### 2026-10-18 — wizard post-CI correction
- Updated existing PWA cache assertion to v22-10. Fixed duplicate wizard event listeners on repeated admin renders; batch duplicate checking now independently validates CF and email; added auth guard before each invite. The previously failed CI was a stale cache-version test, not an application syntax failure.

## 2026-10-18 — v22.3.1 Wizard resilienza e guida in linea
- Rifinitura additiva del Wizard, senza modificare RPC Supabase, schema, RLS, completamento, inviti server, corsi congelati o `company_admin`.
- Cambio organizzazione/azienda invalida edizione, versione, roster e nuove anagrafiche in memoria: niente selezioni stale o iscrizioni verso azienda precedente. Le bozze vengono ripristinate soltanto se riferimenti organizzazione/azienda/edizione/corsisti sono ancora compatibili.
- Conferma ricontrolla roster e validità edizione; nuovi corsisti salvati in un tentativo parziale rimangono marcati e non vengono salvati di nuovo al retry nella stessa sessione. Dopo creazione azienda/edizione si ritenta il caricamento in caso di snapshot inizialmente stale.
- Il successo di `admin_bulk_enroll` viene visualizzato prima di ricaricare corsisti o inviare email. Errori di refresh/delivery non trasformano più iscrizioni già riuscite in un errore generale. Inviti falliti sono separati da email mancanti, con avviso per esiti incerti e nuova lettura prima di ritentare.
- Le richieste asincrone del Wizard non devono sovrascrivere il pannello di un'altra tab amministrativa.
- Guida in linea accessibile con pulsante `?` nel Wizard: apre/chiude un pannello non modale con istruzioni specifiche per Azienda, Edizione, Corsisti, Riepilogo e Risultato. Attributi ARIA, focus sulla guida e ritorno focus al pulsante.
- Suite regression ampliata: cambio scope, ripristino bozze scoped, mismatch roster, duplicati batch, retry anagrafiche parziali, help e ordine di conferma iscrizioni/inviti. PWA cache `safety-training-v22-11`.
- Nessun test browser autenticato, email reale o E2E multiutente eseguito in questo intervento: restano da fare con account di prova. CI/deployment devono essere osservati dopo il commit.
