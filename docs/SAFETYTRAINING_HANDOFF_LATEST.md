# SafetyTraining — handoff LATEST

Ultimo aggiornamento: 2026-10-17
Stato: backend LIVE fino a `v21_024`; amministrazione UX/list tools `v21.5`; PWA `safety-training-v21-12`; readiness corretta; storico azienda learner v21_023 preservato.

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
Go-live completato: 60 versioni / 59 corsi / 290 LU / 36 test / 1.450 domande / 660 link domanda-test / 37 gate pratici / 73 requirement rows.

## Admin UX v21.5 — ricerca, filtri, ordinamento
Nuovo layer client-side `admin-list-tools-v21.js` + `admin-list-tools-v21.css`.

Funzioni comuni:
- ricerca nella vista dove non era già presente;
- filtri contestuali ricavati dai valori reali mostrati;
- ordinamento per colonne significative;
- inversione crescente/decrescente;
- reset completo;
- contatore `visibili di totale`;
- stato filtri mantenuto durante la sessione per singola vista;
- nelle viste multi-card, le sezioni senza risultati vengono nascoste senza alterare i dati.

Copertura:
- Organizzazioni: stato; ordine nome/codice/stato;
- Aziende: stato/organizzazione; ordine azienda/organizzazione/P.IVA/ATECO/stato;
- Corsisti: accesso/stato; ordine corsista/azienda/organizzazione/mansione/stato;
- Corsi: famiglia/governance/stato; ordine corso/famiglia/durata/versione/stato;
- Edizioni: stato/azienda; ordine edizione/corso/azienda/stato/disponibilità;
- Iscrizioni: stato; ordine corsista/percorso/stato/progresso/ultima attività;
- Catalogo SafetyManager: ricerca + stato + ordine corso/codice/durata/stato;
- Blueprint/Master Registry: ricerca + sviluppo + ordine corso/blueprint-regola/profilo;
- Readiness: ricerca + stato + ordine corso/stato/struttura.

Il layer riusa le ricerche amministrative già esistenti dove presenti e NON introduce un MutationObserver globale o polling DOM. Gli enhancement sono richiamati solo da eventi espliciti e retry temporizzati limitati dopo rendering.

## Responsive v21.5
`admin-list-tools-v21.css` si integra con `admin-responsive-v21.css`:
- toolbar flessibile desktop;
- stacking a tablet (`<=860px`);
- layout a griglia e controlli touch >=42px su mobile (`<=560px`);
- tabelle restano scrollabili nel proprio wrapper;
- modali/form/card/guide mantengono i breakpoint 1100/860/560/390 già introdotti in v21.4.

## Smoke eseguito
### CI / produzione
- commit funzionale: `bcfa4c565f0c595da6920a0e170ec69af801ccf3` — `Add admin list filters and responsive controls v21.5`;
- GitHub Actions `SafetyTraining checks` #296, run `39049749400`: SUCCESS;
- Vercel production `dpl_8AzDcSTka84DrZyFkA2YUedd5XwH`: READY;
- alias produzione: `safety-training-safety-manager.vercel.app`.

### Smoke live HTTP
Verificati in produzione con HTTP 200:
- `/index.html` include `admin-list-tools-v21.css` e `admin-list-tools-v21.js`;
- `/admin-list-tools-v21.js` = v21.5;
- `/admin-list-tools-v21.css` = v21.5 responsive;
- `/sw.js` = cache `safety-training-v21-12` e app shell aggiornato.

### Smoke strutturale UI
Audit di titoli/header/configurazioni effettuato su:
- core admin;
- Catalogo SafetyManager;
- Blueprint/Master Registry;
- Readiness;
- responsive admin.
Le intestazioni usate da filtri/ordinamento corrispondono alle tabelle renderizzate; nessun mismatch evidente rilevato.

Limite esplicito: in questa chat non è disponibile un browser interattivo con cui eseguire click e screenshot reali a 1440/820/390. Quindi è completato lo smoke strutturale + produzione HTTP, NON va dichiarato completato il visual smoke reale multi-viewport.

## Admin UX v21.4 ancora vigente
- Organizzazioni: `+ Nuova organizzazione`, modifica completa via `admin_save_organization`.
- Aziende: modifica mostra tutti i campi correnti; normalizzati e metadata read-only.
- Corsisti: campo unico `Cognome/Nome`, compatibile con SafetyManager `full_name`; legacy riunito; salvataggio in `first_name` con `last_name=null`.
- Edizioni: `Disattiva` archivia (`status='archived'`) senza cancellare iscrizioni, progressi, audit o storico.
- Guide contestuali per Catalogo SafetyManager, Blueprint/Master Registry e Readiness.

## Readiness v21_024
Fix permanente: readiness usa test attivi + domande attive collegate, non il vecchio flag `bank_required`.

Stato verificato:
- totale 92
- published 65
- ready_for_review 22
- needs_configuration 2
- ready_for_publish 0
- blocked 3

I 3 blocked sono intenzionalmente frozen:
- `amb_confinati` — `user_out_of_roadmap_specialist`;
- `rspp_aspp_a` — `external_rspp_aspp`;
- `rspp_aspp_b` — `external_rspp_aspp`.
Non sbloccarli per azzerare il contatore.

## Storico azienda learner — v21_023
Regola definitiva:
- `learners.company_id` = azienda corrente;
- azienda storica corso/iscrizione = `learner_company_training_history`;
- import SafetyManager storico non deve riassegnare la company corrente.

## Sicurezza / regole da non perdere
- CF/PIVA unique solo tenant-scoped;
- non divulgare duplicate identity cross-tenant;
- service_role solo server-side;
- authorization mai da user_metadata;
- no password via WhatsApp/SMS;
- raw invitation token mai persistito o loggato;
- identity verification obbligatoria nel claim;
- preservare i fix RLS anti-recursion;
- nessuna pubblicazione automatica di corsi/LU;
- non reintrodurre MutationObserver/polling globale nell'admin;
- `company_admin` resta disabilitato;
- SafetyManager bridge v1.2 invariato.

## Prossimo passo esatto
1. Visual browser smoke reale con sessione admin a circa 1440 / 820 / 390 px su Dashboard, Organizzazioni, Aziende, Corsisti, Edizioni, Catalogo SafetyManager, Blueprint, Readiness e reader didattico.
2. Correggere eventuali difetti visuali/interaction emersi e ripetere lo smoke.
3. E2E learner non-platform: invito personale → delivery → Auth → identity verify → claim → dashboard → replay rejected → cleanup.
4. Onboarding scoped admin `organization_admin|training_manager`.

## Produzione corrente
- GitHub: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel project: `prj_u0IT97WJ3ARGJJUhuYUWA6MyS24U`
- latest functional: `bcfa4c565f0c595da6920a0e170ec69af801ccf3`
- production deployment: `dpl_8AzDcSTka84DrZyFkA2YUedd5XwH`
- production alias: `safety-training-safety-manager.vercel.app`
