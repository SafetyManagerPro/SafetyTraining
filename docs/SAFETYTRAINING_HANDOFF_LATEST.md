# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-19
Stato: **v22.14 sanzioni operative per ruoli e scenari** · sanzioni contestuali e stampa per percorso pubblicati · admin v21 preservato · PWA `safety-training-v22-41`.

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

## 2026-10-18 — v22.3.3: fix pulsanti Elimina… realmente visibili
- Diagnosi: la logica di anteprima precedente era nel modulo guidance che ritornava prima dell'iniezione sui tab Aziende, Corsisti, Edizioni, Iscrizioni; inoltre l'aggiornamento era stato incompleto. Rimosso il codice di anteprima non raggiungibile.
- Ora ogni riga di Aziende/Corsisti/Edizioni/Iscrizioni espone direttamente `Elimina…` nella tabella primaria, senza observer o timer. La funzione apre una finestra con lettura delle dipendenze (FK note) e verifica anche account corsista e attività già iniziata, evidenziando gli esiti non verificabili.
- L'interfaccia segnala che l'hard delete NON è ancora abilitato: **non** chiama .delete(), non modifica dati e non nasconde il fatto che i conteggi client sono indicativi (RLS, concorrenza). È necessario approvare e implementare un controllo server-side transazionale auditato prima dell'eliminazione effettiva.
- Test di regressione aggiunto per presenza dei quattro pulsanti e relativo handler; PWA v22-13. Nessuna modifica DB, RLS, company_admin, 27 corsi frozen.

## 2026-10-18 — v22.4 pianificatore selettivo eliminazioni (SOLO simulazione)
- Le quattro azioni «Elimina…» (Aziende, Corsisti, Edizioni, Iscrizioni) aprono adesso il wizard di selezione delle dipendenze: singole voci, selezione di tutti i candidati, deselezione, scelta opzionale del record principale se ogni vincolo indicativo è risolto, riepilogo con elementi scelti e conservati.
- Nuovo modulo isolato `admin-delete-planner-v22.js` / CSS; nessuna modifica alle chiamate di revoca, disattivazione, archivio, allineamento cataloghi o completamento.
- Rigorosamente **nessuna cancellazione reale**: il passaggio conferma è disabilitato finché non esiste una transazione autorizzata e auditata sul backend. Categorie con storico, progressi, prove, appartenenze non esaminate sono protette/da verifica manuale. Iscrizioni solo status not_started, progress zero e senza attività = candidati, mai approvate automaticamente. Inviti solo falliti/revocati senza auth collegata = candidati. Controlli non disponibili e risultati troncati bloccano.
- Non assumere mai che zero riferimenti lato client sia prova di assenza nel DB (RLS e concorrenti). Futuro: implementazione server su database di staging con classificazione atomica e audit; NON attivare DELETE lato client.
- Suite Node dedicata alla classificazione e pianificazione, cache PWA `safety-training-v22-14`; nessuna migrazione, schema SQL o dato reale alterato; 27 frozen e company_admin invariati.

## 2026-10-18 — v22.4.1: risoluzione contestuale delle dipendenze
- Dal pianificatore di eliminazione è disponibile «Dettagli / gestisci →» su ogni singolo collegamento, anche protetto o «Da verificare / scollegare». Il sottopannello mostra solo attributi approvati, mai token/hash d'invito, password, metadata interni o JSON grezzo.
- «Apri e modifica» naviga verso gli editor amministrativi esistenti per aziende/corsisti/edizioni, mette a fuoco l'iscrizione quando disponibile; «Gestisci inviti» apre il modulo inviti del corsista e «Apri ruoli amministrativi» apre la sezione esistente. Le informazioni formative protette restano in consultazione, senza modifica automatica.
- I salvataggi delle schede continuano a passare per gli handler autorizzati preesistenti, mantenendo regole di ruolo. Non è stato attivato nessun DELETE e l'operazione principale resta disabilitata.
- Principio di prodotto: interfaccia leggera per attività guidate interne e tutela del fascicolo per corsi ufficialmente documentati. Non equiparare «formazione interna» a esenzione dagli obblighi, né declassare retroattivamente percorsi con evidenze. Valutare una futura classificazione esplicita delle edizioni soltanto dopo validazione normativa e migratoria.
- Aggiunti test specifici per drilldown, dati sensibili e destinazioni gestibili. PWA safety-training-v22-15. Nessuna migrazione SQL e nessun record reale modificato durante l'aggiornamento.

## 2026-10-18 — v22.4.2 Correzione filosofia: eliminazione sotto controllo dell'amministratore
- Istruzione vincolante dell'utente: NON introdurre distinzioni/blocchi basati sulla tipologia «corso regolamentato» vs «formazione interna». L'amministratore può pianificare l'eliminazione anche delle dipendenze sensibili, previa visualizzazione degli effetti e conferma informata. L'etichetta di rischio non è un veto per la selezione.
- Su OGNI dipendenza visibile, nel pannello «Elimina…» è ora disponibile la scelta «Conserva», «Elimina», «Scollega» solo se la relativa FK può essere NULL secondo schema DB; il comando globale imposta l'eliminazione di tutte le voci elencate. Sono conservati i pulsanti di dettaglio e gli editor esistenti.
- Per includere anche il record principale devono avere risoluzione tutte le dipendenze mostrate; verifiche incomplete o identità di autenticazione ancora collegata impediscono la pretesa di completezza. Il riepilogo segnala le scelte sensibili e gli effetti a cascata potenziali.
- Fase esecutiva di cancellazione ANCORA NON DISPONIBILE: nessuna eliminazione può partire dal client. Prima di attivare serve endpoint transazionale server, inventario di riferimenti indiretti, conferma e audit. La volontà dell'admin non giustifica cancellare in silenzio documenti non mostrati né eludere obblighi di legge; mostrarli chiaramente. Nessuna modifica DB o a 27 frozen e company_admin. Cache PWA v22-16.

