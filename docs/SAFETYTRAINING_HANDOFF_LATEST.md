# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-22
Stato: **v24.5 eliminazione multipla immagini PDF importate / 65 corsi** · sanzioni contestuali e stampa per percorso pubblicati · admin v21 preservato · PWA `safety-training-v22-78`.

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
- PWA `safety-training-v22-43`. Cancellazione effettiva rimane sospesa. Restano frozen 27 corsi; nessuna modifica alle loro lezioni. 

## 2026-10-19 — v22.10 riscontro dispense e pertinenza sanzioni
- **Stampa lezioni, affidabilità:** corretto `renderValue` affinché i titoli senza testo o liste vuote non contino come materiale didattico stampabile; il preflight blocca la dispensa se una LU manca di contenuto realmente renderizzabile. Se il caricamento di una versione fallisce, restano visibili i selettori corso/versione (possibile scegliere un altro corso anziché restare intrappolati su Riprova).
- **Sanzioni contestuali:** attivazione delle schede solo sui temi effettivamente insegnati in titolo/sommario, non sui richiami generici di bibliografia o negli approfondimenti: niente blocco sanzioni spurio nelle lezioni non pertinenti. Link stabili a Normattiva D.Lgs. 81/2008 e testo coordinato INL gennaio 2026. L'informazione è didattica, non un'attribuzione di responsabilità; per importi e norme applicabili si controlla sempre la versione vigente alla data dei fatti.
- **Test aggiunti:** blocco sezioni vuote, ripresa selezione dopo errore, filtro bibliografico e fonti ufficiali, più test handoff allineato alla nuova voce v22.10. Cache PWA `safety-training-v22-43`. Nessuna modifica a Supabase, corsi congelati, presenze o attestati. Resta il collaudo grafico di stampa A4 con browser e una revisione periodica delle fattispecie sanzionatorie.

## 2026-10-19 — v22.10.1 correzione test cache dinamica
- Prima CI del commit v22.10 fallita per un'asserzione obsoleta in `tests/v22-runtime-guards.test.mjs` ancora ancorata a `safety-training-v22-34`, mentre il cache name ora è `safety-training-v22-43`. Il controllo è stato reso indipendente dal numero incrementale: convalida lo schema del nome cache; l'esatto valore e la presenza in ENTRAMBI gli handoff restano verificati da `tests/handoff-sync-v23.test.mjs`.
- Non sono state modificate le funzioni, i database, i corsi o il cache identifier; la regressione proveniva soltanto dall'asserzione del test. Nuova CI necessaria per dichiarare il rilascio verificato.

## 2026-10-19 — v22.11 A4 per percorsi formativi lunghi
- **Stampa lezioni:** indice multilivello per moduli e tutte le Learning Unit con collegamenti agli ID univoci nella dispensa; il numero delle unità e la versione restano quelli realmente letti dalla versione pubblicata. La stampa completa resta la scelta predefinita, senza omissioni selettive.
- **Preflight immagini:** tutte le immagini interne sono verificate prima di abilitare la stampa; se uno schema non carica, il pulsante rimane disabilitato e compare il percorso di riferimento dell'asset mancante. Verifica con timeout per prevenire attese illimitate; nessuna sostituzione automatica di immagini o modifiche ai contenuti.
- **CSS A4:** margini di 17/14/18 mm; numero di pagina nel margine tramite CSS `@bottom-right` dove supportato dal browser; moduli su pagina nuova, indice libero di estendersi su più pagine, schemi ridimensionati a 95 mm, capitoli/elenchi lunghi spezzabili senza tagliare testo, nessuna stampa di `(#anchor)` dopo i link interni.
- **Test automatici:** dispensa sintetica lunga (7 moduli, 126 LU), unicità degli ancoraggi, nessuna fuga di risposte dei test, controllo di immagini mancanti e verifica strutturale delle regole CSS. Restano necessari controllo visivo della stampa A4 su Chrome/Edge e Firefox e controllo di immagini reali; i test non costituiscono prova grafica.
- Cache PWA `safety-training-v22-43`. Nessuna scrittura DB e nessuna modifica a corsi frozen (27), iscrizioni, presenze, attestati o backend cancellazione (sospeso).

## 2026-10-19 — v22.11.1 indice multipagina robusto
- Rifinita la regola A4 degli indici lunghi: una voce modulo con molte lezioni può attraversare una interruzione di pagina (`break-inside:auto` sul contenitore), mentre i singoli collegamenti brevi delle LU restano uniti (`break-inside:avoid`). Evitato l'effetto di blocchi di indice troppo alti per una pagina.
- Aggiunto test CSS dedicato. Rimangono da collaudare visivamente browser/stampanti; il test strutturale non simula un motore di impaginazione. Invariati DB, PWA cache `safety-training-v22-43`, dati formativi e corsi congelati.

## 2026-10-19 — v22.12 HOTFIX stampa bianca
- Segnalazione utente: **la stampa del singolo corso restituisce pagine completamente bianche**. Diagnosi del codice: il documento veniva stampato all'interno di `#adminShell .admin-main`, pannello full-screen/fixed e internamente scrollabile (`height:100vh; overflow:auto`), con tentativi di nascondere il resto della pagina tramite `visibility:hidden` e riabilitare selettivamente i discendenti. Il comportamento era fragile e poteva impedire al motore di stampa di creare pagine visibili. Non sostenere che la causa specifica sia provata senza una riproduzione browser.
- **Correzione strutturale:** al click stampa, la stessa dispensa già caricata (compresi immagini e testi verificati) viene TEMPORANEAMENTE spostata in `#safetyPrintStage`, un contenitore top-level direttamente dentro `<body>`, fuori dal pannello amministrativo. Lo stile print nasconde l'intera console con `display:none` e rende stampabile solo quel contenitore statico con `height:auto`, `overflow:visible`, colori scuri su fondo bianco. Al `afterprint`, dispensa e DOM originali vengono ripristinati; nessun contenuto duplicato o perso. Nessuna mutazione database.
- Nuovi test di regressione: trasferimento del nodo DOM e ripristino idempotente dopo stampa, non visibilità nascosta dei genitori, CSS print A4 con struttura indipendente dal pannello, indici lunghi e schemi mantenuti. PWA `safety-training-v22-43`.
- Nota: questa correzione richiede verifica visiva nel browser reale dell'utente, che ha riscontrato il bug. Se persistesse, raccogliere browser/versione e screenshot dell'anteprima prima di cambiare altro.

## 2026-10-19 — v22.13 Stampa slide reali, 2 per A4 bianco
- Aggiunta sezione Amministrazione `Stampa slide`, distinta da `Stampa lezioni`, registro e attestato: selezione corso e versione **pubblicata**; accesso verificato in `platform_admins`, query bounded/RLS riusando `SAFETY_ADMIN_PRINT_LESSONS_V23.loadBook` con preflight completo. Nessuna mutazione DB.
- **Fedeltà visiva:** riutilizza esattamente `SAFETY_DB_SLIDES.adaptBundle`, `buildDeck` e `deckSlideBody` del motore proiettore di `app.js` (esportazione read-only `SAFETY_DECK_RENDER`), anziché ricostruire una semplice dispensa testuale. Costruzione di ogni slide con titoli, grafica SVG/media, box, casi e opzioni delle verifiche visibili, ma eliminando i pulsanti/controlli di rivelazione e **senza esporre la risposta corretta**. Limitati gli URL delle immagini ad asset locali; caricamento immagini verificato prima di abilitare la stampa.
- **Impaginazione:** A4 verticale, foglio bianco, due cornici 16:9 per pagina, ordine delle slide originali, indicazione corso/modulo/numero, sfondi della diapositiva schiariti per la stampa e `print-color-adjust: exact` quando supportato. Trasformazione delle slide logiche 1600×900 a scala misurata dal contenitore. Stampa solo da stage top-level temporaneo fuori dal pannello scrollabile, ripristinato al termine, per evitare il precedente bug delle pagine bianche.
- **Sicurezza/limiti:** se mancano LU, versioni pubblicate, immagini, o il deck supera il limite prudenziale di 700 slide, la funzione blocca la stampa invece di produrre materiale incompleto. Non stampa risposte riservate, dati dei corsisti né attestati. Test N=5/2 per pagina, URL media, blocco cap, riuso motore, CSS e rimozione comandi. Test browser visivo su A4 resta necessario; il numero di pagine effettivo può variare con impostazioni browser/stampante.
- Cache PWA `safety-training-v22-43`. Nessuna modifica a Supabase, ai corsi frozen (27), alle versioni già pubblicate, a frequenze, attestati o cancellazione definitiva sospesa.

## 2026-10-19 — v22.13.1 HOTFIX immagini slide mancanti (`assets/undefined`)
- Segnalazione utente: `Immagine della slide non ammessa per stampa: assets/undefined` nella funzione Amministrazione → Stampa slide. Causa individuata nel motore originale: `buildDeck` creava slide di tipo `graphic` usando incondizionatamente `assets/${g.image}`; per le schede grafiche senza proprietà `image` risultava la stringa letterale `assets/undefined`. Anche `getTopicImage` selezionava indiscriminatamente la prima `idea_images`.
- **Correzione motore** `app.js`: per `graphic_cards` senza immagine valida utilizzare la seconda immagine disponibile del topic (`img2`) invece di costruire il percorso undefined; `getTopicImage` cerca un'immagine con campo file utilizzabile e, in assenza, mantiene il fallback visivo del topic.
- **Correzione stampa** `admin-print-slides-v23.js`: fallback circoscritto a `assets/undefined`, `assets/null`, `assets/NaN` o `assets/` con schema locale sicuro `assets/general.svg`. Gli URL esterni, path traversal e percorsi malformati restano bloccati e le immagini reali vengono ancora controllate prima della stampa. Le slide e i loro testi non vengono saltati.
- Test di regressione per rendering dello schema fallback, blocco URL non sicuri, controllo generazione `graphic_cards`, cache PWA `safety-training-v22-43`. Nessuna mutazione Supabase, corsi frozen, presenze, attestati o cancellazione sospesa. Serve conferma dell'anteprima su browser reale.

## 2026-10-19 — v22.13.2 copertura reale dei test di stampa
- Audit `package.json`: `npm run check` / GitHub Actions `syntax` eseguiva solo un sottoinsieme di test storici, non `tests/admin-print-slides-v23.test.mjs`; ciò rendeva il primo CI verde del fix immagini insufficiente come verifica. Integrati nel check CI i controlli sintattici dei due moduli di stampa e gli eseguibili di test `admin-print-slides-v23`, `admin-print-lessons-v23` e `handoff-sync-v23`.
- Irrigidito `safeSlideImage`: nomi fittizi tipo `assets/undefined.svg`, `assets/null.png` e `assets/NaN.svg` non sono accettati come immagini vere; i soli placeholder esplicitamente mancanti continuano a essere sostituiti dallo schema locale `assets/general.svg`. URL esterni e percorsi sospetti restano bloccati. Aggiornato test di regressione per verificare l'esecuzione della suite specifica nel workflow.
- Nessuna modifica ai dati Supabase, corsi frozen, presenze o attestati. Cache PWA invariata `safety-training-v22-43` perché il fix riguarda validazione lato JS e la cache usa network-first per gli asset `.js`. Attendere verifica CI su commit finale.

## 2026-10-19 — v22.13.3 CI verde per fix immagini
- Il nuovo check CI esegue effettivamente i test della stampa delle slide: prove dei fallback e dei blocchi URL superate. La prima esecuzione del workflow ampliato ha fallito solo perché l'asserzione `tests/handoff-sync-v23.test.mjs` richiedeva una sottoversione specifica `v22.13.1` pur essendo già registrata `v22.13.2` in entrambi i documenti. Sostituita con controllo stabile sulla linea v22.13, mentre il medesimo test continua a imporre l'identità esatta delle intestazioni ultime tra i due handoff e della versione PWA corrente.
- Non mutate versioni delle slide, dati Supabase, corsi congelati, presenze o attestati. Per giudicare il rilascio attendere conclusione CI sul commit finale.

## 2026-10-19 — v22.13.4 fix A4 due slide fuori margine
- Segnalazione utente: le due slide del corso sforano dai margini e finiscono su pagine diverse. Individuato accoppiamento inaffidabile fra `scaleSlides()` calcolato sulla larghezza dell'anteprima a schermo e geometria della stampa A4; inoltre il precedente `.slide-print-sheet` alto 272mm lasciava solo 3mm di margine dopo le impostazioni `@page` e poteva favorire overflow/duplicazioni di pagina.
- **Correzione fisica:** A4 verticale con margini 14mm, area stampabile 182×269mm. Un foglio ha width 180mm e altezza 250mm; layout grid con due slot da 112mm separati da 10mm. Cornici 16:9 larghe 172mm e alte 96,75mm, didascalie 4mm, spazi verticali di sicurezza e nessuno scorrimento; in stampa ogni slide logica 1600×900 è scalata via CSS `transform:scale(0.40)!important`, ossia ~169,3×95,25mm, inferiore alla cornice. Non dipende più dalla misurazione a schermo.
- **JS:** `scaleSlides()` ora non modifica i `transform` inline durante lo stato `admin-slides-print`, evitando collisioni con le misure fisiche `@media print`. La preview web mantiene lo scaling responsivo. Il documento rimane su stage body-level indipendente, preservando workaround stampa bianca.
- **Test automatici:** parsing dei valori reali CSS e assert geometrici A4 (margini, slot, ratio, scale interna), separazione trasformazione stampa/preview, due slide/foglio, test precedenti immagini e sicurezza. Test CI + deploy da verificare sul commit; la prova visiva su browser/stampante reali rimane una verifica ulteriore e non va dichiarata completata senza effettuarla.
- Cache PWA `safety-training-v22-43`; aggiornati entrambi handoff. Nessuna modifica a Supabase, ai 27 corsi frozen, presenze, attestati o cancellazione definitiva sospesa.

