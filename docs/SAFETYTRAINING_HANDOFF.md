# SafetyTraining — stato progetto / hand-off

Ultimo aggiornamento: 2026-10-17

Questo file è il riferimento persistente di SafetyTraining. Dopo OGNI modifica sostanziale aggiornare nello stesso blocco anche `docs/SAFETYTRAINING_HANDOFF_LATEST.md`.

## Vincoli permanenti
NON sviluppare/modernizzare/finalizzare/pubblicare salvo richiesta esplicita:
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

## Go-live didattico v20 — COMPLETATO
- 60 `course_versions`
- 59 corsi distinti
- 290 `learning_unit_versions`
- 60/60 composizioni complete e verification path
- 36 test attivi
- 1.450 domande authored
- 660 test-question links
- soglia 70%
- 37 percorsi con gate pratico
- 73 requirement rows

## Amministrazione v21 — LIVE fino a v21_024
Migration recenti:
- `20261017052016_v21_019_multichannel_learner_invites`
- `20261017052054_v21_020_company_bulk_and_registry_import`
- `20261017052210_v21_021_invite_public_claim_flow`
- `20261017052954_v21_022_qualify_invite_crypto_extensions`
- `20261017161000_v21_023_preserve_current_company_training_history`
- `20261017180000_v21_024_fix_course_readiness_test_gate`

Restano attive v21_001–018: service layer admin, guardrail/RLS, evidence, SafetyManager governance, detail, scoped admin, membership e dedupe CF/PIVA.

### Anti-doppioni
- P.IVA e CF azienda normalizzati e unique tenant-scoped.
- CF learner normalizzato e unique tenant-scoped.
- `admin_registry_conflict()` = preflight UI; DB/RPC resta source of truth.
- Non rendere mai CF/PIVA global unique tra tenant.

## Storico azienda learner — v21_023 LIVE
Regola definitiva:
- `learners.company_id` rappresenta l'azienda corrente;
- la company storica di un corso/enrollment vive in `learner_company_training_history`;
- un import SafetyManager storico non deve riassegnare la company corrente di un learner esistente.

Il wrapper `import_safetymanager_package(jsonb)` preserva current company, mantiene mapping/dedupe/idempotenza e registra la training company storica. Il legacy importer resta interno/non esposto. `admin_learner_company_history()` restituisce current company + storico con authorization scoped.

QA v21_023 già verde con learner Comune di San Martino Valle Caudina e progetto storico G. & G. Auto Service; rollback pulito.

## Dashboard amministrativa — stabilizzata v21.3
Problema precedente: `MutationObserver` globale in `admin-backend-v21.js` poteva generare refresh/RPC ricorsive mentre il DOM veniva aggiornato.

Fix permanente:
- nessun MutationObserver globale;
- refresh solo su eventi espliciti;
- `enhanceSeq` contro risposte stale;
- dashboard tramite `admin_dashboard_summary()`;
- activity audit solo nella tab relativa.
Non reintrodurre polling/osservatori DOM globali nell'admin.

## Admin UX v21.4 — LIVE
### Organizzazioni
- aggiunto `+ Nuova organizzazione` per platform admin;
- creazione/modifica tramite `admin_save_organization`;
- modifica mostra nome, codice, stato, ID, creazione/aggiornamento.

### Aziende
La schermata modifica visualizza tutti i campi della tabella corrente `companies`:
- organization, name, vat_number, fiscal_code, ateco_code, active;
- id, vat_number_normalized, fiscal_code_normalized, created_at, updated_at, metadata.
Normalizzati e metadata sono read-only per preservare dedupe e integrazione.

### Corsisti
La UI usa ora un solo campo `Cognome/Nome`, coerente con il `full_name` unico prodotto da SafetyManager.
- record legacy Nome + Cognome vengono riuniti in visualizzazione;
- `metadata.source_full_name` prevale se presente;
- salvataggio non distruttivo rispetto allo schema: valore completo in `first_name`, `last_name = null`;
- nessuna modifica al payload bridge v1.2.