## 2026-10-18 — v22.4.3 Verifica strutturale del pianificatore di eliminazione
- Individuato e corretto un bug reale: due tabelle referenziate non hanno `id`; `learning_progress` usa la PK composta `(enrollment_id,unit_version_id)`, `integration_training_contexts` usa `(source_system,external_project_id)`. Il vecchio selettore `<tabella>:undefined` produceva identificatori ambigui. Adesso i record hanno chiavi distinte e verificabili, con blocco cautelativo del riepilogo se manca una parte della chiave.
- Le query del popup ora richiedono proiezioni minime e definite per le 15 tabelle coinvolte, anziché `SELECT *`. Gli hash e i metadati degli inviti non vengono più trasferiti all'interfaccia.
- Etichetta dell'azione di massa chiarita: si applica alle voci effettivamente caricate (massimo 80 per gruppo), non ai collegamenti non restituiti. Dettaglio dello storico coerente con scelta admin-first, sempre senza esecuzione reale.
- Aggiunti test unitari con lettore Supabase simulato per i due casi a chiave composta e controllo delle proiezioni. Nessuna mutazione su Supabase; conferma eliminazione ancora disabilitata. PWA `safety-training-v22-17`.

## 2026-10-19 — v22.5 predisposizione UI eliminazione reale con fail-closed server
- Utente ha scelto di proseguire senza collaudare il ripristino: esiste backup locale .stbackup creato e indice interno verificato su Windows; rischio esplicitato.
- Verifica live DB in sola lettura: **nessuna** RPC amministrativa esistente di eliminazione. Vincoli ON DELETE CASCADE sono presenti; ulteriore rilevazione: `test_attempts -> test_answers` CASCADE e `learning_sessions -> learning_events` CASCADE, `learning_sessions -> question_attempts` SET NULL. Il riepilogo locale ora segnala questi effetti indiretti possibili senza inventare conteggi.
- Frontend ora predisposto per `admin_delete_capabilities_v25` (deve restituire `{version:'v25',ready:true}`), `admin_preview_deletion_v25` (deve restituire `{safe:true,preview_token,impact:[]}` verificando selezione e riferimenti) e `admin_execute_deletion_v25` (deve richiedere il token vincolato alla preview e la conferma esatta `ELIMINA <UUID>`). In nessun caso il browser lancia `.delete()`.
- Senza RPC backend installate la verifica server fallisce chiusa, segnala funzione non pronta e non abilita la conferma distruttiva. UI e test predisposti, ma **NON dire che la cancellazione effettiva funziona in produzione**.
- Il tentativo precedente di installare la RPC server era bloccato dai controlli di sicurezza della piattaforma. Non tentare di aggirare quel blocco né distribuire funzioni distruttive non verificate. Necessaria valutazione/abilitazione attraverso ambiente autorizzato prima del completamento reale.
- Aggiornare entrambi i handoff; PWA `safety-training-v22-18`. I 27 corsi frozen e i dati live non sono stati modificati. Nessuna modificazione dello schema Supabase.

## 2026-10-19 — v22.5.1
- Applicata migrazione `v22_013_admin_deletion_read_only_preview` su Supabase produzione. RPC `admin_delete_capabilities_v25` e `admin_preview_deletion_v25` funzionano in sola lettura. `admin_execute_deletion_v25` NON esiste (verificato).
- La preview richiede un amministratore autenticato; controlla identificativi selezionati, legami con record radice e conta FK dirette visibili. Non è una preflight transazionale completa; la risposta mantiene `safe:false`, `execution_ready:false`, nessun token di esecuzione. I risultati possono dipendere dalle policy RLS.
- UI ora mostra i risultati della preview server anche se l'eliminazione non è pronta, senza mostrare il pulsante distruttivo.
- Nessuna cancellazione di dati effettuata. PWA `safety-training-v22-19`.

## 2026-10-19 — v22.5.2
- Installata e verificata su Supabase migrazione `v22_014_admin_deletion_indirect_read_only_preview`. Conteggi informativi RLS-visible di iscrizioni, sessioni, test, risposte, eventi, progressi, evidenze, valutazioni e storico nelle cascades raggiungibili dalle selezioni esplicite. Distingue `SET NULL` di question_attempts da CASCADE. Conteggi non equivalgono a certezza transazionale o copertura di ogni vincolo.
- Funzione `admin_execute_deletion_v25` assente; capability `ready:false`, `execution_enabled:false`. Nessun record modificato. Il frontend ora mostra warnings server. PWA `safety-training-v22-20`.
- Nota sicurezza: sulle tabelle aziende, corsisti, edizioni, iscrizioni sono esistenti GRANT DELETE a authenticated/anon e policy RLS che possono consentire delete ad alcuni ruoli. Prima di abilitare esecuzione RPC, effettuare audit completo e rimuovere eventuali bypass senza rompere flussi autorizzati.