## 2026-10-19 — v22.14 sanzioni per scenari reali e controllo delle responsabilità
- Segnalazione utente: la nuova stampa slide 2/A4 funziona correttamente nel browser reale; contrassegnare il bug stampa bianca/fuori margine come chiuso e **non** alterare la stampa funzionante senza nuova necessità.
- Prosegue la richiesta di ampliare le sanzioni D.Lgs.81/2008 nei contenuti didattici senza modificare versioni pubblicate: aggiunti otto scenari alle schede contestuali (`normative-sanctions-v23.js`): rischi interferenziali/appalti/DUVRI; emergenze/esodo; primo soccorso; prevenzione incendi; segnaletica; ambienti sospetti d'inquinamento/spazi confinati; POS in cantiere; cadute dall'alto/lavori in quota. Nel complesso ci sono 19 categorie di scenari con soggetti distinti e richiami sanzionatori: artt. 55, 56-60, 68, 87, 157-160, 165 ove pertinenti.
- Ogni categoria ora include due verifiche operative (azioni/controlli e cosa fare in pratica), renderizzate nel box didattico e nella versione stampabile **Stampa lezioni**; il collegamento resta alla materia insegnata (titolo/riassunto), non a una citazione accidentale della bibliografia. Il modulo è read-only: nessuna mutazione dati, nessun completamento o abilitazione fittizia.
- Fonti: riferimento generale Normattiva testo vigente del D.Lgs.81/08 e pagina ufficiale INL dei testi coordinati, in luogo di link a un PDF Gennaio 2026 potenzialmente antecedente alle modifiche dell'art.55 in vigore dal 7 aprile 2026 (MEF DEF). Il testo avverte sul controllo della data di vigenza e sugli importi soggetti a rivalutazione; **nessun importo in euro inventato**. Ulteriori dettagli di ogni fattispecie richiedono revisione normativa specifica.
- Aggiornamento test `normative-sanctions-v23.test.mjs` per 8 nuovi scenari, filtri, fonte INL, azioni di tutte le schede e sola lettura; inclusi i relativi test e syntax check in `npm run check` CI. Cache PWA `safety-training-v22-43`. Non modificati i 27 corsi frozen, database Supabase, presenze, attestati o cancellazione definitiva sospesa.

## 2026-10-19 — v22.14.1 fix CI test riferimenti normativi
- Il primo nuovo workflow ha confermato test didattici precedenti superati, ma si è fermato sui due test `normative-sanctions-v23` che richiedevano la forma testuale `Art. N` anche quando il testo usava `L’art. N` o `Artt. N, ...`. L'asserzione è stata corretta in modo più robusto: verifica **che lo scenario richiesto venga davvero individuato** tramite ID stabile, poi controlla il numero dell'articolo esatto nei riferimenti normativi del record. Rimangono attivi i controlli dei contenuti operativi per tutte le nuove fattispecie e dei filtri su lezioni non pertinenti.
- Solo modifica dei test, nessuna modifica normativa o mutazione sui corsi/dati. Cache PWA `safety-training-v22-43` invariata. Controllare il CI del commit successivo.

## 2026-10-19 — v22.16 Graphic Pack 02 (68 SVG originali totali)
- Approvazione utente e implementazione dei **20 asset SVG originali** `apps/training/assets/gp01-*.svg`: casco, occhiali, guanti, scarpe, udito, respiratore, imbracatura, DPC vs DPI, famiglie segnaletica, colori, divieto, obbligo, avvertimento, emergenza/antincendio, caduta, schiacciamento, investimento, ribaltamento, controlli preuso, procedura emergenza. Formato 1200x700, layout chiaro, testo e diagramma con tre messaggi didattici; originali e non copiati dai PDF (che restano solo fonti di spunto).
- `graphic-pack-01.js`: mappa dei 20 asset e regole tematiche per titolo/riassunto. Nel `buildDeck` originale le prime immagini delle slide dei topic DB-backed utilizzano il Pack quando pertinente, fino a tre visualizzazioni tematiche, prima della normale immagine inferita. **Non sovrascrive immagini esplicitamente authored** e non applica il Pack ai corsi frozen: il gate controlla `course.metadata.freeze_scope/frozen/is_frozen/course_frozen` e `topic.presentation_quality.visual_mode`.
- `db-slide-adapter.js` ora conserva in sola lettura `course.metadata` nel corso adattato, finora scartato; `admin-print-slides-v23.js` include metadata nella select di course per rispettare freeze anche in stampa. Nessuna modifica alle versioni LU, ai contenuti Supabase o alle informazioni corsisti. Asset riusati dalla stessa pipeline `buildDeck` in aula e stampa 2/A4. Nessuna nuova diapositiva né ore aggiunte, solo immagini tematiche a parità di contenuto.
- Registrato nuovo script in index e precache SW `safety-training-v22-43`; aggiunto test di 20 file XML/SVG, corrispondenze tematiche, blocco frozen/authored, percorsi e import nel `npm run check` CI. Le figure sono **schemi didattici**, non segnaletica tecnica certificata né sostituti di manuali/istruzioni del costruttore. Prima di usare come istruzioni operative specifiche macchina occorre validazione docente/tecnica. Le fonti PDF dell'utente contengono anche materiale non aggiornato e non sono state riprodotte direttamente.
- Stampa A4 due slide per pagina già **verificata dall'utente** al rilascio v22.13.4: preservare geometria testata. I 27 corsi frozen, evidenze di frequenza, attestati e cancellazione definitiva sospesa rimangono intatti.

## 2026-10-19 — v22.15.1 controllo SVG e matching controlli preuso
- Prima CI del Graphic Pack 01 ha individuato 2 errori della nuova suite, non regressioni del motore: il controllo test per URL esterni rifiutava anche il namespace SVG standard `http://www.w3.org/2000/svg`; ora vieta elementi/script, href/riferimenti attivi e handler senza proibire il namespace SVG obbligatorio. Il matcher `controlli? pre.uso` non intercettava il titolo senza separatore `Controlli preuso`; ampliato a `pre.?uso`.
- Non cambiano gli SVG originali, dati formativi e corsi frozen; il primo lotto resta di 20 asset. I test CI finali vanno rieseguiti.

## 2026-10-19 — v22.16 Graphic Pack 02: 48 nuovi SVG originali (68 totali)
- Su richiesta utente ampliata la libreria da 20 a **68 illustrazioni SVG originali**: 16 schemi trasversali (`gp02-ppe-*`, segnaletica contestualizzata, uscita/emergenza, antincendio, protezioni collettive, rischio meccanico, percorsi pedoni, chimico, checklist, carico sospeso e soccorso) e 32 scene specialistiche, 8 per ciascuna famiglia `forklift`, `ple`, `crane`, `mmt`. Scene differenziate con silhouette delle macchine, componenti, zone di esclusione, pendenze, conduttori, carichi, persone e richiami chiari per il docente. Artworks informativi, **non** segnaletica ufficiale certificata, non riprodotti da PDF di terzi, non in scala e non sostitutivi di schede tecniche e manuali del costruttore.
- `graphic-pack-02.js` collega i 48 asset ai titoli/riassunti rilevanti secondo **famiglia macchina** del corso o tema specifico della lezione; evita ad esempio di proporre la scena ribaltamento carrello in una lezione generale sulla stabilità se il corso non è di carrelli. Nelle presentazioni `buildDeck` ha priorità Graphic Pack 02 seguito dal precedente 01 per le prime tre immagini pertinenti; la pipeline proiettore e stampa A4 è la medesima. Non cambia ordine, numero, durata o testi delle LU e delle slide. Nessuna nuova attività digitale qualificata come addestramento.
- Gate obbligatorio: solo lezioni adattate da DB, non frozen, con visualizzazione non authored. Il precedente `SAFETY_GRAPHIC_PACK_01.isFrozen` viene riutilizzato da GP02 e dal renderer; i **27 corsi frozen** e gli schemi redatti manualmente non vengono sovrascritti, dati Supabase/edizioni/frequenze/attestati invariati, hard delete resta sospeso.
- Nuove risorse incluse nel service worker, cache PWA `safety-training-v22-43`, `graphic-pack-02.js` caricato dopo GP01 e prima di `app.js`. Nuovi test CI `tests/graphic-pack-02.test.mjs` per conteggio 48 (16+8×4), SVG autonoma e non interattiva, 10 associazioni argomento-illustrazione, blocco frozen/autoriale, assenza di DB writes, corretto collegamento alla stampa e PWA. Aggiornati in parallelo entrambi i registri di handoff. Verificare CI e deploy del commit finale; collaudo visivo su reali corsi richiesto, non sostituito dai test automatici.
- Esempi dei PDF utente impiegati solo per individuare le **tematiche didattiche**: controlli preuso e terreno/vento PLE (manuale 2020), rischi macchine, carico gru, MMT e incidenti; riferimenti normativi contenuti in alcuni allegati possono essere obsoleti e non sono stati copiati come prescrizioni attuali.

## 2026-10-19 — v22.16.1 correzione selezione di tutte le scene mezzi
- Primo check CI ha trovato una mappatura errata: alcune regole semantiche (es. `blind`) costruivano l'ID `forklift-blind` mentre l'asset effettivo si chiama `forklift-blindspot`. Aggiunta tabella canonica `resolveVariant(family,variant)`, per rispettare nomi file senza rinominarli o modificare il contenuto. Corrette anche le attese del test di riconoscimento (elettricità PLE, segnalatore gru, cigli/sottoservizi MMT).
- Nuovo test di copertura per **32/32 scenari macchina**, richiedendo che ogni variante si risolva a un SVG esistente, senza duplicati. Il gate frozen, originalità di 48 SVG e stampa A4 rimangono inalterati; nessuna modifica Supabase.
- CI finale da ricontrollare prima del rilascio v22.16.1.

## 2026-10-19 — v22.17 Graphic Pack 03: prevenzione e rischi trasversali (80 SVG)
- Aggiunte 12 illustrazioni SVG originali `gp03-*.svg` per: gerarchia della prevenzione, valutazione qualitativa del rischio, mancato infortunio/near miss, rischio elettrico, scivolamento/inciampo, movimentazione manuale, VDT, rumore, aspirazione polveri, microclima/calore, etichetta-SDS, interferenze tra lavorazioni. Ogni scena integra un diagramma specifico e tre azioni osservabili, leggibili in proiezione e in stampa.
- `graphic-pack-03.js` seleziona solo argomenti pertinenti dal titolo/riassunto delle lezioni DB-backed. Nessuna selezione sui corsi frozen (27 voci), sui corsi locali o su visual authored; GP02 resta prioritario per gli scenari attrezzature e GP01 resta fallback.
- Integrazione nella pipeline `buildDeck` comune a proiettore e stampa già funzionante (2 slide/A4), senza cambiare geometrie di stampa, testo/ore/numero delle Learning Unit, database, versioni pubblicate, presenze, attestati, ruoli o soft-delete. Asset e modulo nel precache PWA `safety-training-v22-44`.
- Il contenuto è illustrativo, **non** una prescrizione tecnica o un modello quantitativo legale universale: valgono DVR, procedure applicabili e verifica del docente. Originale, senza immagini copiate dai PDF dell'utente.
- Nuova suite statica di selezione, blocchi frozen/authored, asset SVG, SW, stampa e assenza di DB write aggiunta a `npm run check`. CI e deploy devono essere ricontrollati sul commit; collaudo visivo 1440/820/390 e con stampa reale ancora non eseguito su questo pack.

## 2026-10-19 — v22.17.1 correzione test GP03
- Il workflow #387 è fallito per un'espressione regolare non valida introdotta nella nuova suite GP03 (non è un errore di runtime). Corrette le asserzioni su riuso della stampa e sulla sola lettura tramite confronti testuali. Gli SVG, i dati, la stampa A4 2-up, la PWA, i 27 corsi frozen e i gate didattici restano immutati; verificare il nuovo CI prima del rilascio.

