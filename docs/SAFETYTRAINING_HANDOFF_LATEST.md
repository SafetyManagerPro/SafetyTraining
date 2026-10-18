# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-18
Stato: **v22 didactic quality / Practice Lab LIVE** sui 65 corsi non congelati; backend admin v21 invariato e preservato; PWA `safety-training-v22-12`.

> Fonte operativa più recente. Dopo ogni modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF.md`.

## Vincoli permanenti
NON sviluppare/modernizzare/finalizzare/pubblicare senza richiesta esplicita:
- CSP/CSE
- Ponteggi
- Lavori su funi inclusi preposti/sorveglianti
- Spazi confinati
- Segnaletica stradale
- tutti gli RSPP/ASPP esterni

Freeze DB attivo: 27 catalog entry frozen complessive. `mod_cantieri` resta UN corso con due versioni role-specific. `company_admin` resta NON abilitato.

## v22 — standard didattico LIVE
Obiettivo: `published` non equivale più a “corso finito”. Ogni corso non frozen deve avere contenuti operativi, scenario, supporto visuale, media/fonti, verifica e soprattutto un’esperienza specifica della mansione/ruolo/settore/attrezzatura.

Oggetti v22:
- `training_scenarios_v22`
- `practice_labs_v22`
- `course_scenarios_v22`
- `course_practice_labs_v22`
- RPC quality `get_course_quality_v22()` protetta da `platform_admin`.

Tabelle v22 con RLS attiva. `anon` non ha accesso. Gli authenticated leggono solo contenuti attivi; mutazione riservata a platform admin. Non allargare i permessi per eliminare warning advisor su SECURITY DEFINER: la funzione quality verifica `private.is_platform_admin()` prima di restituire dati.

### Audit finale DB v22
Verificato dopo `v22_009`:
- corsi non frozen: **65**
- frozen: **27**
- 65/65 con Safety Scenario specifico
- 65/65 con Practice Lab specifico
- 65/65 con verification path
- **38** corsi con almeno una pratica fisica da validare
- frozen toccati da scenario/lab v22: **0**
- Safety Scenario attivi: **50**
- Practice Lab attivi: **50**
- link corso-scenario: **123**
- link corso-lab: **123**
- Practice Lab fisici: **23**
- riferimenti visual errati `idea-safe-moves.svg`: **0**

## Migration v22 LIVE e sincronizzate nel repo
1. `20261017173942_v22_001_practice_scenarios_quality`
2. `20261017175140_v22_002_quality_gap_gate_and_profile_practice`
3. `20261017175534_v22_003_equipment_specific_practice`
4. `20261017175654_v22_004_emergency_fire_first_aid_specific_practice`
5. `20261017175827_v22_005_workers_roles_rls_management_specific_practice`
6. `20261017175941_v22_006_dl_spp_sector_specific_practice`
7. `20261017180016_v22_007_quality_specificity_gate`
8. `20261017180645_v22_008_bind_practice_labs_to_requirement_evidence`
9. `20261017185410_v22_009_fix_safe_moves_visual_and_v22_indexes`

Nota riproducibilità: il file repo `v22_002` conserva i dati/legami della migration ma omette la versione intermedia della funzione quality, perché la definizione definitiva è integralmente in `v22_007`; il replay completo raggiunge lo stesso stato finale.

## Copertura didattica specifica
### Profili storici
`backoffice`, `frontoffice`, `ecologici`, `polizia`, `verde`, `fondamenti` ora hanno scenario specifico, lab specifico e verifica competenze tramite simulazione. Prima avevano contenuti ma nessun vero verification path.

### Attrezzature
Copertura specifica per CMM, carrelli industriali, telescopici/rotativi, carroponte, gru a torre, gru autocarro, CRF, MMT, escavatore, PLE, pompe calcestruzzo e trattori. Gli aggiornamenti usano la stessa macchina con contesto refresh/near-miss, non semplice ripetizione teorica.

### Emergenze
Antincendio L1/L2/L3 + aggiornamenti; Primo Soccorso B/C + aggiornamento; Primo Soccorso A + aggiornamento; evacuazione con scenario via bloccata e drill specifico.

### Lavoratori / ruoli
Formazione generale, rischio basso/medio/alto, aggiornamento lavoratori, Datore base/update, Dirigente base/update; marcatura specifica anche per `mod_cantieri`, `lav_quota`, RLS e aggiornamenti, Preposto e aggiornamento.

### DL-SPP
Esperienze distinte per comune, aggiornamento, agricoltura, pesca, costruzioni e chimico-petrolchimico.

## Quality Score v22.007
Gold richiede punteggio >=85 **e zero gap**. Gate reali:
- Learning Unit presenti;
- contenuto operativo;
- casi/scenari;
- supporto visuale;
- Safety Scenario;
- **Safety Scenario specifico**;
- Practice Lab;
- **Practice Lab specifico**;
- media/dimostrazione;
- fonti;
- verification path;
- banca test sufficiente quando richiesta.

Admin UI: `apps/training/course-quality-v22.js`, voce **Qualità didattica v22**, con ricerca/filtri via `admin-list-tools-v21.js`.

## Course Experience v22
Frontend:
- `apps/training/course-experience-v22.js`
- `apps/training/course-experience-v22.css`

Nel reader ogni corso non frozen mostra:
- Fondamenti vs contenuto **Specifico**;
- Safety Scenario;
- tutte le grafiche associate allo scenario;
- video/raccolte video/fonti tecniche;
- Practice Lab;
- sequenza operativa;
- checklist osservabile;
- errori critici;
- condizioni di STOP;
- avviso esplicito quando la competenza manuale richiede validazione fisica del docente.

## Pratica fisica / Gate
NON creare un secondo sistema di evidenze. La pratica usa gli oggetti esistenti:
- `course_practical_requirements`
- `enrollment_requirement_evidence`
- RPC `admin_set_requirement_evidence`

`requirement-evidence-admin-v21.js` è ora v22.008:
- carica i Practice Lab collegati al requisito;
- mostra checklist, errori critici e stop condition prima della validazione;
- pulsante `Valida pratica`;
- nota evidenza con data/docente/esito/checklist;
- mantiene l’RPC come unica autorità per la scrittura;
- nessun completamento automatico della capacità manuale;
- rimosso il MutationObserver globale legacy da questo modulo; enhancement tramite eventi espliciti e retry limitati.

Evacuazione ha requisito pratico `v22_evacuation_drill`.

## Visual e fonti
Fonti/materiali principali usati: INAIL, Corpo Nazionale Vigili del Fuoco, Croce Rossa Italiana, EU-OSHA/Napo. Le risorse esterne sono etichettate come `video`, `video_hub` o fonte tecnica: non dichiarare “video” ciò che è solo riferimento.

Audit asset v22 pulito; `v22_009` ha corretto `idea-safe-moves.svg` → `video-safe-moves.svg` e aggiunto gli indici FK:
- `course_scenarios_v22_scenario_idx`
- `course_practice_labs_v22_lab_idx`

## PWA / runtime
PWA: `safety-training-v22-02`.
`index.html` include Quality + Course Experience v22; service worker include gli asset v22 nell’app shell.

## CI finale
Latest functional Git HEAD prima dei soli handoff docs:
- `8597519376cfc7319598b5bc579d6b6d08818b2e` — sync `v22_009`
- GitHub Actions `SafetyTraining checks` **#321**
- run id `39060240487`
- conclusione **SUCCESS**

## Produzione Vercel
Alias: `safety-training-safety-manager.vercel.app`.

Ultimo deployment production osservato/READY:
- `dpl_APLAbwNW3FbEHoCDw7Ft18xF4RGC`
- Git SHA metadata `462df67bef8fc356a56b4dc321d5e0c2bc5c9ea2` (`v22_003` migration sync)

Il runtime servito dall’alias è però già quello v22 finale applicativo: HTTP 200 verificati direttamente in produzione per:
- `/course-experience-v22.js` = v22.007 con Fondamenti/Specifico, multi-visual e Practice Lab;
- `/course-quality-v22.js` = v22.007 con specificity gate;
- `/requirement-evidence-admin-v21.js` = v22.008, checklist pratica + `Valida pratica`, senza MutationObserver globale;
- `/sw.js` = `CACHE='safety-training-v22-02'`.

Tentato deploy esplicito del commit `8597519...`: Vercel ha risposto `402 api-deployments-free-per-day` perché superato il limite giornaliero di 100 deployment. NON modificare billing/piano automaticamente. Questo impedisce solo di riallineare il metadata SHA del deployment: `v22_009` è già applicato al DB e non contiene runtime frontend.

## Smoke
Completati:
- audit DB/copertura;
- audit asset visual;
- CI;
- HTTP production smoke degli asset v22;
- verifica runtime Practice/Quality/Gate/PWA.

NON completato: visual browser smoke interattivo reale a 1440 / 820 / 390 con click/screenshot. In questa chat non c’è un browser interattivo; non dichiararlo completato.

## Backend v21 invariato / regole da preservare
- readiness v21_024 usa test attivi + domande attive, non `bank_required`;
- `learners.company_id` = azienda corrente; storico formazione in `learner_company_training_history`;
- inviti personali multicanale con token hash, monouso, verifica identità;
- CF/PIVA unique solo tenant-scoped;
- nessuna disclosure duplicate identity cross-tenant;
- service_role server-side only;
- authorization mai da `user_metadata`;
- no password via WhatsApp/SMS;
- raw invitation token mai persistito/loggato;
- preservare fix RLS recursion;
- nessuna pubblicazione automatica di corsi/LU;
- non reintrodurre MutationObserver/polling globale nell’admin;
- `company_admin` resta disabilitato;
- SafetyManager bridge v1.2 invariato;
- Edizione `Disattiva` = archive, non hard delete.

## Prossimi passi esatti
1. Quando si resetta il limite Vercel: deploy del current `main` per riallineare il deployment metadata SHA; non serve una modifica funzionale.
2. Visual browser smoke reale 1440 / 820 / 390: Quality v22, reader con Scenario/Practice Lab, Gate pratica, più le viste admin principali.
3. E2E learner non-platform: invito → delivery → Auth → identity verify → claim → dashboard → replay rejected → cleanup.
4. Onboarding scoped admin `organization_admin|training_manager`.

## Servizi
- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `prj_u0IT97WJ3ARGJJUhuYUWA6MyS24U`
- production: `safety-training-safety-manager.vercel.app`

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

## 2026-10-18 — v22.3.2 Guida in linea estesa + studio eliminazione sicura
- Aggiunto un pulsante accessibile `?` nell'intestazione dell'amministrazione, con guida contestuale separata dal contenuto e non modale. Copertura: Dashboard, Organizzazioni, Aziende, Corsisti, Corsi, Edizioni, Iscrizioni, Attività. Testi mirati anche per Catalogo SafetyManager, Blueprint/Master Registry, Readiness, Qualità didattica, Accessi & import, requisiti pratici e fallback per ulteriori pagine.
- Nel Wizard rimane la guida `?` specifica per passaggio già disponibile, mentre il pulsante generale non compare per evitare doppioni.
- Le guide spiegano cosa fare, i passaggi operativi e i rischi su revoca, disattivazione e archiviazione, ma **non eseguono** modifiche né cancellazioni. Aggiornamento tramite chiamate esplicite dal render dell'admin e sincronizzazione dai moduli guida esistenti: nessun MutationObserver/polling globale.
- Audit read-only SQL delle FK su `companies`, `learners`, `course_editions`, `enrollments`: diverse relazioni `ON DELETE CASCADE` includono iscrizioni, storico, learning_events, learning_progress, learning_sessions, test_attempts, question_attempts, evidence e practice assessments; `companies` può alterare riferimenti/membership e storia. Non creare pulsanti di hard-delete client o abilitare `DELETE` senza RPC server-side dedicata, verifica dipendenze e audit.
- Regola futura: eventuale eliminazione fisica solo per record non utilizzati e con preview dipendenze server-side, autorizzazione specifica, conferma esplicita e controllo dopo la conferma; richieste privacy/DSR trattate separatamente. È vietato cancellare evidenze formative acquisite per ottenere una pulizia apparente.
- Nuovo modulo `admin-help-v22.js` / `admin-help-v22.css`, suite `tests/admin-help-v22.test.mjs`, aggiornato npm check, PWA cache `safety-training-v22-12`. Nessuna nuova migrazione SQL, nessun record Supabase modificato, 27 frozen e company_admin invariati.
- Restano da collaudare interattivamente con utenti di prova la guida su varie risoluzioni e le operazioni E2E di iscrizione/invito. Verificare CI e produzione dopo commit.