## 2026-10-19 — v22.5.3 client DELETE privilege closure
- Audit production: 13/16 relevant tables initially exposed DELETE privilege to anon/authenticated, subject to RLS. The remaining 3 were already restricted.
- Applied Supabase migration `v22_015_revoke_direct_delete_client_roles` on 16 named public tables. Verified `client_delete_remaining=0`, `service_role_delete_available=16`. SELECT / INSERT / UPDATE not intentionally changed; zero row modifications.
- No currently inspected app modules issue direct database `.delete()` on protected records. All destructive procedures remain disabled. `admin_execute_deletion_v25` not installed.
- Future server transaction MUST implement explicit audit, whitelist, relationship re-evaluation, strong admin auth, policy-scoped permissions and dry-run testing on separate database before enabling. No production delete tests.
- PWA `safety-training-v22-21`; all follow-up modifications require updating both handoffs.

## 2026-10-19 — v22.5.4 blocked transactional backend / fail-closed client
- Privileged DB function inspection was blocked by platform security controls; do not retry through alternative channels or paths. No destructive backend RPC installed or executed.
- Client now requires server execution_enabled true, ready true, complete impact graph, confirmed audit, a sufficiently long preview token, and every impacted row acknowledged individually. Warnings, hidden cascades, missing token and incomplete data disable execution.
- Server preview remains informational and no execution RPC exists. CI tests cover read-only response and contract failures.
- PWA safety-training-v22-22. Final step requires authorized isolated database validation and release review.

## v22.5.4 release gate
Created docs/ADMIN_DELETION_RELEASE_GATE_V25.md with an explicit NO-GO release gate: full graph, scoped actor, token, locking, server audit, isolated synthetic tests, no privileged-function inspection bypass. The real deletion RPC remains absent. See document before any request to enable hard delete.

## 2026-10-19 — audit post eliminazione prova
- Confermato con query di sola lettura su Supabase produzione: azienda prova `183de1f8-49a2-4fe3-88fa-a9fd244ffa94`, corsista prova `c80bd514-c2e3-4ab3-8634-c474247dfa7a`, iscrizione prova `7f9829dc-9571-451b-b930-6da7ab15f0fc`: zero record rimanenti.
- Edizione condivisa `e6d93a54-d652-4990-98ee-3c06bd2e80c4`: 1 presente; altre iscrizioni `35c35f90-fdbd-478a-b428-65d25c85ca8d` e `d1f404cf-2ba8-4c87-a4fe-a3f71b9289d5`: 2 presenti; rispettivi storici: 2 presenti.
- Nessuna riga in `public.audit_log` reperita usando ID eliminati o action contenente delete/elimin. Non dichiarare che esista audit dell'eliminazione; verificare se esiste audit in altra sede prima di concludere assenza assoluta.
- Nel progetto `ejkwvatmzdqqjozpxntk` risultano solo RPC `admin_delete_capabilities_v25` e `admin_preview_deletion_v25`; nessuna RPC server di esecuzione reale installata. Non abilitare il pulsante eliminazione definitiva sulla base del test manuale.
- Il ripristino del backup .stbackup locale non è stato collaudato. L'utente ha richiesto di proseguire con i controlli e con il completamento del modulo amministrativo.

## 2026-10-19 — v22.6 Controllo percorsi / quadro trasversale (frontend read-only)
- Nuova scheda amministrativa `Controllo percorsi` (file `admin-path-audit-v23.js`), visibile nella navigazione. Seleziona una edizione e riunisce iscrizioni, anagrafica, avanzamento Learning Unit, frequenza/sessioni/tempi, test, evidenze requisiti e valutazioni pratiche. Link alle viste qualità didattica e readiness già operative.
- Nessuna emissione attestato automatica: sempre `Da verificare manualmente`, con avviso su formazione pratica, firme, registri cartacei e requisiti normativi. I tempi attivi non certificano le presenze. Le iscrizioni revocate restano identificabili. Sessioni non concluse, anagrafica assente e anomalie tra somma sessioni e tempo iscrizione vengono segnalate senza alterare dati.
- Query RLS lato client, limitate a 100 edizioni, 100 iscrizioni per edizione e 1000 righe per tipo di dipendenza; dati parziali segnalati e nessuna decisione di completamento. L'utente deve poter verificare il percorso senza modifiche DB.
- Aggiunti test unitari di diagnosi e guardie anti-mutazione, guida contestuale, asset PWA `safety-training-v22-23`. Non toccati catalogo frozen, Supabase o cancellazione definitiva.
- Backlog residuo: approfondimenti LU nei corsi non congelati, validazione fisica/frequenza, firme/registri duali cartaceo-digitale, generatore attestati con regole; ancora non dichiarati implementati.

## 2026-10-19 — v22.6.1 backlog didattico operativo
- Quality dashboard ordina i corsi non frozen per priorità dei gap (prima Learning Unit e verifiche, quindi specificità scenari/pratica, poi fonti/media/visual). Per ogni corso visualizza una prossima azione didattica concreta, senza variare quality score o stato di pubblicazione. I 27 frozen rimangono esclusi dall'RPC esistente. Test su ordinamento e suggerimenti.
- Verifica read-only catalogo Supabase: 92 corsi, 27 congelati; 1 edizione, 2 iscrizioni revocate, 0 sessioni, 0 tentativi test, 0 evidenze requisiti e 0 valutazioni pratiche. Non produrre completamenti artificiali.
- PWA safety-training-v22-24. Attestati, registri di frequenza legale e nuove Learning Unit richiedono ulteriori implementazioni e convalida; nessuna automazione di rilascio.