## 2026-10-19 — v22.17.2 CI verificata e deploy visual
- `Graphic Pack 03` con 12 nuovi SVG (80 totali) e test corretto: GitHub Actions **SafetyTraining checks #388**, run `39331549235`, commit `f63e5b859a14e6f0711e8e21751d314fc4b82409`, stato **SUCCESS**.
- Check Vercel del medesimo commit: **success**, riferimento `https://vercel.com/safety-manager/safety-training/8iUnRqps2xNyaguyYHeJRoSWKpKB`. Il check non costituisce da solo prova di resa visiva sul browser o di controllo reale stampa A4.
- Da eseguire: QA visivo dei 12 diagrammi con schermate a 1440/820/390 px, leggibilità delle tre azioni, proiezione e stampa A4 reale, controllo eventuali testi troppo lunghi. Non dichiarare questa verifica completata finché non avviene.
- Nessuna modifica al runtime, a Supabase, ai 27 corsi frozen, a presenze/attestati o al percorso di eliminazione.

## 2026-10-20 — v22.18 libreria immagini PDF originali in revisione amministrativa
- Recuperati 14 PDF caricati nella chat del 18/10; creato pacchetto di **169 JPEG** fra figure e anteprime, ciascuno con fonte, pagina, SHA-256, categoria, diritto/validità in stato `review_required`. ZIP consegnato in ChatGPT, **non** presente nel repository e non ancora importato in produzione.
- Nuova importazione amministrativa **Immagini PDF** dalla console platform-admin: un unico ZIP, controllo manifest/path/JPEG/SHA e caricamento idempotente su Supabase Storage privato più indice `training_source_figures_v23` con RLS platform-admin; nessun accesso anon o corsista.
- Dopo importazione, in modalità di anteprima admin le slide DB-backed non congelate possono associare una figura contestuale con didascalia esplicita «RIFERIMENTO PDF NON VALIDATO», senza modificare i testi/versioni/durata o le Learning Unit. I Graphic Pack 01-03 restano e integrano, non sono sostituiti. L'importazione delle immagini non equivale a autorizzazione di pubblicazione o certificazione.
- Per visualizzare figure **condivise** e non locali, l'admin deve importare lo ZIP nel nuovo pannello; fino ad allora il pack non comparirà nelle slide. Il file ZIP non è direttamente accessibile al deployment da allegati ChatGPT. Sono esclusi 27 corsi frozen, learner anonimo e lu authored; tutta la fonte è soggetta a revisione licenza, vigenza normativa e contenuto medico.
- PWA `safety-training-v22-46`. Aggiunta migration SQL `v22_017_private_source_figures`, UI, CSS e suite test. Verificare CI, applicazione migration, import con admin reale, browser smoke prima di considerare l'integrazione completata.

## 2026-10-20 — v22.18.1 correzione escape regex importatore immagini PDF
- Prima CI #390 fallita per escape eccessivi nelle regex del nuovo modulo `source-figures-v23.js`: `assets/source-pdf/*.jpg` interpretato come flag invalidi. Normalizzate le doppie barre di escape nelle espressioni regolari JS (selezione famiglie, tokenizzazione, validazione JPEG), senza alterare autorizzazioni o dati. Ricontrollare CI del nuovo commit.

## 2026-10-20 — v22.18.2 cache PWA allineata
- La CI #391 ha superato la sintassi e i primi tre test importer; unico errore: `sw.js` conservava `safety-training-v22-44` mentre i test, gli handoff e i nuovi asset richiedevano `v22-46`. Bump del cache key; nessuna modifica alle policy, ai corsi o al codice funzionale. CI da verificare.

## 2026-10-20 — v22.18.3 CI handoff cache allineata
- I test sorgenti/media del run #392 sono riusciti; unico errore: intestazioni dei due registri ancora con cache v22-44, nonostante PWA v22-46 già corretta. Intestazioni e nuova nota sincronizzate; nessuna modifica di runtime/DB. Ricontrollare CI sul commit corrente.

## 2026-10-20 — v22.18.4 test cache di GP03 reso evolutivo
- CI #393: unico errore residuo, asserzione GP03 con numero cache v22-44 hardcoded. Il test ora controlla il formato della chiave corrente invece di imporre una sottoversione superata. Gli altri test importer e regressioni precedenti hanno superato le rispettive verifiche; correzione solo test, nessun runtime alterato.

## 2026-10-20 — v22.18.5 string-match cache test
- Sostituito l'ultimo controllo GP03 con ricerca testuale del prefisso cache (senza regex suscettibili a doppio escaping nelle tool-call), preservando il check di asset PWA. Nessuna modifica funzionale; CI da ricontrollare.

## 2026-10-20 — v22.18.6 copertura visiva estesa e backend pronto
- Stato verificato: run GitHub Actions #395 **success**; migrazione Supabase `v22_017_private_source_figures` applicata con successo e bucket privato `training-source-figures` + RLS platform-admin verificati, indice ancora **0** immagini (ZIP da importare tramite console con account platform-admin).
- Aumentato da una a **due** figure PDF pertinenti per topic DB-backed non congelato, affiancate allo schema SVG originale (tetto 3 immagini per lezione); scelta deterministica distribuisce le immagini a parità di attinenza fra le lezioni evitando duplicati nella stessa lezione. Sempre **anteprima admin** con didascalia obbligatoria, non diffusione pubblica; non cambia testi, minuti, versioni o stampa 2/A4.
- Verificare CI di questa modifica prima del rilascio; importazione reale, smoke browser desktop/mobile e controllo manuale dei contenuti restano da fare.

## 2026-10-20 — v22.18.7 verifica rilascio immagini in attesa import
- GitHub Actions #396 sul commit `fe9707d58ea8b9b83dad81a427d19aaa287485f5` = **success** (test di sintassi/importer/regressioni inclusi), Vercel = **success**; migration `v22_017_private_source_figures` già applicata e tabelle/policies/bucket privati verificati.
- Stato reale contenuti: **169 JPEG estratti e consegnati nello ZIP ChatGPT**, ma database produzione con **0 immagini indicizzate**: l'admin deve ancora scaricare ZIP e usare pannello *Amministrazione → Immagini PDF → Importa*; l'interfaccia di amministrazione potrà quindi mostrare fino a due immagini PDF per LU coerente, rigorosamente in **anteprima riservata**. Niente distribuzione corsisti senza permessi e revisione.
- Rimane da fare smoke test visuale 1440/820/390 + stampa 2/A4, prova reale di upload in browser con credenziali admin e revisione normativa/copyright. Nessuna dichiarazione di pubblicazione delle figure estratte ai corsisti.

## 2026-10-20 — v22.19 Graphic Pack 04: 54 SVG originali nuovi
- Analisi preliminare dei 169 estratti dai 14 PDF: **0 verdi, 26 gialli, 143 rossi**. Report CSV/JSON e ZIP con classi disponibili nella chat; solo uso con valutazione diritti e attualità dei contenuti. Nessun JPEG di terze parti nel repository.
- Aggiunto **Graphic Pack 04**: 54 schemi originali con confronto visivo rischio/controllo per DPI, segnaletica, carrelli, PLE, gru, MMT, macchine, antincendio, primo soccorso, quota e sollevamento. Totale **134 SVG originali**. Matching sul titolo/riassunto, fallback deterministico tra varianti della stessa famiglia, massimo 3 slot visual preesistenti in `buildDeck`; nessuna variazione a minuti né LU DB.
- Resta escluso qualsiasi corso frozen, authored e non DB-backed. PWA **safety-training-v22-47**, test specifici. CI, QA browser, stampa A4 e revisione tecnico-didattica da verificare; no promozione automatica delle fonti di terzi ai corsisti.

## 2026-10-20 — v22.19.1 correzione XML SVG (lotto 1/5)
- Corrette 11 illustrazioni GP04 rimuovendo tag `</rect>` superflui dopo elementi autoconclusivi; nessun cambio alle istruzioni o immagini di riferimento di terzi. Rimanenti gruppi in lavorazione.

## 2026-10-20 — v22.19.2 correzione XML SVG (lotto 2/5)
- Corrette altre 11 illustrazioni GP04 rimuovendo tag rettangolo superflui. Asset di terzi non caricati. Nessun cambio alle unità didattiche.

## 2026-10-20 — v22.19.3 correzione XML SVG (lotto 3/5)
- Corrette 11 illustrazioni GP04 nel terzo lotto. Eliminati soltanto i tag `</rect>` ridondanti negli SVG; nessuna variazione di contenuto o metadati didattici.

## 2026-10-20 — v22.19.4 correzione XML SVG (lotto 4/5)
- Corrette 11 illustrazioni GP04 nel quarto lotto, senza modifiche ai contenuti didattici, al catalogo o alle policy.

## 2026-10-20 — v22.19.5 correzione XML SVG (lotto 5/5)
- Completata correzione di **tutti i 54 SVG GP04**, eliminati tag di chiusura rettangolo ridondanti. Nuovo test su assenza `</rect>` superflui, PWA cache **safety-training-v22-48** per ricaricare il pacchetto corretto.
- Invariate tabelle e materiali pubblicati a livello di database, geometria A4 e corsi frozen. Verificare CI e deploy; audit diritti 26/143 da importare separatamente come ZIP privato.

## 2026-10-20 — v22.20 gestione prudenziale immagini PDF per uso interno CNA Avellino
- Audit 169 estratti: 0 VERDE verificati, 26 GIALLO per valutazione uso didattico limitato e 143 ROSSO da rifare/aggiornare. Archivio ZIP 169 con review_class e review_reason e CSV in ChatGPT, non committati nel repository.
- Aggiunta migrazione `v22_018_review_private_source_figures` con classe ROSSO/GIALLO e motivo, default **ROSSO** per import vecchi e nessun valore VERDE/approved. Il pannello carica classe e motivazione e le mostra in anteprima, ma **solo GIALLO** può essere proposto nelle slide viste dal platform-admin; ROSSO mai nelle slide. Nessuna immagine di terzi consegnata ai corsisti e nessuna copia nel GitHub repository.
- Corretti test cache e handoff per **PWA safety-training-v22-49**. Graphic Pack 04: **54 SVG originali**, totale **134 SVG originali**, soggetti a QA didattica; 27 corsi congelati preservati, nessuna modifica a LU, certificati, tempi, presenze, stampa 2/A4.
- Applicare/verificare migrazione Supabase, verificare CI e Vercel, import tramite account platform-admin reale dello ZIP classificato e ispezione visuale browser; una classificazione GIALLO non sostituisce le necessarie verifiche di licenza/attualità.

## 2026-10-20 — v22.20.1 manutenzione test CI
- Corretto test di sincronizzazione promemoria: vecchia asserzione hardcoded `v22.18` sostituita con `v22.20`, in linea con ultima sezione presente in entrambi gli handoff. Il test rimane rigido su coincidenza del titolo e della PWA tra i due file. Migrazione `v22_018_review_private_source_figures` applicata con successo, CI #404 fallita solo per questa asserzione obsoleta. Nessuna modifica al runtime o ai dati didattici.

## 2026-10-20 — v22.20.2 stabilizzazione test del Graphic Pack 04
- CI #405: i nuovi 54 SVG e relative verifiche di fonte/freeze superano i test. Unico errore: il test GP04 richiedeva la vecchia cache `v22-48` anziché la cache corrente `v22-49`; sostituita la verifica del suffisso con controllo del prefisso invariabile `safety-training-v22-`. Nessun cambiamento funzionale, stampa o database. Verificare run successivo.

## 2026-10-20 — v22.20.3 verifica formale XML immagini GP04
- **CI #406 success**, Vercel deploy success e due migrazioni applicate in Supabase. Aggiunto preflight Python `scripts/validate_gp04_xml.py` nel `npm run check`: parser XML reale su 54 SVG GP04, viewBox, accessibilità, assenza immagini esterne e presenza delle etichette rischio/comportamento sicuro. Rafforza verifica rispetto alle vecchie sole regex. Verificare il nuovo CI prima di considerarlo approvato.

## 2026-10-20 — v22.20.4 verifica rilascio illustrazioni
- **CI #407 completata con esito success**, incluso parser XML reale sui 54 SVG GP04, regressioni core e verifiche stampa. **Vercel produzione in stato success** sul commit `139b5461551a4ee2c3e1acdec379e30778afa9c4`.
- La migrazione Supabase `v22_018_review_private_source_figures` risulta applicata: bucket Storage privato e policy platform-admin attive. Al controllo database del 20/10 risultano **0 immagini PDF di terzi importate** (26 gialle/143 rosse nel pacchetto ZIP in chat, non in produzione). I 54 SVG originali sono invece presenti nel deploy, totale 134 originali.
- Restano da eseguire prova visiva nel browser su desktop/tablet/mobile, controllo manuale di leggibilità/testi tecnici, simulazione stampa reale 2/A4 e, solo se deciso, import archivio PDF classificato da un vero admin; nessuna pubblicazione ai corsisti di materiale di terzi non autorizzato.

