# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-18
Stato: **v22 didactic quality / Practice Lab LIVE** sui 65 corsi non congelati; backend admin v21 invariato e preservato; PWA `safety-training-v22-02`.

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