## 2026-10-19 — v22.6.2 scheda cartacea istruttoria (non attestato)
- Nel nuovo Controllo percorsi aggiunto comando utente `Stampa scheda istruttoria`: stampa per edizione il quadro didattica/frequenza/verifiche/documentazione e una checklist cartacea con firme responsabile/docente. CSS di stampa separa contenuto dal menu; PWA safety-training-v22-25.
- La scheda è chiaramente marcata NON È UN ATTESTATO e non conferisce validità legale né sostituisce registro/firme effettivi. Nessuna scrittura DB, firma digitale o emissione automatica.
- Proseguire in fasi successive con registro cartaceo+digitale, regole normative per durata/verifica/attestato e approvazione umana; evitare qualsiasi autocertificazione basata solo su cronometro online.

## 2026-10-19 — v22.6.3 attenzione heartbeat frequenze
- Controllo percorsi: lettura del campo `learning_sessions.last_heartbeat_at` e nuovi avvisi per sessioni aperte senza heartbeat o con heartbeat oltre 15 minuti; queste segnalazioni sono informative e richiedono riconciliazione manuale. Test di regressione aggiunto. PWA `safety-training-v22-26`.
- Audit del catalogo read-only: diversi aggiornamenti attrezzature (4h) hanno una sola LU pubblicata. Prima di ampliare contenuti o dichiarare un percorso conforme va verificata struttura, ripartizione teorico/pratica e fonti applicabili; nessuna modifica dei corsi congelati o dei contenuti formativi in produzione in questa fase.

## 2026-10-19 — v22.6.4 registro presenze cartaceo da iscrizioni
- Aggiunta a Controllo percorsi l'azione `Stampa registro presenze`: foglio stampabile per la specifica edizione, con elenco corsisti non revocati, campi VUOTI per data/sede/docente/orari entrata/uscita/ore convalidate/firme corsista-docente e annotazione anomalie. Esclude le iscrizioni revocate dal prospetto; non usa le ore tecniche come ore convalidate. Lo stampa solo se i dati letti sono completi e c'è almeno una iscrizione attiva.
- Registro chiaramente NON È ATTESTATO né prova di presenza già verificata; non scrive né valida automaticamente dati nel database. La scheda istruttoria precedente rimane separata. Aggiornato CSS stampa, test su firme vuote, esclusioni, dati parziali e escaping.
- PWA safety-training-v22-27. Sviluppo rimasto: validazione digitale delle presenze, eventuale firma elettronica a norma e gestione attestati.

## 2026-10-19 — v22.6.5 bozze didattiche carrelli e PLE, non pubblicate
- Creato `didactic-review-candidates-v23.js` con due bozze approfondite visibili in Qualità didattica v22 per le chiavi dei corsi `agg_attr_carrelli_ind_4h` e `agg_attr_ple_4h`. Quattro stazioni didattiche proposte (60 minuti ciascuna, da validare) con obiettivi verificabili, istruzioni operative controllate, scenari, criteri di osservazione del docente e condizioni di arresto. Carrelli: checklist pre-utilizzo, interferenze pedoni/carico cieco, stabilità, anomalie e debrief; PLE: terreno/interferenze, controlli della macchina, manovre supervisionate, comunicazione e gestione emergenza.
- Sono bozze amministrative per revisione, NON contenuti delle Learning Unit pubblicate. Il numero di minuti proposti NON convalida frequenze/pratica obbligatoria. Verificare il programma specifico, il manuale, i rischi aziendali e le disposizioni applicabili prima di creare nuove versioni dei contenuti. Nessuna scrittura Supabase né cambiamento a corsi frozen.
- Test sulle bozze e sul collegamento nella dashboard, PWA `safety-training-v22-28`. Il controllo precedente dei registri presenze (`v22.6.4`) resta disponibile.

## 2026-10-19 — v22.6.6 separazione stampe
- I due flussi di stampa ora sono distinti anche a livello CSS: `Stampa scheda istruttoria` non allega il registro firme vuoto, `Stampa registro presenze` non stampa altri cruscotti. Test di regressione aggiunto. Cache PWA safety-training-v22-29. Nessuna modifica database.

## 2026-10-19 — v22.7 laboratori didattici integrati (due corsi attrezzature)
- Applicata migrazione Supabase `v22_016_equipment_in_person_refresher_instructor_workshops`: creati 2 laboratori pratici specifici in `practice_labs_v22`, collegati con `course_practice_labs_v22` a `agg_attr_carrelli_ind_4h` e `agg_attr_ple_4h` come terzo laboratorio, `required=false`, `requires_physical_validation=true`, `training_mode=in_person_practice_only`. Contenuti: quattro stazioni di esercitazione per ciascun corso, con sequenza operativa, checklist, errori critici e condizioni di fermo. Questi due corsi risultavano già con due laboratori preesistenti, mantenuti.
- Verifica read-only post migrazione: entrambi i link presenti e ogni nuovo laboratorio ha 4 fasi; nessuna iscrizione, LU pubblicata o corso frozen modificato.
- Frontend Course Experience mostra avviso specifico 'Aggiornamento attrezzature: presenza fisica obbligatoria' per i due laboratori. Il digitale non sostituisce il programma pratico. Fonte di riferimento ministeriale: FAQ accordo 2025 su aggiornamento attrezzature.
- Migrazione SQL integrale recuperabile da cronologia Supabase; manifest descrittivo in `supabase/migrations/20261019202500_v22_016_equipment_workshops_record.sql` NON eseguibile.
- PWA `safety-training-v22-30` e test anti-autocertificazione. Revisioni istruttore e conformità per uso nel mondo reale restano necessarie, ma non blocco editoriale per materiale di supporto.