## 2026-10-20 — v22.21 correzione visibilità illustrazioni nelle schede corso
- Segnalazione CNA: immagini GP04 presenti ma non visibili nell'**agenda corso** e nelle **schede argomento**. Root cause verificata: app.js caricava GP04 solo dentro `buildDeck`, mentre `topicView` usava sempre `assets/general.svg`; GP04 `pick` scartava i topic con `visual_mode=authored`. In Supabase verificati molti corsi effettivamente pubblicati con `idea_images` già presenti, quindi esclusi dal vecchio filtro.
- UI corretta **senza scrivere su DB**: per ogni topic DB-backed di corsi non congelati e corrispondenti alle famiglie esistenti, thumbnail GP04 nell'agenda; sezione esplicita *Illustrazioni dell'argomento* con fino a 2 schemi originali nella scheda. La scelta include anche titoli generici con tema riconosciuto dal riassunto. I 27 corsi frozen restano esclusi.
- Nella proiezione il tema authored conserva la propria immagine principale e gli SVG GP04 entrano solo negli slot supplementari. Stampa A4 usa ancora stesso `buildDeck`; niente incremento ore/minuti né nuovi slide aggiunti, né duplicazioni in database. La galleria delle normali schede è CSS responsive 1 colonna mobile e 2 desktop. Nessun PDF di terzi pubblicato ai corsisti.
- CSS `graphic-pack-04-gallery.css`, PWA `safety-training-v22-50`, regressioni selector/agenda/schede/deck. Convalida necessaria con CI e smoke test browser reale, incluso hard refresh se la PWA mostra asset cached.

## 2026-10-20 — v22.21.1 correzione test promemoria per nuova versione
- Il run CI #409 conferma la sintassi e i test principali del nuovo visual overlay ma fallisce sull'asserzione storica del numero `v22.20` nell'ultimo titolo degli handoff. Aggiornato il test a controllo di forma `v22.N` senza suffisso hardcoded e mantenuta l'uguaglianza testuale dei due titoli: così il rilascio v22.21 non richiede correggere i test ad ogni versione. Nessun cambio funzionale, dati o catalogo.

## 2026-10-20 — v22.21.2 correzione disambiguazione immagini
- CI #410 e Vercel della correzione agenda/schede = success. Trovata una collisione nei pattern di matching: `gru` poteva corrispondere a `Gruppo A` e `ple` a parole come `completo`, producendo immagini fuori tema in corsi sanitari/generali.
- Corretto matching GP04 con confini di parola per `gru`, `ple`, `mmt`; aggiunto test regressione su *Primo soccorso – Gruppo A* e *Completo aggiornamento lavoratori*. Nessun dato, minuta, LU, catalogo o stampa modificata. Verificare nuova CI e QA visiva su browser reale.

## 2026-10-20 — v22.22 audit integrale slide e stampe / Graphic Atlas
- Audit inventario GitHub: **201 immagini locali**, di cui 134 SVG originali GP01 (20), GP02 (48), GP03 (12), GP04 (54) e 67 ulteriori asset storici/autoriali. Non tutte venivano mostrate: vecchio `buildDeck` utilizzava max 3 visual per LU; `admin-print-lessons-v23` stampava solo asset codificati nella LU senza pack contestuali. Le **169 immagini PDF di terzi non sono nello Storage** (0 importate) e non sono autorizzate automaticamente per la stampa o pubblicazione.
- Aggiunto `graphic-atlas-v22.js`: selezione unica **di tutte le figure pertinenti** già abbinate dalle regole GP01-04, anche come supplemento per LU con immagine authored (la hero authored rimane invariata), più asset locali `idea_images`/`visuals`/`graphic_cards`. Scarta immagini remote/non consentite, doppioni e corsi congelati/non-DB.
- Proiezione e **Stampa slide A4 due per foglio**: ridistribuite figure aggiuntive nei box visivi esistenti (massimo 2 supplementari ogni box); se rimangono figure pertinenti, slide *Atlante illustrato* di massimo 4 figure, senza aumentare la durata complessiva del corso e senza alterare geometria fisica 2/A4. Il print preflight ora valida anche i path immagine aggiuntivi.
- **Stampa lezioni/dispensa**: per ogni LU si aggiunge atlante completo immagini contestuali, allineato alla proiezione; stampa tutte le foto/schemi locali già authored che passano la whitelist. Course metadata caricato per escludere i 27 frozen. La navigazione normale delle LU usa la stessa selezione.
- PWA `safety-training-v22-51`, nuovi test di copertura; NO modifiche Supabase, iscrizioni, durate, presenze, attestati, corsi freeze, test. Verificare CI e smoke test visuale per 1440/820/390 e due slide reali per A4. Gli asset non contestualizzati non vengono forzati in lezioni fuori tema; un file disponibile non implica necessariamente che debba comparire in ogni corso.

## 2026-10-20 — v22.22.1 adeguamento test GP04 all'atlante condiviso
- CI #412 ha superato controlli fino al vecchio test GP04: l'aspettativa cercava il selector GP04 direttamente in `app.js`, ma ora la selezione è correttamente centralizzata nel nuovo `graphic-atlas-v22.js` chiamato da app, proiettore e stampa. Aggiornato esclusivamente il percorso nell'asserzione, conservando le verifiche di qualità dei 54 SVG. Ripetere CI e verificare l'eventuale esito dei test seguenti.

## 2026-10-20 — v22.22.2 completamento asset storici originali
- Inventory specifico dei 67 asset non-GP: 42 citati letteralmente nelle famiglie di didattica ed enrichment, altri 25 non citati direttamente (fra cui scene, backgrounds dinamici, poster video, icone, marchio CNA e grafici orfani). Nessun obbligo di mostrare logo/sfondo/video in ogni LU.
- Collegate al nuovo atlante **36 grafiche didattiche legacy** mediante regole contestuali per rischi, organigramma, piramide dei pericoli, stress termico, archivio, rifiuti, verde, VDT, DPI, segnaletica, antincendio, RLS e altri temi. Queste sono visual originali locali, non copie dei 169 PDF di terzi.
- Gli asset si aggiungono alle figure GP nel medesimo percorso di scheda, proiettore, Stampa slide 2/A4 e Stampa lezioni; nessuna durata o layout fisico è modificata. PWA `safety-training-v22-52`, test regressione per le cinque figure storiche più richieste. Verificare CI e correttezza visiva prima del rilascio definitivo.