### Edizioni
Aggiunto `Disattiva` con conferma. La disattivazione imposta `status='archived'` tramite `admin_update_edition` e NON cancella fisicamente: iscrizioni, progressi, audit e storico aziendale restano integri.

## Catalogo SafetyManager / Blueprint / Master Registry — semantica resa esplicita
Nuovo `admin-guidance-v21.js` porta spiegazioni contestuali dentro la console.

- Catalogo SafetyManager: catalogo/requisito amministrativo sorgente (codice, titolo, durata, vincoli), non materiale didattico.
- Percorso SafetyTraining: corso/versione didattica interna governata che può essere realmente erogata.
- Learning Unit preview: anteprima di composizione, non pubblicazione automatica. Per i lavoratori combina nucleo generale e rischi progetto/DVR senza riempire ore residue con contenuti non pertinenti.
- Master Registry: livello di governo/mapping fra codici SafetyManager, blueprint, variante e regole.
- Blueprint: modello riusabile di una famiglia di corsi.
- Varianti/regole: determinano la composizione in base a ruolo, rischio, durata, pratica e contesto.
- Libreria/profili contenuto: risorse riusabili; non diventano automaticamente corsi ufficiali né iscrizioni.
- Moduli: contenitori concreti e ordinati dentro una specifica versione corso; contengono le Learning Unit.
- Altri contenuti: DPI, fonti, checklist e materiali di supporto; non sostituiscono moduli, verifiche o requisiti.

### Perché `Parziale`
È uno stato del modello di composizione/Master Registry: il blueprint/mapping esiste ma non è ancora dichiarato completamente chiuso e riusabile per tutte le varianti. Una specifica versione corso può essere pubblicata anche se il modello generale resta `partial`.

### Perché `Ibrido parziale`
Tipico dei percorsi con una parte digitale e una componente pratica/presenza separata. Indica inoltre che il modello Master Registry non è ancora chiuso in ogni variante/regola. Non è un errore di caricamento.

## Readiness v21_024 — falso blocco test RISOLTO
Causa: `get_course_readiness()` usava il vecchio metadata `bank_required` come proxy dei test richiesti. I 36 test reali attivi non dipendono da quel flag, quindi molti corsi risultavano falsamente `missing_test_definition`.

Correzione live:
- un test richiesto è definito se esiste ed è attivo;
- banca valida se le domande attive collegate raggiungono almeno il minimo richiesto;
- `missing_test_definition` solo quando i test attivi sono realmente meno dei test richiesti;
- `platform_question_bank_incomplete` usa il numero reale di domande attive;
- nessun corso frozen viene auto-sbloccato.

Readiness verificata dopo fix:
- totale: 92
- pubblicati: 65
- pronti per revisione: 22
- da configurare: 2
- pubblicabili tecnicamente: 0
- bloccati: 3

I soli bloccati restano intenzionalmente frozen/fuori roadmap:
1. `amb_confinati` — Ambienti sospetti di inquinamento o confinati - 12h — `user_out_of_roadmap_specialist`;
2. `rspp_aspp_a` — RSPP/ASPP - Modulo A - 28h — `external_rspp_aspp`;
3. `rspp_aspp_b` — RSPP/ASPP - Modulo B comune - 48h — `external_rspp_aspp`.
Tutti hanno `missing_test_definition`, intenzionale finché restano fuori roadmap.

Semantica:
- `blocked`: hard blocker strutturale;
- `needs_configuration`: struttura presente, scelta/configurazione richiesta;
- `ready_for_review`: nessun hard blocker, restano revisione/validazioni/pratica;
- `ready_for_publish`: gate tecnici soddisfatti, pubblicazione comunque manuale;
- `published`: versione pubblicata, non certifica automaticamente eventuale pratica esterna del singolo learner.

## Responsive / device adaptation
Nuovo `admin-responsive-v21.css`, insieme a `responsive-v2.css` e `mobile-reader-v3.css`:
- elimina overflow strutturali delle pagine admin;
- tabelle admin/Blueprint/Readiness scrollabili orizzontalmente dentro il proprio contenitore;
- modali adattive e bottom-sheet mobile;
- form/toolbar/card/azioni responsive;
- modal composizione SafetyManager adattiva;
- guide 3 colonne desktop, 2 tablet, 1 mobile;
- safe-area e breakpoint 1100/860/560/390;
- il reader didattico usa layout nativo mobile/tablet invece di ridurre il canvas desktop.