## 2026-10-19 — v22.8 stampa lezioni per singolo corso
- Nuova sezione amministrazione `Stampa lezioni` con selettore corso e versione pubblicata; carica moduli e Learning Unit dalla DB tramite query limitate e complete con RLS; stampa o Salva PDF dal browser con copertina, indice, titoli dei moduli e testi dei contenuti (sintesi, obiettivi, rischi, misure, procedure, sezioni operative, esempi, schemi locali e fonti). L'accesso è verificato su platform_admins; la UI non registra presenze né emette attestati.
- I campi di quiz, risposte, soluzioni, valutazioni finali, metadati e note riservate non vengono stampati; rendering HTML escaped e immagini limitate agli asset interni locali. Se moduli/unità non completamente leggibili, blocco cautelativo. La stampa è specifica per versione pubblicata e diversa dalle stampe di registro presenze e scheda istruttoria.
- CSS A4 con interruzioni copertina/indice/moduli; pulsante Salva PDF usa dialog stampa browser (nessun file PDF pre-generato); guida contestuale, test e PWA safety-training-v22-31. Non modificati corsi frozen e versioni pubblicate in DB.

## 2026-10-19 — v22.8.1 sanzioni contestuali nelle lezioni e nella stampa
- Nuovo modulo `normative-sanctions-v23.js`: schede di studio collegate al testo della LU per DVR, nomina RSPP, formazione, DPI, preposto/vigilanza, medico/sorveglianza, attrezzature, cantieri/committente/CSP/CSE, progettisti/fabbricanti, autonomi, RLS. Distinzione chiara tra obblighi datore/dirigente, preposto, lavoratore e altre figure, e tra sanzione diretta e responsabilità eventuale.
- Fonti pubbliche MEF D.Lgs. 81/2008 testo vigente e art. 55 modificato 2026; riferimenti specifici agli articoli 55–60, 87, 157, 158, 160 quando pertinenti. Non riportati importi in euro: richiedono verifica per fattispecie e rivalutazione alla data della violazione. Il testo è esplicitamente didattico e non attribuisce automaticamente colpa.
- App desktop presenta schede normative soltanto per topic DB-backed di corsi non frozen; il modulo stampa lezioni include le medesime schede per le unità pertinenti. Nessuna modifica dei contenuti o degli status nel database.
- CSS stampa e visualizzazione, test contestuali, PWA safety-training-v22-32. Revisione periodica normativa e ampliamento delle fattispecie specifiche rimangono nel backlog.

## 2026-10-19 — v22.8.2 contenuti operativi completi nella stampa
- Esteso il render sicuro delle dispense per leggere anche `operational.before`, `during`, `after`, `step_by_step`, `if_problem`, `who_to_involve`, `remember`, `adaptation`, la guida `guided.observe/importance/apply`, `deepdetail`, e schemi locali `idea_images` tramite whitelist asset. Continua l'esclusione di quiz, risposte e metadati riservati.
- Test stampa casi complessi aggiunto. PWA `safety-training-v22-33`, entrambe le consegne aggiornate.

## 2026-10-19 — v22.9 controllo completezza della dispensa e tracciabilità del progetto
- **Stampa lezioni / singolo corso:** ora esegue un preflight esplicito prima di abilitare la stampa: contatori visibili di moduli e Learning Unit, controllo che ogni modulo contenga unità, che ogni versione LU collegata sia pubblicata e che ogni unità contenga sezioni realmente stampabili secondo la whitelist sicura. Se manca anche un requisito, **stampa bloccata**, senza creare una dispensa apparentemente completa. Il preflight è tecnico, non verifica conformità giuridica o qualità didattica.
- **Integrità contenuti e permessi:** nessuna modifica DB; continuano le verifiche platform-admin, RLS, limiti query e omissione di quiz/soluzioni/informazioni riservate. Ricognizione read-only: tutte le **455** associazioni LU di versioni corso pubblicate puntano a versioni LU pubblicate (al momento del controllo); in produzione esistono **69** versioni corso pubblicate. Restano da verificare su browser reale resa di dispense molto lunghe ed immagini.
- **Tracciabilità:** aggiornate in testa data, stato e cache PWA in entrambi gli handoff. Aggiunto test CI `handoff-sync-v23.test.mjs`: impedisce cambi di versione PWA senza aggiornare i due promemoria e assicura che l'ultima voce cronologica coincida nei due documenti.
- PWA `safety-training-v22-41`. Cancellazione effettiva rimane sospesa. Restano frozen 27 corsi; nessuna modifica alle loro lezioni. 