## 2026-10-20 — v22.23 copertura completa asset e collocazione verificabile
- Creato manifesto versionato di TUTTI i **201** file grafici di `apps/training/assets/`: **200 illustrazioni o poster didattici** assegnati ciascuno a un corso pubblicato non frozen specifico; **1 logo CNA Avellino** collocato nell'agenda, nella slide di apertura modulo (anche stampa due/A4) e nella copertina dispensa. Registro `docs/SAFETYTRAINING_ASSET_COVERAGE.json` elenca ogni filename e corso. Nessun file lasciato senza ruolo.
- Modulo read-only `visual-coverage-v23.js` assegna deterministicamente le immagini al topic più vicino semanticamente tra quelli reali del corso destinazione, senza spostare minuti, modificare LU o forzare grafiche attrezzatura in corsi differenti. Usa `course.topics` sia per proiezione sia per Stampa lezioni (in quest'ultima ora la lista dei topic deriva dalle stesse unità del corso/versione selezionato); `graphic-atlas-v22.js` unisce queste immagini a GP01-04, schemi storici e immagini authored, evitando doppioni.
- La Stampa slide continua a riutilizzare `buildDeck` e mantiene geometria esatta 2 slide/A4; gli extra entrano in slot visivi o nelle slide Atlante. Nuovo test di integrità **201** asset + prova dinamica di ogni file in almeno un topic di un corso destinazione + check di equivalenza proiezione e stampa.
- PWA `safety-training-v22-53`; unchanged 27 frozen, Supabase, iscrizioni, presenze, test, certificati; fonti PDF di terzi ancora in revisione privata e non nel manifesto pubblico. CI / browser QA e stampa fisica da verificare.

## 2026-10-20 — v24.0 struttura privata estrazione PDF integrale
- Verificati i 14 PDF allegati nella conversazione: **4.659 occorrenze** di immagini su pagina, corrispondenti a **2.511 file WebP unici**, deduplica per pixel, zero errori di estrazione; PDF con forme vettoriali senza immagini incluse tramite due anteprime vettoriali e altre pagine idonee. Creati ZIP ~58 MB, CSV + manifest con documento, pagina, categoria, testo, SHA-256, elenco corsi candidati (nell'ambiente file ChatGPT).
- Nuovo schema integrale (v24) asset+ref e bucket privato WebP con RLS solo platform-admin. Non pubblicare immagini da PDF in asset statici GitHub/Vercel. Il caricamento dei binari richiede importazione dal client autorizzato; l'archivio esiste nel runtime ChatGPT, **non** ancora in Supabase né sul deployment GitHub.

## 2026-10-20 — v24.1 archivio PDF privato integrale collegato a slide e stampa
- Importatore in `apps/training/integral-pdf-v24.js` (solo platform-admin): accetta lo ZIP integrale da 14 PDF preparato in ChatGPT con **2.511 WebP unici + 4.659 riferimenti**. Validazione SHA-256/WebP/ID, controllo duplicati, upload privato idempotente/resumable e metadata batch Supabase; UI `Archivio PDF integrale` nell'admin. Nessuna copia di materiale terzo pubblicata su GitHub.
- Per i corsi DB non frozen, matching automatico per categoria, corso, argomento della Learning Unit (regole e punteggio testuale, fallback deterministico), ognuna delle immagini dell'archivio caricata una volta per corso e presentata con fonte e pagina. L'atlante comune richiama i link firmati in memoria sia nella proiezione sia in Stampa slide (print allowlist URL firmate), conservando due slide A4 e includendo eventualmente slide Atlante aggiuntive. Accesso rigorosamente admin: NON abilitare apprendimento pubblico con fonti non autorizzate. PWA `safety-training-v24-01`.
- **Non confondere integrazione di codice con ingest dei file**: le 2.511 immagini sono nello ZIP allegato alla chat e ancora da caricare tramite account platform-admin nell'app (il container ChatGPT non ha connessione HTTP ai sistemi remoti e i tool collegati non accettano binari dal filesystem). Fino all'importazione l'atlante integrale è vuoto. Necessario QA browser e revisione tecnico/normativa/copyright prima dell'uso operativo da parte dei corsisti.

## 2026-10-20 — v24.1.1 PWA retrocompatibilità CI
- Il primo workflow di v24 ha segnalato una vecchia asserzione che verifica la forma `safety-training-v22-N` della cache. Per evitare regressioni inutili con il runtime v22, impostata cache `safety-training-v22-54`, lasciando invariato il numero funzionale del catalogo PDF v24; test del modulo nuovo allineato. Il collegamento di storage e i contenuti non cambiano. Nuova CI da verificare.

## 2026-10-20 — v24.1.2 compatibilità titolo dei handoff
- CI #418 unica regressione prima dei nuovi test: la forma titolo v24.1 non era accettata dal controllo v22.xx. Ampliato regex a v22.xx o v24.xx, mantenendo il requisito di identico heading più recente fra i due registri. Nessuna modifica funzionale/DB.

## 2026-10-20 — v24.1.3 correzione definizione PDF privato nell'atlante
- CI #419: `privatePdf` veniva richiamato nell'array di media ma non definito nel contesto di `collect`. Dichiarata la variabile locale con optional-chain sul nuovo archivio, che è vuota in assenza del modulo o prima dell'importazione; ripristinati i test esistenti e la compatibilità con 134 schemi SVG originali.

## 2026-10-20 — v24.2 catalogo privato filtrabile e completamento vettori
- Aggiunte **124 anteprime di pagine con tracciati vettoriali**, 123 file WebP unici supplementari; ZIP finale **2.634 file visivi distinti e 4.783 riferimenti** a pagine su 14 PDF, con CSV aggiornati per categoria/corso candidato/argomento.
- Archivio integrale ora consultabile dall'admin con anteprime private e filtri categoria/testo dell'argomento, documento, pagina e corso candidato; non sono URL pubblici. Aggiunte corrispondenze tra aggiornamenti attrezzature e corsi base, Fondamenti ed Emergenze. I frozen restano esclusi. Ogni figura ha didascalia che ricorda la necessità di verifica della fonte.
- PWA `safety-training-v22-55`. I file non sono ancora importati nello Storage Supabase (verifica query: 0 file, 0 riferimenti); la pubblicazione funzionale completa richiede importare lo ZIP via account platform-admin. Queste immagini rimangono private per docenza/revisione, non pubbliche per tutti i corsisti.

## 2026-10-20 — v24.3 assegnazione pagine scannerizzate e verifica 65 corsi
- Audit SQL database: **65 corsi attivi non congelati**; le chiavi dirette o tramite alias famiglia del modulo PDF coprono **65/65**, gli altri cataloghi congelati sono esclusi. Nessun contenuto DB dei corsi modificato.
- Per pagine PDF scannerizzate senza testo significativo (es. manuale carrelli), la collocazione non usa più un indice casuale né finge corrispondenza semantica: segue **l'ordine delle pagine** del relativo manuale distribuito fra le LU del corso. Dove c'è testo estraibile, prevale il matching titolo/riassunto. L'attribuzione resta una proposta didattica da verificare prima dell'uso, con fonte e pagina.
- Corretto conteggio finale: 14 PDF, **2.634 immagini WebP uniche** con vettori ricchi, **4.783 riferimenti**. ZIP disponibile nella chat; in produzione ancora 0 immagini perché il trasferimento dal file sandbox al browser amministrativo non è supportato automaticamente. PWA `safety-training-v22-56`, CI da ricontrollare, nessun diritto di terzi pubblicato in repo statico.

## 2026-10-20 — v24.3.1 rettifica test selezione pagine
- CI #422: tutti i regressions precedenti validi; unico errore nel test nuovo per una condizione senza valore didattico (`ratio` non presente in qualsiasi nome o stringa JS). Rimossa asserzione impropria, mantenuti test puntuali su `maxPage.get(r.source_document)` e `if(!t||t===doc)return 0` che verificano il fallback per scansioni. Nessuna modifica runtime.

## 2026-10-20 — v24.3.2 audit verifiche CI/produzione e passaggio operativo
- GitHub Actions **#423 SUCCESS** sul commit `4128e3ba72d27c41b0b3acb6ea6afa013e723203` e Vercel deployment **success**. Tutti i test previsti dall'app e dai nuovi moduli v24 passati; **nessuna prova browser autenticata o stampa A4 fisica** ancora condotta.
- Gli 14 PDF forniti sono stati estratti in **2.634 file WebP distinti, 4.783 riferimenti**, ZIP 64.099.647 byte e catalogo per categoria, corso candidato, argomento, fonte/pagina. Verificate zero immagini mancanti dal file ZIP e zero ID duplicati. Mappatura delle famiglie dei 65 corsi attivi non frozen verificata, 27 corsi sospesi esclusi.
- Supabase v24 installato ma query di produzione = **0 immagini caricate, 0 riferimenti**; il collegamento codice è pronto e il solo passo di import con l'account platform-admin richiede selezionare ZIP dall'interfaccia CNA. Non dichiarare mai che tutte le immagini sono già visibili nella piattaforma prima dell'upload riuscito e QA visuale sulle slide/stampe. Uso interno non sostituisce verifica copyright e revisione medico-normativa dei manuali.

## 2026-10-20 — v24.4 download ripristinato tramite 10 ZIP piccoli
- Segnalazione CNA: il link ChatGPT al file integrale di **61 MB** presenta il messaggio `Non è stato possibile completare questa azione`. Originale verificato con zip.testzip senza errori: **2.634 WebP** e **4.783 riferimenti**.
- Creati localmente **10 ZIP indipendenti di circa 6,1 MB ciascuno**, ognuno contiene un `manifest.json` con `archive_type=safetytraining_partial_v1`, `part_index`, `part_count=10`, `total_assets=2634`, `total_figures=4783`. Tutti gli asset sono unici e tutti i riferimenti restano col file corrispondente; archivi verificati in lettura. Disponibili tramite link sandbox nella conversazione, non su GitHub pubblico.
- Importer `integral-pdf-v24.js` ora accetta il vecchio ZIP completo **o** una selezione multipla delle 10 parti, caricate sequenzialmente; supporta ripresa idempotente e singole parti, controlla ID, firma WebP, SHA256, integrità references, indice/numero delle parti. Storage Supabase resta privato e RLS platform-admin invariata. Nessuna immagine di terzi nel repo, corsi congelati esclusi.
- PWA cache `safety-training-v22-57` e test aggiornati. Non dichiarare importazione conclusa fino a controllo `training_integral_pdf_assets_v24=2634`, `training_integral_pdf_refs_v24=4783` e verifica di slide e stampa A4 in browser. QA di importazione reale ancora da eseguire.

## 2026-10-20 — v24.5 selezione multipla ed eliminazione figure PDF importate
- Implementati nel pannello **Archivio PDF integrale** checkbox per singola immagine, selezione di tutte le immagini della pagina (fino a 100 per operazione), selezione mantenuta navigando tra pagine, deselezione ed **Elimina N immagini selezionate** con conferma esplicita del numero di riferimenti pagina che saranno rimossi.
- L'eliminazione riservata al solo `platform_admin` è eseguita da funzione SQL `training_delete_integral_pdf_assets_v24(text[])` con controllo auth server, rimozione atomica dei riferimenti `training_integral_pdf_refs_v24` e dei record `training_integral_pdf_assets_v24`, più tombstone `training_integral_pdf_deleted_v24` per evitare la ricomparsa dei loghi/immagini scartate se l'admin reimporta le 10 parti ZIP. Nessuna modifica ai corsi, agli iscritti, alle slide authored o agli attestati.
- Storage DELETE limitato dalla RLS al bucket privato `training-source-figures` e al prefisso `integral/v1/`, solo platform-admin. Dopo commit database, l'interfaccia rimuove le immagini fisiche con API Storage e marca i file ripuliti; pulsante **Riprova pulizia file** gestisce eventuali fallimenti post-commit senza rendere visibili immagini rimosse. Cache del proiettore svuotata; per una sessione già aperta serve ricaricare la presentazione/stampa.
- Catalogo resta privato per revisione CNA, fonti di terzi non committate su GitHub. PWA `safety-training-v22-58`, nuovi test. Migration `20261020204500_v24_005_delete_imported_pdf_figures.sql` da applicare. QA reale in browser e prova eliminazione da account admin da effettuare; **non cancellare dati esistenti durante i test**.

## 2026-10-20 — v24.6 ZIP figure complete
- Ricostruite 856 tavole complete dagli originali 14 PDF su 1.219 pagine; 363 pagine non grafiche non selezionate. Nove ZIP da circa 5–7 MB con manifest v2, catalogo per fonte, pagina, corso e argomento. Le slide/stampe useranno solo gli ID nuovi >=pdf-50000, escludendo i frammenti della precedente estrazione. Nessuna cancellazione automatica. Materiale riservato a revisione didattica e diritti.
- PWA safety-training-v22-59; import e QA stampa da verificare.

## 2026-10-20 — v24.6.1 filtro archivio vecchio e nuovo
- Importer delle 9 parti figure complete validato da GitHub Actions #427, Vercel deploy success. Aggiunto filtro in catalogo amministratore: **Nuove tavole complete / Vecchi frammenti da scartare / Tutte**. Default nuove figure; cambiare filtro azzera selezione per evitare cancellazioni involontarie del lotto nuovo. La precedente funzione selezione multipla elimina i vecchi file su richiesta amministratore, con tombstone anti-reimport.
- PWA `safety-training-v22-60`; nuovo controllo statico. La pulizia NON è stata eseguita automaticamente, in attesa della selezione amministrativa e dell'import del nuovo ZIP; la verifica stampa reale resta necessaria.

## 2026-10-20 — v24.6.2
- Riparato il testo di un'etichetta nel pannello di importazione delle tavole complete e avviata una nuova verifica CI.

## 2026-10-20 — v24.6.3
- Aggiornata l'asserzione residua del test importer alle 856 tavole complete del nuovo archivio, al posto del vecchio numero di frammenti. Nessuna modifica al runtime o ai dati.

## 2026-10-20 — v24.6.4
- Importer dei nove ZIP aggiornato per il conteggio 856 immagini/856 riferimenti del lotto intero. Importazione a parti separata dagli asset originari, archivio rimane privato e i dati didattici sono invariati.

## 2026-10-20 — v24.7 pulizia autorizzata del vecchio lotto PDF
- Richiesta esplicita di proseguire sulla cancellazione dopo conferma dei conteggi. Verificata disgiunzione totale fra 1.290 frammenti (1.899 riferimenti) e 856 tavole complete. Eseguita pulizia logica in transazione con guardie sui conteggi: 1.290 tombstone persistenti `deletion_origin=chatgpt_user_authorized_maintenance`, 1.899 riferimenti vecchi e 1.290 record asset eliminati. **856 immagini nuove + 856 riferimenti intatti**; vecchi riferimenti rimasti: 0.
- Modifica audit schema: `training_integral_pdf_deleted_v24.deleted_by` ora nullable per azioni di manutenzione autorizzate via chat e colonna `deletion_origin` per differenziare `platform_admin_ui` vs `chatgpt_user_authorized_maintenance`. Ogni asset nuovo resta separato.
- **Rimane pulizia fisica Storage da completare**: 1.290 tombstone con `storage_cleared_at IS NULL`, 2.146 oggetti nel bucket prima della pulizia fisica. NON cancellare via SQL direttamente `storage.objects` (rischio orfani); usare pulsante amministrativo `Riprova pulizia file` ripetutamente o API Storage con account platform-admin, aggiornando `storage_cleared_at`. Non dichiarare spazio liberato finché il controllo degli oggetti non conferma 856 restanti.

## 2026-10-20 — v24.7.1 completamento pulizia Storage da UI
- Pulsante **Riprova pulizia file** aggiornato per eseguire fino a 30 batch da 100 file in sequenza, con progressivo e arresto automatico a fine coda. Mantiene le verifiche admin e le policy Storage. Nessun file eliminato dal solo deploy: cliccare il pulsante con account platform-admin per rimuovere fisicamente gli oggetti tombstonati. Verificare CI e deploy e quindi ricontare oggetti.

## 2026-10-20 — v24.7.2 pulizia Storage completata e pipeline slide/stampa verificata staticamente
- Dopo l'azione dell'admin **Riprova pulizia file**, controllo diretto Supabase: **856/856** asset nuovo lotto rimasti nel database, **856/856** riferimenti nuovo lotto rimasti, **856/856** oggetti Storage fisicamente presenti. Vecchi riferimenti **0**, vecchi oggetti Storage **0**; tombstone lotto frammentato **1.290**, cancellazioni Storage in sospeso **0**, oggetti Storage integrali totali **856**.
- Lettura del codice: `prepareCourse` filtra riferimenti ID `>= pdf-50000` e viene chiamato dalle rotte proiezione e dalla Stampa slide, che riutilizza `projection.buildDeck(converted)`; `safeSlideImage` accetta URL privati firmati solo se riconosciuti dalla cache del modulo; il CSS stampa conserva A4 verticale, due slot da 112 mm ciascuno. Nessuna modifica funzionale al deploy in questa nota.
- Ancora da svolgere: prova da browser con login amministratore su una presentazione con figure complete, controllo anteprima PDF e foglio A4 reale, verifica della leggibilità e pertinenza tecnica/diritti. Non confondere controlli statici e presenza file con validazione visiva.

## 2026-10-20 — v24.8 audit di pertinenza didattica immagini nelle slide e stampa
- Audit fonte: 856 tavole PDF, incluse 166 descrizioni identiche «Tavola illustrata completa (pagina scannerizzata)», 43 firme del relatore ricorrenti, 33 intestazioni generiche «LE IMBRACATURE...», 32 «D. Lvo 81/2008 –» e 19 titoli PLE ripetuti. Queste descrizioni non giustificano l'assegnazione alla Learning Unit; campionati visivamente tutti gli 89 fogli del Manuale carrelli (copertine, pagine testuali, schemi distinti).
- Eliminata l'assegnazione in base alla progressione della pagina nel PDF, i tie-break in assenza di evidenza e gli alias del corso che introducevano fonti generali in corsi specialistici. Per gli altri manuali, solo corrispondenze terminologiche distintive nel TITOLO LU e univoche, non basate sui summary boilerplate; intestazioni ripetute e genericamente datate sospese. Nel manuale carrelli adottata una tabella editoriale delle sole pagine didatticamente illustrate, abbinate ai temi effettivi (tipologie, baricentro, componenti, circolazione, manutenzione); copertine e pagine non pertinenti sospese.
- Nessuna immagine cancellata: gli 856 WebP e le fonti restano nell'archivio privato admin con indicazione di revisione, ma solo le figure con abbinamento più affidabile compaiono nelle slide e nella Stampa slide, che condividono buildDeck. Esclusi corsi congelati.
- GP04 non sceglie più due disegni casuali per corso se il titolo della LU non contiene il tema; i 201 asset originali v23 restano in inventario ma non sono più forzati in prima LU quando score zero. Attestati, frequenze, contenuti LU e DB non modificati. PWA `safety-training-v22-61`; suite di regressione aggiornata. Restano revisione visuale individuale di ogni tavola, normativa/diritti e stampa browser fisica.

## 2026-10-20 — v24.8.1 controllo immagini principali della LU
- Controllato `db-slide-adapter.js::normalizeImages`: in assenza di foto esplicite creava **tre immagini inference usando tutto il contesto** (nome corso, famiglia, modulo), causando ripetizioni e immagini inappropriate in tutte le LU di un corso (es. un diagramma genericamente relativo a macchine su una LU di stabilità/batterie). Eliminata questa inferenza indiscriminata; conservati gli asset autoriali espliciti, overlay originali topic-matched (GP02/GP04 e atlante revisionato) e fallback neutro delle slide. Nessuna immagine fisica né dato LU cancellato.
- Test regressione del comportamento adapter aggiunto, senza cambiare formati stampa o dati. Verificare CI e deploy.

## 2026-10-20 — v24.8.2 rapporto di audit immagini / pagine Carrelli
- Rifinita dopo controllo delle due contact sheet del Manuale carrelli la selezione delle pagine da proporre nelle Learning Unit. Escluse altre pagine a prevalenza testuale (es. 71–73), mantenute le tavole illustrate su portata, baricentro, tipologie, organi di presa, circolazione e controlli.
- Pubblicato il rapporto `docs/SAFETYTRAINING_VISUAL_RELEVANCE_AUDIT_20261020.md` con inventario 856 figure/11 categorie, anomalie di pertinenza documentate (166 etichette generiche, 351 etichette ripetute almeno quattro volte), modifiche a matching PDF / GP04 / SVG originali / adapter e limiti della revisione. I 856 file rimangono archiviati; figure senza sufficiente corrispondenza non sono eliminate ma restano in verifica admin.
- Non eseguita prova visiva del browser autenticato né di tutti i 856 estratti singolarmente, né stampa fisica; fare QA per corsi principali prima dell'uso, controllare anche diritti e accuratezza tecnico-normativa.

## 2026-10-20 — v24.8.3 etichette SVG e assegnazione carrelli 16h
- Corretti 48/48 schemi GP02 originali (144 etichette letterali "undefined") con indicazioni preventive attinenti al disegno. Aggiunto test anti-regressione.
- Corretto matching corso `attr_carrelli_all` («Carrelli Elev. Ind + Telescopici + Rotativi») e riutilizzati solo gli SVG industriali con punteggio della LU univoco. Bloccati pareggi e contaminazioni tra famiglie attrezzature.
- Versione PWA cache `safety-training-v22-62`; predisposte prove automatiche per riconoscimento corso combinato, assenza placeholder, blocco abbinamenti ambigui e conservazione frozen.
- Nessuna scrittura Supabase: 856 tavole private, 856 riferimenti, corsi congelati, studenti, presenze e attestati invariati. Restano la revisione tecnico-legale degli estratti PDF e l'ispezione del browser autenticato e della stampa A4.
- Rapporto: `docs/SAFETYTRAINING_VISUAL_RELEVANCE_AUDIT_20261020.md`. CI/deploy da verificare.

## 2026-10-20 — v24.8.4 correzione sovrapposizione immagini e stampa 1 slide per pagina
- Problema riportato nelle slide Carrelli: gallerie automatiche da 2 immagini supplementari sulle figure principali, mentre CSS globale dava 590px di altezza a ogni immagine della griglia, causando tagli e sovrapposizioni.
- Corretto il distributore didattico: ogni figura aggiuntiva, compresa la tavola PDF completa amministrativa, viene visualizzata su una propria slide Atlante, mantenendo l'immagine principale separata e il rapporto di forma con `object-fit:contain`. Nessuna immagine eliminata né esposta pubblicamente.
- Stampa slide / salva PDF: **una slide completa per pagina A4 orizzontale** (non più 2 per A4 verticale). Rendering 1600x900, cornice 270x151,875 mm, scala fisica 0,63; margini A4 10 mm. Anteprima, indicatore fogli e test aggiornati.
- CSS Atlante riorganizzato a una figura per slide, didascalie con testo a capo e altezza immagine vincolata alla cornice. Preservati corsi congelati, versione pubblicata LU, verifiche corsisti, tempi nominali e permessi. Supabase non richiede migrazioni.
- PWA `safety-training-v22-64`; verificare GitHub Actions, deploy Vercel e QA visivo in browser (inclusa prova stampa) prima della validazione finale.

## 2026-10-21 — v24.8.5 audit didattico delle attrezzature e QA immagini
- Audit di produzione in sola lettura: 6 percorsi principali controllati (carrelli industriali e combinati, PLE, gru per autocarro, MMT combinato ed escavatori). Nessuna referenza a Learning Unit mancante o versione LU non pubblicata.
- **Carrelli combinati 16h: priorità alta.** Pubblicate 8 LU con gli stessi titoli del corso industriale 12h; in `learning_unit_versions.content` sono assenti i termini `telescop` e `rotativ` (0/8 unità per ciascun termine). È assenza di evidenza esplicita, non prova di pratica mancante. Il responsabile deve verificare 8 ore teorico-tecniche + 8 ore pratiche specifiche su industriali, telescopici e rotativi, disponibilità delle macchine e prova osservata, secondo ASR 17/04/2025.
- Dashboard amministrativa Qualità didattica: evidenza di revisione pratica/varianti nei percorsi attrezzature; il carrelli 16h sale in cima alle priorità senza modificare il suo stato di pubblicazione o attribuire competenze/attestati.
- GP02: raffinato matching di titoli LU reali gru (portata/tabelle, pre-utilizzo, segnaletica gestuale), PLE (controlli), MMT (controlli). Regressioni atlas estese ai quattro gruppi: un SVG o pagina PDF per slide supplementare, no sovrapposizioni forzate.
- PWA `safety-training-v22-65`. Nessuna scrittura a Supabase e nessuna modifica a corsisti, presenze, corsi frozen o documenti PDF privati.
- Registro tecnico dettagliato `docs/SAFETYTRAINING_QA_ATTREZZATURE_20261021.md`. Da completare: QA browser autenticato e stampa reale, validazione tecnico-legale delle figure, simulazione con utente test e revisione backend. Controllare CI e Vercel del commit.

## 2026-10-21 — v24.8.6 ripetizione verifica finale e controllo backend
- Audit SQL in sola lettura: 6 corsi attrezzature hanno ciascuno un test attivo da 10 domande con soglia 70%; tabella iscrizioni 2 record, sessioni 0, tentativi 0; nessun riferimento orfano o contatore fuori intervallo nel campione esaminato. RLS attiva sulle 13 tabelle principali esaminate. **Non è un test end-to-end autenticato**.
- Difetto confermato: `final-test-v20.js` creava sempre `attempt_no:1`; Supabase impone vincolo unico su iscrizione, test e numero tentativo. Corretto calcolando il massimo tentativo precedente + 1 e aggiunto test VM di regressione. Nessuna scrittura a iscrizioni o tentativi esistenti.
- PWA `safety-training-v22-66`. Aggiornato `docs/SAFETYTRAINING_QA_ATTREZZATURE_20261021.md`. Ancora da collaudare con account prova controllato: rinnovo tentativi, valutazione server, sessioni, autorizzazione pratica e rilascio attestati. Verificare CI e Vercel.

## 2026-10-21 — v24.8.7 presentazioni veloci, piramidi leggibili, frecce e gestione immagini
- Segnalazione: tempi di caricamento delle presentazioni e passaggi fra slide lunghi, apice della piramide illeggibile, assenza frecce testuali evidenti e richiesta di un inventario amministrativo delle immagini.
- Proiettore: aggiunta cache deck per oggetto corso, riutilizzo del contenitore esistente e sostituzione del solo articolo della slide in navigazione; nessuna compilazione integrale ogni passo. Frecce «← Indietro» e «Avanti →» nel footer, mantenuti controlli laterali e tasti direzionali.
- Caricamento privato: le tavole PDF vengono associate alle Learning Unit PRIMA di richiedere URL firmati; ingresso deck immediato da SVG locali mentre i PDF riservati autorizzati arrivano, con refresh sicuro dell'indice senza mescolare sessioni. Dismesso il precache iniziale di centinaia di immagini: shell essenziale e cache on-demand.
- Piramide dei pericoli: SVG corretto con testo breve al vertice, didascalia completa esterna ad alto contrasto, testi a capo e dimensione maggiore.
- Aggiunta «Gestione immagini» nell'amministrazione: inventario navigabile dei **201 file grafici locali**, conteggi immagini/tavole private realmente importate, 24 anteprime per pagina, ricerca, categoria e accesso agli importatori/eliminatori già esistenti. Le immagini locali distribuite con l'app restano in sola lettura: gestire il relativo file richiede deploy. I PDF restano privati e con diritti/revisione richiesti.
- PWA `safety-training-v22-67`; test `tests/deck-performance-v25.test.mjs` e validazione statica previsti nel pacchetto `npm run check`.
- Documento tecnico: `docs/SAFETYTRAINING_PERFORMANCE_IMAGES_20261021.md`. Nessuna mutazione a Supabase/corsi frozen/frequenze/attestati. Necessari dopo deploy: QA cronometrato in browser autenticato e verifica visiva di proiettore, piramide e gestione immagini.

## 2026-10-21 — v24.8.7.1 regressione test posizionamento PDF
- CI della prima release ha eseguito con successo i test precedenti ma si è fermata su una vecchia asserzione testuale (`if(idx<0)continue`) non più presente dopo che il posizionamento PDF è stato anticipato prima di `createSignedUrls`. Aggiornato il test per verificare il filtro `index>=0` invece della sintassi eliminata. Nessuna modifica al runtime, ai dati o alla cache.

## 2026-10-21 — v24.8.8 stati di revisione tavole PDF (senza autopubblicazione)
- Verifica tecnica: le 856 tavole integrate da PDF avevano `rights_status=review_required` e `technical_review_required=true`, senza workflow di approvazione. Questi campi di provenienza non sono direttamente filtri di collocazione: nel proiettore amministrativo contano i permessi e il matching `placementIndex`, mentre nel percorso corsista i PDF privati non vengono pubblicati.
- Introdotti due stati di revisione indipendenti per ciascun riferimento immagine (`training_integral_pdf_reviews_v25`): accuratezza tecnico-didattica (`pending/approved/rejected`) e diritti di impiego interno (`review_required/cleared_internal/rejected`). Motivo tecnico da 25 caratteri, evidenza verificabile dei diritti da 20 caratteri se dichiarati liberati per uso interno.
- Soltanto platform-admin autenticato può salvare una decisione tramite la funzione SQL `training_review_integral_pdf_v25`, con controllo identità, input validato, motivazione obbligatoria e storico append-only `training_integral_pdf_review_events_v25`. RLS admin-only. Nessuna riga precedentemente importata viene marcata automaticamente approvata.
- La pagina Amministrazione > Gestione immagini offre la scheda «Esamina / cambia stato di revisione» per ogni riferimento integrale con select separati, note e documento/licenza, conferma esplicita prima dell'approvazione, ricarica del catalogo. Presentazioni admin e stampa non devono mostrare immagini formalmente respinte; ricalcolano cache dopo una decisione. Figure in attesa restano eventualmente visibili come **anteprima privata non validata** nell'eventuale slide ben abbinata; immagini approvate per uso interno **non diventano pubbliche**.
- Conservati i vincoli originali dei PDF importati: `rights_status='review_required'` e `technical_review_required=true` nelle tabelle di fonte sono dati di provenienza e non vengono sovrascritti. Il nuovo stato di revisione è separato e verificabile.
- Migration `supabase/migrations/20261021094500_v25_001_integral_pdf_review_workflow.sql`; test `tests/integral-pdf-review-v25.test.mjs`. PWA `safety-training-v22-68`. Nessuna modifica a corsi frozen, corsisti, attestati o diritti reali. Da verificare CI, deploy e SQL applicato.

## 2026-10-21 — v24.8.9 associazione manuale immagini approvate alle Learning Unit
- Richiesta eseguita: dopo la verifica indipendente dei diritti e dell'accuratezza, l'amministratore può collegare una figura privata esattamente a un corso, modulo e argomento della **versione attualmente pubblicata**. Non sono effettuate assegnazioni di massa o automatiche.
- Aggiunta `training_integral_pdf_placements_v25` con riferimento immagine, chiave corso, UUID versione e numero versione, modulo, posizione unitaria, motivazione, autore e timestamp; `training_integral_pdf_placement_events_v25` conserva storici attach/detach. RLS SELECT amministratori, modifiche soltanto da RPC `training_place_integral_pdf_v25` (verifica `auth.uid`, `private.is_platform_admin`, pubblicazione versione, blocco frozen, validità modulo/posizione e doppia approvazione `training_integral_pdf_reviews_v25`); le immagini restano nello Storage privato.
- In `Gestione immagini > Tavole PDF complete importate` ora appare per ogni figura la scheda `Associa a corso, modulo e argomento`; gli elenchi moduli/argomenti si caricano solo scegliendo il corso, con motivo obbligatorio. Elenco delle associazioni attuali e pulsante rimozione con motivazione e conferma. Solo immagini con `technical_status=approved` e `rights_status=cleared_internal` possono ricevere nuovi collegamenti.
- Presentazione e stampa amministrative usano entrambe `SAFETY_INTEGRAL_PDF_V24.prepareCourse` / `pick`: la corrispondenza manuale ha precedenza sull'associazione euristica, non incorpora tavole respinte e non riguarda corsi congelati o l'area corsista. Rilettura dati versionata, URL effimeri e invalidazione cache dopo modifica.
- DB migration `supabase/migrations/20261021105000_v25_002_integral_pdf_manual_placements.sql` applicata sul progetto collegato; verifica in sola lettura: **0 associazioni e 0 eventi**, RLS attiva su entrambe le nuove tabelle, 2 policy admin-only; 0 figure approvate inizialmente. Nessun contenuto o diritto attestato fittiziamente.
- JS nuovo `apps/training/admin-image-placement-v25.js`, CSS e tests `tests/integral-pdf-placement-v25.test.mjs`; PWA `safety-training-v22-69`. CI, deploy e prova in browser autenticato ancora da verificare a conclusione commit.

## 2026-10-21 — v24.8.9.1 allineamento regressione cache offline
- Corretto il test `tests/deck-performance-v25.test.mjs` rimasto al precedente identificativo PWA `safety-training-v22-68` dopo l'aggiornamento runtime a `safety-training-v22-69`. Runtime, immagini, permessi e database invariati; nuova esecuzione della suite richiesta.

## 2026-10-21 — v24.8.10 catalogo di proposte prudenti ed esclusioni reversibili
- Richiesta utente: scegliere proattivamente corso/modulo/argomento in Gestione immagini senza delegare il matching, lasciando all'amministratore la revisione tecnica e dei diritti e la possibilità di escludere.
- Aggiunta RPC admin-only `training_image_matching_catalog_v26`: contiene i titoli delle unità delle versioni pubblicate dei corsi attivi e non congelati, con chiavi e posizioni moduli esatte. Non modifica corsi o unità.
- `apps/training/image-suggestions-v26.js` analizza **metadati, categoria, titolo e testo derivato dalle fonti** per restituire fino a 3 collocazioni candidate e il grado di evidenza `candidate_strong`, `uncertain`, `unassigned`. Il componente DICHIARA che **non ha letto i pixel** degli 856 file privati: i titoli generici (D.Lvo etc.) non determinano abbinamenti; niente autoconvalida e niente associazione forzata.
- Aggiunto pulsante amministrativo `Escludi dalle presentazioni` / `Ripristina nelle presentazioni`, diverso dall'eliminazione dell'originale, con motivazione obbligatoria. Stato persistito in `training_image_exclusions_v26` e RPC `training_set_image_exclusion_v26` esclusivamente platform-admin. Il renderer PDF privato filtra gli ID esclusi quando costruisce presentazione e stampa amministrative. Il catalogo permette anche l'esclusione delle figure SVG/PNG, ma la propagazione automatica dello stato alle immagini locali di TUTTE le modalità viewer va ancora completata e verificata: non dichiararla conclusa.
- Continuiamo a NON approvare in modo automatico i diritti di nessuna tavola; zero verifiche tecniche/diritti inventate, zero associazioni salvate arbitrariamente. Lo stato di immagine privata nel viewer continua a rispettare permessi e `technical_status`/`rights_status`.
- Migration: `supabase/migrations/20261021170000_v26_image_matching_and_exclusions.sql` applicata; `tests/image-suggestions-v26.test.mjs`; PWA `safety-training-v22-71`. Necessario test CI, deploy, verifica live con login e reale classificazione VISIVA per elevare una proposta da metadati a revisione grafica.

## 2026-10-21 — v24.8.10.1 esclusioni locali nell'atlante
- Filtraggio delle illustrazioni locali SVG/PNG in `SAFETY_VISUAL_ATLAS_V22.collect` con lista persistente proveniente dalla RPC `training_excluded_local_images_v26`. Il filtraggio viene applicato alle figure supplementari nell'atlante, usate anche nella stampa amministrativa dei corsi; immagini eroiche authored già presenti in slide originarie non vengono automaticamente mutate. Refresh su login e dopo azione di esclusione; invalidazione cache deck.
- Guard `typeof document!=='undefined'` per test Node VM. PWA cache `safety-training-v22-71`; tests del service worker riallineati.
- Da collaudare: comportamento completo del viewer e stampa reali, navigazione con sessione autenticata. La classificazione visiva delle 856 immagini non è stata eseguita: suggerimenti soltanto sulla base di titoli/categorie; nessun accoppiamento salvato senza verifica diritti e qualità.

## 2026-10-21 — v24.8.11 prima verifica visiva delle tavole PDF
- Dal Library dell'utente recuperati 9 ZIP `SafetyTraining_FIGURE_COMPLETE_PARTE_01..09_di_09.zip` e archivio indice; verificati 856 riferimenti, 856 WebP unici, 13 documenti d'origine. Costruiti fogli di contatto delle pagine complete e osservate figure tecniche, copertine, segnaposto video, informazioni mediche e normative datate.
- Registrati su Supabase **75 casi di esame visivo individuale** (`training_integral_pdf_visual_audit_v27`): 51 candidati di pertinenza, 8 richiedono valutazione specialistica, 2 necessitano ridisegno, 14 suggeriti per non inserimento. Ogni record ha descrizione osservata, motivazione, eventuale corso/modulo/posizione e dicitura che non certifica diritti o correttezza tecnica. **Nessuna figura è stata esclusa/eliminata automaticamente**.
- Calcolati 64-bit pHash da WebP originali per 856 file e individuate **57 coppie potenzialmente simili** nello stesso documento con rapporto dimensioni simile e distanza di Hamming <=7; registrate in `training_integral_pdf_similarity_v27`. Somiglianza non dimostra duplicazione: serve controllo visivo ulteriore.
- Aggiunta lettura protetta per sola amministrazione nello script `image-suggestions-v26.js`, con osservazione visiva e segnalazione di somiglianze accanto alle proposte basate su testo. Stato amministrativo `Esamina / cambia stato di revisione` resta separato. Al momento del controllo: 75 esaminate, 57 coppie; 1 figura risultava approvata separatamente dall'amministrazione, 0 associazioni manuali.
- Migrazione `supabase/migrations/20261021174500_v27_visual_figure_audit.sql` applicata. PWA `safety-training-v22-72`. CI e Vercel da verificare dopo commit, revisione del layout autenticato ancora pendente. Prima fase parziale: le altre 781 figure non hanno ancora scheda di osservazione visiva individuale, benché siano state estratte e processate per similarità.

## 2026-10-21 — v24.8.12 schermata di triage totale delle figure PDF
- Materiale privato originale: 856 WebP, 23 contact sheets da nove ZIP e 13 sorgenti. 57 coppie confrontate visivamente: **zero coppie identiche pixel per pixel**, soprattutto layout condivisi con testo differente. Evitare eliminazione automatica.
- Migrazione `supabase/migrations/20261021185500_v28_complete_image_triage.sql` applicata: nella `training_integral_pdf_visual_audit_v27` aggiunte **555** schede di **triage per gruppo**, marcate `contact_sheet_group_visual_triage`, da NON confondere con le precedenti **75** schede individuali. Le restanti **226** figure hanno record di **screening per famiglia della fonte**, nella nuova `training_integral_pdf_screening_v28`. 856 su 856 coperte da almeno un livello.
- Le 630 schede visive indicano: 51 candidate (solo individuali), 387 da ridisegnare, 160 da valutare da esperto (clinico, tecnico, normativo), 32 suggerimenti di esclusione non applicata. `training_integral_pdf_comparison_v28` dettaglia tutti i 57 casi; admin-only RLS su due nuove tabelle enessuna scrittura ai diritti/stati approvativi.
- In Gestione immagini `image-suggestions-v26.js` ora espone con titoli umani Corso → Modulo → Argomento i suggerimenti osservati, etichettati per profondità (individuale / gruppo / solo fonte) e il confronto di somiglianza verificato. Dashboard mostra i tre conteggi distinti. Corretto `count(*)` per tabelle PK non `id`.
- Policy slideshow riservato + PDF di stampa: vietato inserimento di qualunque fonte PDF privata non verificata. Ammesse SOLO associazioni manuali o candidate da osservazione **individuale** `recommendation=candidate` con esito `technical_status=approved` e `rights_status=cleared_internal`, versione pubblicata non frozen, nessuna esclusione. Si rinuncia alla proiezione didattica automatica basata solo su keyword; il catalogo amministrativo rimane consultabile per la revisione. Nessuna delle 555 osservazioni di gruppo o 226 preliminari viene auto-applicata.
- Script e tests: `apps/training/integral-pdf-v24.js`, `apps/training/image-suggestions-v26.js`, `apps/training/admin-image-library-v25.js/css`, `tests/integral-pdf-audit-v28.test.mjs` e regressioni aggiornate. PWA `safety-training-v22-73`; rapporto `docs/SAFETYTRAINING_VISUAL_AUDIT_PHASE2_20261021.md`. CI/production ancora da verificare dopo commit.

## 2026-10-21 — v24.8.12.1 test regression alias
- Test `tests/image-suggestions-v26.test.mjs` corretto: dopo l'introduzione della tabella di confronto verificato `training_integral_pdf_comparison_v28`, il front-end non interroga più direttamente `training_integral_pdf_similarity_v27`. Primo ciclo CI fallito per vecchia asserzione; nuovo ciclo da verificare.
- Nessuna variazione ai contenuti, alla revisione tecnica, ai permessi o al database.

## 2026-10-21 — v24.8.12.2 seconda sincronizzazione test
- Dopo nuova dicitura UI «Questa osservazione non approva i diritti», corretto il test precedente rimasto alla frase «La valutazione visiva non approva i diritti». CI precedente fallita per una vecchia asserzione testuale, non un errore dati. Nessuna modifica a source, rights, RLS o corsi.

## 2026-10-21 — v24.8.12.3 correzione sintassi test
- In `tests/integral-pdf-audit-v28.test.mjs`, un carattere escape letterale `\\n` era rimasto tra due asserzioni dopo un refactor, causando `SyntaxError` in GitHub Actions. Convertito in newline reale. Nessuna variazione runtime/SQL.

## 2026-10-21 — v24.8.12.4 ripristino integrazione completa del release
- La prima tree assembly aveva sovrascritto `integral-pdf-v24.js` e `admin-image-library-v25.js` con versioni di `main` precedenti, pur conservando i tests corrispondenti. Ripristinata ora in UNICO commit la query delle 51 candidate visive individuali della versione pubblicata, con doppia approvazione e collocazione precisa, e i conteggi di dashboard 75/555/226/57. Verificare nuovo diff del commit e GitHub Actions prima del deploy Vercel.

## 2026-10-21 — v24.8.13 filtri avanzati Esplora immagini
- Richiesta utente: aggiungere a Gestione immagini/Esplora immagini filtri oltre ad Archivio: Esaminate, Da associare, Associate, Corso, Modulo e aggiornare le guide.
- Migrazione `supabase/migrations/20261021192500_v29_admin_image_filters.sql`: RPC `training_image_filter_page_v29` `SECURITY DEFINER` con `private.is_platform_admin`, ricerca + stato + corso + modulo + paginazione 24 su **intero archivio PDF**, `total` e `ids`; nessun filtro solo sui 24 elementi già caricati. Revoke public/anon. Status `all,examined,individual,group,screening,approved,review_pending,to_associate,associated,excluded,rejected`.
- Semantica: `examined` significa presenza di scheda visiva individuale o per gruppo, indipendentemente da validazione diritti; `screening` è valutazione preliminare per fonte; `associated` significa immagine inseribile in presentazione amministrativa nella versione pubblicata, con entrambe le approvazioni e abbinamento corrente manuale o visuale individuale; `to_associate` significa proposta esistente ma non attiva; NON pubblica immagini ai corsisti.
- Nuovi controlli `stImageStatus`, `stImageCourse`, `stImageModule` in `apps/training/admin-image-library-v25.js`. Corso e Modulo a cascata mediante `training_image_matching_catalog_v26`, sola scelta su corsi pubblicati non congelati. Filtri didattici disabilitati per Illustrazioni locali/Estratti, mantenendo ricerca testuale. La griglia conserva miniature private firmate solo per le 24 righe richieste.
- `apps/training/admin-help-v22.js` aggiunge guida contestuale `Gestione immagini`. Guida completa `docs/SAFETYTRAINING_GUIDA_FILTRI_IMMAGINI_20261021.md`, con percorsi d'uso, definizioni esatte e precauzioni. CSS responsive aggiornato. Test `tests/admin-image-filters-v29.test.mjs`; PWA `safety-training-v22-74`.
- Da registrare esito finale GitHub Actions/Vercel. Conservati 27 corsi frozen e tutte le autorizzazioni storiche, nessuna assegnazione automatica aggiuntiva.

## 2026-10-21 — v24.8.14 proposte multi-corso da immagini osservate
- L'amministratore autorizza l'uso interno come dichiarazione organizzativa, non come prova verificata di titolarità/licenza terza parte; non si falsifica «Verificata da un esperto» senza una verifica specialistica documentata. Nessun cambio agli stati di revisione esistenti.
- Nuova migrazione `supabase/migrations/20261021194500_v30_multiple_placement_proposals.sql`: tabella privata admin-only RLS `training_image_placement_proposals_v30` con chiave composita `(ref_id,course_key,module_key,unit_position)`; una stessa figura ha più proposte in più corsi, senza duplicare asset. Destinazioni solo su versioni pubblicate non congelate, con motivazione, annotazione «Autorizzata da amministratore per uso interno — dichiarazione amministrativa, non licenza del titolare dei diritti». Nessun inserimento in `training_integral_pdf_placements_v25` né approvazione fittizia.
- Verifica SQL: 76 proposte distribuite in 11 corsi, tra cui antincendio L2/L3, carrelli industriali/combinati, MMT complessivo/escavatori, PLE, gru, lavori in quota, primo soccorso A/B-C. Frontend `image-suggestions-v26.js` le elenca in Gestione immagini con descrizioni Corso → Modulo → Argomento e motivazioni.
- Il motore delle slide/PDF continua a rispettare doppia validazione tecnica e dei diritti, esclusioni e limiti sui corsi frozen. La nuova tabella è una coda editoriale, non pubblica e non attiva da sola le 76 proposte.
- PWA `safety-training-v22-75`, test `tests/image-placements-v30.test.mjs`. CI e deployment da verificare.

## 2026-10-21 — v24.8.15 correzione Stampa bloccata: Modulo 1 senza Learning Unit
- Diagnosi Supabase READ-ONLY: **6 corsi pubblicati** con moduli segnaposto storici senza LU, nello STESSO `position=1` di un modulo reale con LU pubblicate: `agg_lav`, `agg_dir`, `agg_prep`, `agg_rls_4h`, `agg_rls_8h`, `lav_quota`. Le versioni v2 pubblicate contengono rispettivamente 4,4,4,4,8,8 collegamenti LU validi nei loro moduli effettivi; non c'è perdita delle Learning Unit.
- `admin-print-lessons-v23.js`: introdotta `classifyPrintModules(modules,links)`; omette dal processo di stampa SOLO modulo **vuoto** con uno dei tre `module_key` storici `dynamic_update`, `dynamic_rls_update`, `height_theory` QUANDO esiste un altro modulo alla stessa posizione con Learning Unit. Altri moduli vuoti o corsi privi di LU restano bloccati. `loadBook` restituisce le LU pubblicate intatte e `ignoredPlaceholders`; il riepilogo stampa spiega l'omissione.
- `admin-print-slides-v23.js`: usa lo stesso `loadBook`, mostra avviso nelle slide stampabili, mantiene preflight `inspectBook` e controllo delle immagini. `db-slide-adapter.js`: la presentazione in aula scarta lo stesso guscio duplicato dalla durata didattica senza cancellare dati o modificare il curriculum pubblicato.
- Nessuna scrittura al database, nessun cambiamento a certificati, presenze, diritti o 27 corsi frozen. Solo normalizzazione della vista. Test nuovo `tests/print-legacy-placeholders-v31.test.mjs` con casi reali e guardie per i moduli veramente incompleti, incluso caricamento mock e adattamento deck. PWA cache `safety-training-v22-76`.
- GitHub Actions e distribuzione Vercel da verificare dopo commit. Per prova manuale: Amministrazione → Stampa slide / Stampa lezioni, selezionare `agg_lav` o `lav_quota`, versione v2. Deve apparire un modulo reale con LU e un avviso sul segnaposto omesso; il bottone Stampa si sblocca solo dopo il normale preflight immagini.

## 2026-10-21 — v24.8.16 ripristino centralizzato immagini assenti nelle slide
- Screenshot utente: **Carroponte/Gru a cavalletto tutte tipologie comando 11h**, slide Spiegazione 2/3, illustrazione vuota e `immagine non disponibile`; lo stesso difetto su altre pagine.
- Diagnosi letta da Supabase: tra 661 versioni LU pubblicate, **170** usano `content.visual` come categoria non-file con nessun `idea_images`/visuals presente: `equipment-training` (100), `role-safety` (46), `first-aid` (20), `confined-space` (4). Il precedente `getTopicImage(t)` costruiva `assets/${t.visual}.svg`, file inesistenti. Distinti da 58 nomi di immagini esplicite presenti nei contenuti LU, tutti verificati contro l'inventario dei 201 asset reali.
- Nuovo `apps/training/visual-asset-guard-v32.js`: inventario *esplicito e verificato* dei 201 file SVG/PNG locali (da `image-library-v25.json`); `resolve(topic,course,slot)` preferisce le immagini authored se esistenti, altrimenti traduce le quattro categorie in figure locali appropriate, con selezione per famiglia (carroponte→baricentro, imbracatura, perimetro; carrelli, PLE, gru, MMT, vari).
- `app.js`: tutto il viewer (prima, seconda, terza figura, schede topic, card grafiche, approfondimenti, poster video) usa il resolver validato; nessun URL `assets/equipment-training.svg` viene più costruito dalla presentazione. `media-resilience-v3.js`: se una **immagine locale** fallisce davvero durante la presentazione, propone un `general.svg` etichettato come schema sostitutivo, senza nascondere il problema; **non** sostituisce immagini private o il percorso di stampa amministrativo, dove resta il preflight bloccante dei file mancanti.
- `index.html` include il resolver prima di `app.js`; `sw.js` cache `safety-training-v22-77`, precache script, e test regression `tests/visual-asset-guard-v32.test.mjs` con inventory, famiglie, fallback, protezione stampa. Nessun Supabase write, nessuna modifica ai corsi frozen, ai diritti o alle approvazioni.
- Test GitHub Actions e deploy Vercel da verificare al termine del rilascio. QA live browser autenticato resta opportuno (Carroponte 11h slide 4/64 + più corsi).

## 2026-10-21 — v24.8.16.1 aggiornamento verifica regressione
- Test storico `tests/admin-print-slides-v23.test.mjs` aggiornato: non ricerca più il precedente `const valid=arr.find` rimosso da `getTopicImage`, ma verifica il nuovo resolver `SAFETY_LOCAL_VISUALS_V32.resolve(t,c,slot)`. Primo ciclo CI fallito solo per asserzione obsoleta, senza evidenza di errore di runtime. Rilanciare CI completo prima di pubblicare.

## 2026-10-21 — v24.8.17 editor immagini per singola slide riservato all'account proprietario
- Richiesta esplicita: inserire/sostituire/riordinare/rimuovere immagini direttamente da una slide e usare stessa scelta nella stampa PDF, SOLO dall'account utente amministratore, non qualsiasi futuro admin.
- DB `supabase/migrations/20261021172500_v33_slide_image_owner_editor.sql` applicato: all'atto dell'installazione risultava **1 utente auth e 1 platform_admin**. `private.slide_image_editor_allowlist_v33` contiene solo quell'account: non si amplia automaticamente al nascere di nuovi admin. RPC `can_edit_slide_images_v33`, `save_slide_images_v33` controllano UID effettivo, allowlist, platform_admin, versione pubblicata più recente, stato non-frozen, percorso asset locale/privato approvato, max 3 immagini. Tabella `slide_image_overrides_v33` senza GRANT diretto API e RLS attiva; altre persone non possono modificare neppure chiamando endpoint a mano. `read_slide_images_v33` restituisce ai non editor solo override locali, mai identificativi PDF privati.
- Catalogo `slide_image_local_catalog_v33` con 201 asset locali verificati, selezione anche di sole tavole PDF con doppia revisione approvata e non escluse; URL firmati e temporanei senza pubblicazione ai corsisti.
- Nuovo `slide-image-editor-v33.js/css`: pulsante «✎ Modifica immagini» nelle slide per il solo account autorizzato; dialog con ricerca tra figure, aggiunta fino a 3, rimozione, ordine ↑↓, ripristino scelta automatica, salvataggio per corso + versione + UID slide. Il database è la fonte di verità; non si modificano le LU pubblicate.
- `app.js` richiama `visit` dopo render della slide; `admin-print-slides-v23.js` richiama `applyDeck` prima di stampare, riutilizzando gli override. Nuovo asset inventory export `visual-asset-guard-v32.js`, HTML e PWA cache `safety-training-v22-78`. Aggiunto test `tests/slide-image-owner-editor-v33.test.mjs`.
- AVVERTENZA: i viewer non-editor continuano a vedere la figura originale quando tutte le immagini modificate sono private; solo le sostituzioni locali sono visibili come override ai non editor. Nessun accesso alle licenze private per corsisti/docenti, 27 corsi frozen non modificati.
- La prova in browser autenticato e la verifica CI / Vercel vanno registrate dopo pubblicazione.

## 2026-10-21 — v24.8.17.1 test noneditor
- Primo run CI fallito per test che cercava la parola «noneditor» non più presente come commento nello script. Riallineata la verifica al controllo di accesso effettivo `if(!owner&&!out.length&&chosen.some(...))`. Runtime e database immutati.

## 2026-10-21 — v24.8.17.2 URL privati verificati in stampa
- L'editor tiene un insieme effimero di URL firmati realmente ottenuti da Supabase Storage dopo verifica di `technical_status='approved'` e `rights_status='cleared_internal'`; `admin-print-slides-v23.js` accetta quelle URL solo se riconosciute da `SAFETY_SLIDE_IMAGE_EDITOR_V33.isTrustedPrivateUrl`, e solo con sessione editor valida. L'insieme viene svuotato su cambio auth. Non è un bypass arbitrario del preflight PDF.

## 2026-10-21 — v24.8.17.3 fix salvataggio immagini UID con due punti
- Segnalazione Admin: «Salvataggio negato: Corso o identificativo slide non valido». Causa riprodotta sui corsi pubblicati: adattatore DB produce `course-module::unit:stable:key::1-explain-1`, ma la RPC v33 rifiutava `:` in `p_slide_uid`. Su 65 corsi attivi molti stable_key unità contengono `:` e sono corretti.
- Migrazione `supabase/migrations/20261021232000_v34_slide_uid_colons.sql` applicata: regex UID `^[A-Za-z0-9_:-]+$`, preservati prefisso del corso, 240 caratteri, singolo account Admin in allowlist, corso pubblicato non frozen, revisione doppia per PDF e asset locali autorizzati. SQL verificato `accepts_colons=true`; ancora 0 scelte salvate prima della prova reale.
- Test regressione nuovo per verificare identificativi reali e vincoli, guida aggiornata. Correzione server-side immediata, nessuna mutazione alle Learning Unit e ai corsi congelati.


## 2026-10-22 — v24.6 Panoramica, Controllo e Report operativi
- **Panoramica:** eliminata la collisione tra `admin.js` e `admin-backend-v21.js` che poteva sostituire la dashboard completa con un markup ridotto e rimuovere `#adminDashboardAnalytics`. Il backend ora aggiorna solo i contatori della struttura posseduta da `admin.js`; se la struttura non è pronta non la sovrascrive.
- **Grafici e KPI:** `admin-analytics-v40.js` resta l’unica sorgente della parte analitica e marca il pannello dopo il caricamento. Sono visibili iscrizioni attive, completati/superati, avanzamento medio, esiti test, inattivi oltre 30 giorni, distribuzione stati, andamento iscrizioni e corsi più frequentati.
- **Controllo operativo:** la voce Registro attività ora apre una vera area di controllo con KPI per corsisti da avviare, inattivi/da verificare, esiti non superati, completati/superati, priorità operative e gli ultimi 200 eventi di apprendimento.
- **Report formazione:** mantenuti filtri per corso/corsista/ricerca, esportazione CSV, stampa, analisi stati e dettaglio corsista. La precedente “Scheda di svolgimento interna” è resa più esplicita come **Attestazione interna di svolgimento**, con avviso permanente che NON è un attestato ufficiale né una certificazione di frequenza/idoneità.
- **Permessi:** nessun allargamento. Dashboard/report restano visibili solo secondo le capability admin esistenti `manage_enrollments` / `manage_learners`.
- **Regressioni:** aggiunto test che vieta a `admin-backend-v21.js` di riassegnare `host.innerHTML=dashboardMarkup(summary)`; testati il collegamento `adminControlAnalytics` e `renderControlSummary`. Rimossi dai test i vecchi numeri cache hardcoded; ora validano il formato della cache corrente.
- **CI:** `package.json` include ora anche `node --check apps/training/admin-backend-v21.js`.
- Nessuna modifica ai corsi frozen, Learning Unit, presenze, attestati ufficiali, RLS o contenuti didattici.

## 2026-10-22 — v43.1 collegamento operativo approvazione multipla
- Il precedente commit v43 conteneva RPC admin-only `training_bulk_review_integral_pdf_v43` e modulo JS ma **non ne caricava lo script né montava il pannello nella Gestione immagini**: funzionalità predisposta ma non raggiungibile dall'interfaccia. Collegati ora modulo JS, CSS e pannello di controllo `stBulkReviewWorkspace`.
- In **Amministrazione → Gestione immagini → Tavole PDF complete importate** appaiono caselle selezione, selezione pagina e selezione conservata passando pagina e filtri (max 100). Il pannello propone separatamente verifica tecnica o verifica tecnica + diritti interni, con motivazioni, spunte distinte e conferma finale. Non vengono prese decisioni tecniche o sui diritti automaticamente.
- La validazione determinante resta nella RPC v43 con controllo `private.is_platform_admin()`, divieto di rivedere giudizi già finali, fonte unica per approvazione dei diritti e audit esistente v25. Niente pubblicazione automatica nelle slide o ai corsisti.
- Caricati assets in `index.html` e PWA `safety-training-v43-bulk-review`; regressione nuova `tests/admin-image-bulk-review-v43.test.mjs` inclusa in `npm run check`. Nessuna mutazione dati/schema, corsi frozen invariati, `company_admin` ancora disabilitato. QA browser autenticato da eseguire separatamente.

### 2026-10-22 — v43.2 hardening integrazione
- `enrichPrivateRows` ora passa `source_document` e `source_page` alle checkbox del pannello di approvazione multipla: l'interfaccia può distinguere i PDF di origine e bloccare selezioni multi-documento per la revisione dei diritti; la RPC server mantiene la propria verifica separata e autoritativa.
- Sistemata regressione CI legacy nel test del pianificatore eliminazioni: ora cerca la vera azione `quick-delete-learner-v38` introdotta nella gestione corsisti al posto della precedente `review-delete-learner`; nessun cambiamento al comportamento di cancellazione. Nessun dato utente modificato, nessuna approvazione di immagini eseguita.