Verifica eseguita: audit CSS/markup + asset production. NON è stato eseguito in questo blocco un browser visuale reale su tutti i viewport; resta un QA finale utile, non un problema backend.

## QA admin v21.4
Test transazionale + rollback:
- nuova organizzazione via RPC;
- nuova azienda con P.IVA/CF e normalizzazione verificata;
- learner con nome unico `ROSSI MARIO`, `last_name=null`;
- archiviazione edizione tramite `admin_update_edition` con assertion `archived`;
- rollback;
- residui QA: 0 organizzazioni, 0 aziende, 0 learner.

## Inviti corsisti multicanale — LIVE
Canali: email, WhatsApp, SMS, copia link, QR personale. Token raw solo all'emissione, SHA-256 nel DB, monouso, scadenza/revoca. Claim Auth + identity verification obbligatoria. Nessun DML browser diretto sulla tabella inviti.

## Bulk azienda / import — LIVE
- `admin_company_bulk_context(company_id)`;
- UI `Accessi & import`;
- bulk enrollment;
- preview import max 500 righe;
- `existing_other_company` richiede link esplicito nel flusso standard.

## SafetyManager → SafetyTraining bridge v1.2 — LIVE
Payload invariato. SafetyManager esporta azienda, progetto/corso, date/sede, rischi e iscritti, con `full_name` unico, senza documenti/firme/dati sanitari/credenziali. Mismatch current company/progetto resta warning storico, non blocco.

## Produzione SafetyTraining
PWA: `safety-training-v21-11`; JS/CSS/HTML network-first.

Commit funzionali del blocco v21.4/v21.024:
- `72d78d8ece8defde197bd552430bf98faa69a94b` — responsive admin;
- `f578a9781503771169aad3437c249dedc4fa77f7` — wiring UX/guidance/responsive;
- `1a20d513b7b3d1af5367d15bc5af2c27fffabe50` — PWA v21-11;
- `dda51b92ff7c06b5f60b6bf708f53a764b73410d` — readiness v21.024;
- `87c077aa2d11bd29ade8a79a091c267975606b76` — latest functional / fix edit organizzazione.

GitHub Actions:
- checks #292 SUCCESS;
- checks #293 SUCCESS.

Vercel latest functional:
- `dpl_8ardDTVN2hJ46Q2GEx9LNYzmT11V`;
- commit `87c077aa2d11bd29ade8a79a091c267975606b76`;
- production / READY;
- alias `safety-training-safety-manager.vercel.app`.

Smoke production HTTP 200:
- `/admin-ux-v21.js` v21.4;
- `/admin-guidance-v21.js` v21.4;
- `/admin-responsive-v21.css`;
- `/sw.js`, cache `safety-training-v21-11`, nuovi asset presenti.

## Advisor Supabase
Warning noti da non auto-fixare alla cieca:
- `learner_invite_public_info` anon SECURITY DEFINER intenzionale/minimizzato;
- RPC authenticated SECURITY DEFINER con authorization server-side;
- leaked password protection disabilitato.

## Prossimi passi esatti
1. Smoke visuale admin con browser reale su desktop/tablet/mobile.
2. E2E learner non-platform: invito → delivery → Auth → verifica identità → claim → dashboard.
3. Onboarding/invito `organization_admin|training_manager`.
4. `company_admin` resta disabilitato.
5. Aggiornare SEMPRE entrambi gli handoff.

## Servizi
- GitHub SafetyTraining: `SafetyManagerPro/SafetyTraining`
- Supabase: `ejkwvatmzdqqjozpxntk`
- Vercel SafetyTraining: `safety-training`
- produzione SafetyTraining: `safety-training-safety-manager.vercel.app`
- GitHub SafetyManager: `SafetyManagerPro/SafetyManager`
- produzione SafetyManager: `safety-manager-ultimate-safety-manager.vercel.app`