## 2026-10-19 — v22.10 riscontro dispense e pertinenza sanzioni
- **Stampa lezioni, affidabilità:** corretto `renderValue` affinché i titoli senza testo o liste vuote non contino come materiale didattico stampabile; il preflight blocca la dispensa se una LU manca di contenuto realmente renderizzabile. Se il caricamento di una versione fallisce, restano visibili i selettori corso/versione (possibile scegliere un altro corso anziché restare intrappolati su Riprova).
- **Sanzioni contestuali:** attivazione delle schede solo sui temi effettivamente insegnati in titolo/sommario, non sui richiami generici di bibliografia o negli approfondimenti: niente blocco sanzioni spurio nelle lezioni non pertinenti. Link stabili a Normattiva D.Lgs. 81/2008 e testo coordinato INL gennaio 2026. L'informazione è didattica, non un'attribuzione di responsabilità; per importi e norme applicabili si controlla sempre la versione vigente alla data dei fatti.
- **Test aggiunti:** blocco sezioni vuote, ripresa selezione dopo errore, filtro bibliografico e fonti ufficiali, più test handoff allineato alla nuova voce v22.10. Cache PWA `safety-training-v22-41`. Nessuna modifica a Supabase, corsi congelati, presenze o attestati. Resta il collaudo grafico di stampa A4 con browser e una revisione periodica delle fattispecie sanzionatorie.

## 2026-10-19 — v22.10.1 correzione test cache dinamica
- Prima CI del commit v22.10 fallita per un'asserzione obsoleta in `tests/v22-runtime-guards.test.mjs` ancora ancorata a `safety-training-v22-34`, mentre il cache name ora è `safety-training-v22-41`. Il controllo è stato reso indipendente dal numero incrementale: convalida lo schema del nome cache; l'esatto valore e la presenza in ENTRAMBI gli handoff restano verificati da `tests/handoff-sync-v23.test.mjs`.
- Non sono state modificate le funzioni, i database, i corsi o il cache identifier; la regressione proveniva soltanto dall'asserzione del test. Nuova CI necessaria per dichiarare il rilascio verificato.

## 2026-10-19 — v22.11 A4 per percorsi formativi lunghi
- **Stampa lezioni:** indice multilivello per moduli e tutte le Learning Unit con collegamenti agli ID univoci nella dispensa; il numero delle unità e la versione restano quelli realmente letti dalla versione pubblicata. La stampa completa resta la scelta predefinita, senza omissioni selettive.
- **Preflight immagini:** tutte le immagini interne sono verificate prima di abilitare la stampa; se uno schema non carica, il pulsante rimane disabilitato e compare il percorso di riferimento dell'asset mancante. Verifica con timeout per prevenire attese illimitate; nessuna sostituzione automatica di immagini o modifiche ai contenuti.
- **CSS A4:** margini di 17/14/18 mm; numero di pagina nel margine tramite CSS `@bottom-right` dove supportato dal browser; moduli su pagina nuova, indice libero di estendersi su più pagine, schemi ridimensionati a 95 mm, capitoli/elenchi lunghi spezzabili senza tagliare testo, nessuna stampa di `(#anchor)` dopo i link interni.
- **Test automatici:** dispensa sintetica lunga (7 moduli, 126 LU), unicità degli ancoraggi, nessuna fuga di risposte dei test, controllo di immagini mancanti e verifica strutturale delle regole CSS. Restano necessari controllo visivo della stampa A4 su Chrome/Edge e Firefox e controllo di immagini reali; i test non costituiscono prova grafica.
- Cache PWA `safety-training-v22-41`. Nessuna scrittura DB e nessuna modifica a corsi frozen (27), iscrizioni, presenze, attestati o backend cancellazione (sospeso).

## 2026-10-19 — v22.11.1 indice multipagina robusto
- Rifinita la regola A4 degli indici lunghi: una voce modulo con molte lezioni può attraversare una interruzione di pagina (`break-inside:auto` sul contenitore), mentre i singoli collegamenti brevi delle LU restano uniti (`break-inside:avoid`). Evitato l'effetto di blocchi di indice troppo alti per una pagina.
- Aggiunto test CSS dedicato. Rimangono da collaudare visivamente browser/stampanti; il test strutturale non simula un motore di impaginazione. Invariati DB, PWA cache `safety-training-v22-41`, dati formativi e corsi congelati.

## 2026-10-19 — v22.12 HOTFIX stampa bianca
- Segnalazione utente: **la stampa del singolo corso restituisce pagine completamente bianche**. Diagnosi del codice: il documento veniva stampato all'interno di `#adminShell .admin-main`, pannello full-screen/fixed e internamente scrollabile (`height:100vh; overflow:auto`), con tentativi di nascondere il resto della pagina tramite `visibility:hidden` e riabilitare selettivamente i discendenti. Il comportamento era fragile e poteva impedire al motore di stampa di creare pagine visibili. Non sostenere che la causa specifica sia provata senza una riproduzione browser.
- **Correzione strutturale:** al click stampa, la stessa dispensa già caricata (compresi immagini e testi verificati) viene TEMPORANEAMENTE spostata in `#safetyPrintStage`, un contenitore top-level direttamente dentro `<body>`, fuori dal pannello amministrativo. Lo stile print nasconde l'intera console con `display:none` e rende stampabile solo quel contenitore statico con `height:auto`, `overflow:visible`, colori scuri su fondo bianco. Al `afterprint`, dispensa e DOM originali vengono ripristinati; nessun contenuto duplicato o perso. Nessuna mutazione database.
- Nuovi test di regressione: trasferimento del nodo DOM e ripristino idempotente dopo stampa, non visibilità nascosta dei genitori, CSS print A4 con struttura indipendente dal pannello, indici lunghi e schemi mantenuti. PWA `safety-training-v22-41`.
- Nota: questa correzione richiede verifica visiva nel browser reale dell'utente, che ha riscontrato il bug. Se persistesse, raccogliere browser/versione e screenshot dell'anteprima prima di cambiare altro.

## 2026-10-19 — v22.13 Stampa slide reali, 2 per A4 bianco
- Aggiunta sezione Amministrazione `Stampa slide`, distinta da `Stampa lezioni`, registro e attestato: selezione corso e versione **pubblicata**; accesso verificato in `platform_admins`, query bounded/RLS riusando `SAFETY_ADMIN_PRINT_LESSONS_V23.loadBook` con preflight completo. Nessuna mutazione DB.
- **Fedeltà visiva:** riutilizza esattamente `SAFETY_DB_SLIDES.adaptBundle`, `buildDeck` e `deckSlideBody` del motore proiettore di `app.js` (esportazione read-only `SAFETY_DECK_RENDER`), anziché ricostruire una semplice dispensa testuale. Costruzione di ogni slide con titoli, grafica SVG/media, box, casi e opzioni delle verifiche visibili, ma eliminando i pulsanti/controlli di rivelazione e **senza esporre la risposta corretta**. Limitati gli URL delle immagini ad asset locali; caricamento immagini verificato prima di abilitare la stampa.
- **Impaginazione:** A4 verticale, foglio bianco, due cornici 16:9 per pagina, ordine delle slide originali, indicazione corso/modulo/numero, sfondi della diapositiva schiariti per la stampa e `print-color-adjust: exact` quando supportato. Trasformazione delle slide logiche 1600×900 a scala misurata dal contenitore. Stampa solo da stage top-level temporaneo fuori dal pannello scrollabile, ripristinato al termine, per evitare il precedente bug delle pagine bianche.
- **Sicurezza/limiti:** se mancano LU, versioni pubblicate, immagini, o il deck supera il limite prudenziale di 700 slide, la funzione blocca la stampa invece di produrre materiale incompleto. Non stampa risposte riservate, dati dei corsisti né attestati. Test N=5/2 per pagina, URL media, blocco cap, riuso motore, CSS e rimozione comandi. Test browser visivo su A4 resta necessario; il numero di pagine effettivo può variare con impostazioni browser/stampante.
- Cache PWA `safety-training-v22-41`. Nessuna modifica a Supabase, ai corsi frozen (27), alle versioni già pubblicate, a frequenze, attestati o cancellazione definitiva sospesa.

## 2026-10-19 — v22.13.1 HOTFIX immagini slide mancanti (`assets/undefined`)
- Segnalazione utente: `Immagine della slide non ammessa per stampa: assets/undefined` nella funzione Amministrazione → Stampa slide. Causa individuata nel motore originale: `buildDeck` creava slide di tipo `graphic` usando incondizionatamente `assets/${g.image}`; per le schede grafiche senza proprietà `image` risultava la stringa letterale `assets/undefined`. Anche `getTopicImage` selezionava indiscriminatamente la prima `idea_images`.
- **Correzione motore** `app.js`: per `graphic_cards` senza immagine valida utilizzare la seconda immagine disponibile del topic (`img2`) invece di costruire il percorso undefined; `getTopicImage` cerca un'immagine con campo file utilizzabile e, in assenza, mantiene il fallback visivo del topic.
- **Correzione stampa** `admin-print-slides-v23.js`: fallback circoscritto a `assets/undefined`, `assets/null`, `assets/NaN` o `assets/` con schema locale sicuro `assets/general.svg`. Gli URL esterni, path traversal e percorsi malformati restano bloccati e le immagini reali vengono ancora controllate prima della stampa. Le slide e i loro testi non vengono saltati.
- Test di regressione per rendering dello schema fallback, blocco URL non sicuri, controllo generazione `graphic_cards`, cache PWA `safety-training-v22-41`. Nessuna mutazione Supabase, corsi frozen, presenze, attestati o cancellazione sospesa. Serve conferma dell'anteprima su browser reale.

## 2026-10-19 — v22.13.2 copertura reale dei test di stampa
- Audit `package.json`: `npm run check` / GitHub Actions `syntax` eseguiva solo un sottoinsieme di test storici, non `tests/admin-print-slides-v23.test.mjs`; ciò rendeva il primo CI verde del fix immagini insufficiente come verifica. Integrati nel check CI i controlli sintattici dei due moduli di stampa e gli eseguibili di test `admin-print-slides-v23`, `admin-print-lessons-v23` e `handoff-sync-v23`.
- Irrigidito `safeSlideImage`: nomi fittizi tipo `assets/undefined.svg`, `assets/null.png` e `assets/NaN.svg` non sono accettati come immagini vere; i soli placeholder esplicitamente mancanti continuano a essere sostituiti dallo schema locale `assets/general.svg`. URL esterni e percorsi sospetti restano bloccati. Aggiornato test di regressione per verificare l'esecuzione della suite specifica nel workflow.
- Nessuna modifica ai dati Supabase, corsi frozen, presenze o attestati. Cache PWA invariata `safety-training-v22-41` perché il fix riguarda validazione lato JS e la cache usa network-first per gli asset `.js`. Attendere verifica CI su commit finale.

## 2026-10-19 — v22.13.3 CI verde per fix immagini
- Il nuovo check CI esegue effettivamente i test della stampa delle slide: prove dei fallback e dei blocchi URL superate. La prima esecuzione del workflow ampliato ha fallito solo perché l'asserzione `tests/handoff-sync-v23.test.mjs` richiedeva una sottoversione specifica `v22.13.1` pur essendo già registrata `v22.13.2` in entrambi i documenti. Sostituita con controllo stabile sulla linea v22.13, mentre il medesimo test continua a imporre l'identità esatta delle intestazioni ultime tra i due handoff e della versione PWA corrente.
- Non mutate versioni delle slide, dati Supabase, corsi congelati, presenze o attestati. Per giudicare il rilascio attendere conclusione CI sul commit finale.

## 2026-10-19 — v22.13.4 fix A4 due slide fuori margine
- Segnalazione utente: le due slide del corso sforano dai margini e finiscono su pagine diverse. Individuato accoppiamento inaffidabile fra `scaleSlides()` calcolato sulla larghezza dell'anteprima a schermo e geometria della stampa A4; inoltre il precedente `.slide-print-sheet` alto 272mm lasciava solo 3mm di margine dopo le impostazioni `@page` e poteva favorire overflow/duplicazioni di pagina.
- **Correzione fisica:** A4 verticale con margini 14mm, area stampabile 182×269mm. Un foglio ha width 180mm e altezza 250mm; layout grid con due slot da 112mm separati da 10mm. Cornici 16:9 larghe 172mm e alte 96,75mm, didascalie 4mm, spazi verticali di sicurezza e nessuno scorrimento; in stampa ogni slide logica 1600×900 è scalata via CSS `transform:scale(0.40)!important`, ossia ~169,3×95,25mm, inferiore alla cornice. Non dipende più dalla misurazione a schermo.
- **JS:** `scaleSlides()` ora non modifica i `transform` inline durante lo stato `admin-slides-print`, evitando collisioni con le misure fisiche `@media print`. La preview web mantiene lo scaling responsivo. Il documento rimane su stage body-level indipendente, preservando workaround stampa bianca.
- **Test automatici:** parsing dei valori reali CSS e assert geometrici A4 (margini, slot, ratio, scale interna), separazione trasformazione stampa/preview, due slide/foglio, test precedenti immagini e sicurezza. Test CI + deploy da verificare sul commit; la prova visiva su browser/stampante reali rimane una verifica ulteriore e non va dichiarata completata senza effettuarla.
- Cache PWA `safety-training-v22-41`; aggiornati entrambi handoff. Nessuna modifica a Supabase, ai 27 corsi frozen, presenze, attestati o cancellazione definitiva sospesa.

## 2026-10-19 — v22.14 sanzioni per scenari reali e controllo delle responsabilità
- Segnalazione utente: la nuova stampa slide 2/A4 funziona correttamente nel browser reale; contrassegnare il bug stampa bianca/fuori margine come chiuso e **non** alterare la stampa funzionante senza nuova necessità.
- Prosegue la richiesta di ampliare le sanzioni D.Lgs.81/2008 nei contenuti didattici senza modificare versioni pubblicate: aggiunti otto scenari alle schede contestuali (`normative-sanctions-v23.js`): rischi interferenziali/appalti/DUVRI; emergenze/esodo; primo soccorso; prevenzione incendi; segnaletica; ambienti sospetti d'inquinamento/spazi confinati; POS in cantiere; cadute dall'alto/lavori in quota. Nel complesso ci sono 19 categorie di scenari con soggetti distinti e richiami sanzionatori: artt. 55, 56-60, 68, 87, 157-160, 165 ove pertinenti.
- Ogni categoria ora include due verifiche operative (azioni/controlli e cosa fare in pratica), renderizzate nel box didattico e nella versione stampabile **Stampa lezioni**; il collegamento resta alla materia insegnata (titolo/riassunto), non a una citazione accidentale della bibliografia. Il modulo è read-only: nessuna mutazione dati, nessun completamento o abilitazione fittizia.
- Fonti: riferimento generale Normattiva testo vigente del D.Lgs.81/08 e pagina ufficiale INL dei testi coordinati, in luogo di link a un PDF Gennaio 2026 potenzialmente antecedente alle modifiche dell'art.55 in vigore dal 7 aprile 2026 (MEF DEF). Il testo avverte sul controllo della data di vigenza e sugli importi soggetti a rivalutazione; **nessun importo in euro inventato**. Ulteriori dettagli di ogni fattispecie richiedono revisione normativa specifica.
- Aggiornamento test `normative-sanctions-v23.test.mjs` per 8 nuovi scenari, filtri, fonte INL, azioni di tutte le schede e sola lettura; inclusi i relativi test e syntax check in `npm run check` CI. Cache PWA `safety-training-v22-41`. Non modificati i 27 corsi frozen, database Supabase, presenze, attestati o cancellazione definitiva sospesa.

## 2026-10-19 — v22.14.1 fix CI test riferimenti normativi
- Il primo nuovo workflow ha confermato test didattici precedenti superati, ma si è fermato sui due test `normative-sanctions-v23` che richiedevano la forma testuale `Art. N` anche quando il testo usava `L’art. N` o `Artt. N, ...`. L'asserzione è stata corretta in modo più robusto: verifica **che lo scenario richiesto venga davvero individuato** tramite ID stabile, poi controlla il numero dell'articolo esatto nei riferimenti normativi del record. Rimangono attivi i controlli dei contenuti operativi per tutte le nuove fattispecie e dei filtri su lezioni non pertinenti.
- Solo modifica dei test, nessuna modifica normativa o mutazione sui corsi/dati. Cache PWA `safety-training-v22-41` invariata. Controllare il CI del commit successivo.
