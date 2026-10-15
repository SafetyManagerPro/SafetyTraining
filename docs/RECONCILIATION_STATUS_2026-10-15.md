# SafetyTraining — stato riconciliazione DB → GitHub

Aggiornato: 15 ottobre 2026

Questo documento integra `START_HERE_COLLABORATORS.md` e `VERSION_HISTORY_V20.md` durante il riallineamento dei contenuti creati direttamente nel database Supabase. Finché il riallineamento non è concluso, usare questo file per distinguere ciò che è già riproducibile dal repository da ciò che esiste ancora soltanto nel database live.

## Menu laterale corsi — implementato e live

La navigazione del catalogo non è più un elenco piatto. È stato introdotto un menu laterale a sezioni espandibili/collassabili, basato sul catalogo completo restituito da `training_catalog_summary()` per utenti autenticati non learner.

Categorie correnti:

1. Lavoratori e aggiornamenti
2. Preposti e Dirigenti
3. Datori di lavoro e DL-RSPP
4. RSPP e ASPP
5. RLS e rappresentanza
6. Primo soccorso
7. Antincendio
8. Attrezzature di lavoro
9. Cantieri, CSP/CSE e Ponteggi
10. Lavori in quota e su funi
11. Spazi confinati
12. Segnaletica stradale e traffico
13. Rischi specialistici e altri percorsi

File principali:
- `apps/training/sidebar-course-groups.js`
- `apps/training/sidebar-course-groups.css`
- `apps/training/index.html`
- `apps/training/sw.js`

Comportamento:
- stato aperto/chiuso persistito in `localStorage`;
- corso corrente apre automaticamente la propria famiglia;
- corsi iniziali ordinati prima degli aggiornamenti;
- badge `AGG.` sugli aggiornamenti;
- conteggio corsi per famiglia;
- fallback su `SAFETY_DATA` mentre il catalogo DB non è disponibile;
- route `#course/<key>` per i corsi locali e `#library/<stable_key>` per quelli DB-only;
- compatibile con il menu mobile off-canvas esistente.

Il deploy di produzione che ha introdotto il menu è risultato `READY` ed è stato associato agli alias principali `safety-training-safety-manager.vercel.app` e `training-six-livid.vercel.app`.

## Drift originario misurato

Il blocco di materiale creato direttamente nel DB e non ancora completamente rappresentato da migration dedicate comprendeva:

| source_group | Learning Unit | corsi collegati |
|---|---:|---:|
| `SafetyTraining completion-v2` | 51 | 22 |
| `SafetyTraining csp-cse-v2` | 30 | 1 |
| `SafetyTraining csp-cse-update-v2` | 10 | 1 |
| `SafetyTraining fire-v2` | 14 | 5 |
| `SafetyTraining ponteggi-v2` | 16 | 2 |
| `SafetyTraining funi-v2` | 20 | 6 |
| `SafetyTraining road-sign-v2` | 10 | 5 |
| **Totale** | **151** | **42** |

## Reconciliation migrations create in GitHub

### v20.047 — aggiornamenti attrezzature

File:
`supabase/migrations/20261015214500_v20_047_completion_equipment_updates.sql`

Copre i 13 corsi:
- `agg_attr_cmm_4h`
- `agg_attr_carrelli_all_4h`
- `agg_attr_carrelli_ind_4h`
- `agg_attr_carroponte_all_11h_4h`
- `agg_attr_carroponte_10h_4h`
- `agg_attr_gru_torre_4h`
- `agg_attr_gru_autocarro_4h`
- `agg_attr_crf_4h`
- `agg_attr_mmt_all_4h`
- `agg_attr_mmt_esc_4h`
- `agg_attr_ple_4h`
- `agg_attr_pompe_4h`
- `agg_attr_trattori_4h`

Caratteristiche:
- lookup tramite stable key, nessun UUID generato altrove;
- upsert idempotenti;
- LU e course version restano `draft`;
- `learner_catalog_hidden=true`;
- materiale pratico completo 240 min per corso;
- delivery constraints conservati come metadata;
- integrazione INAIL Infor.MO per i carrelli;
- test transazionale rappresentativo eseguito con `BEGIN ... ROLLBACK` e superato dopo la correzione dello schema `course_modules`.

Commit stabilizzato:
`3911983f3dc0d9868564d5fd9098fc0fbbb4fcfd`

GitHub Actions run #115: `success`.

### v20.048 — aggiornamenti Lavoratori / Preposti / Dirigenti

File:
`supabase/migrations/20261015220000_v20_048_completion_role_updates.sql`

Copre:
- `agg_lav` — 4 LU x 90 min = 360 min;
- `agg_prep` — 4 LU x 90 min = 360 min;
- `agg_dir` — 4 LU x 90 min = 360 min.

La migration conserva:
- casi e scenari del DB live;
- procedure operative;
- errori comuni;
- riferimenti normativi;
- attività guidate;
- modalità di erogazione come metadata;
- draft/hidden;
- Test Builder finale sospeso;
- verifica finale dei corsi di ruolo distinta dal materiale LU.

È stato eseguito un test transazionale rappresentativo contro lo schema live, con rollback: superato.

### v20.049 — aggiornamenti RLS 4h / 8h

File:
`supabase/migrations/20261015222000_v20_049_completion_rls_updates.sql`

Modello di riuso:
- il 4h usa quattro LU comuni;
- l'8h riusa le stesse quattro LU come modulo `agg-rls-core`;
- il percorso 8h aggiunge quattro LU nel modulo `agg-rls-extra`;
- nessuna duplicazione del nucleo comune.

Corsi:
- `agg_rls_4h`
- `agg_rls_8h`

La durata è modellata secondo art. 37, comma 11, mantenendo la necessità di verificare la contrattazione collettiva applicabile.

Il pattern shared-core + modulo extra è stato verificato con transazione di prova e rollback: superato.

## Stato importante: GitHub migration != Supabase migration history

Al momento della redazione di questo file:

- `v20.047`, `v20.048` e `v20.049` sono **presenti nel repository e testate strutturalmente**;
- la migration history formalmente registrata in Supabase risultava ancora ferma a `v20.046`;
- non dichiarare quindi queste migration come formalmente applicate finché non vengono eseguite/registrate con il flusso Supabase previsto;
- il DB live contiene già i contenuti funzionali corrispondenti perché erano stati creati precedentemente direttamente nel database.

La riconciliazione serve quindi a rendere quel live state riproducibile, non ad aggiungere per la prima volta quei corsi.

## Drift `completion-v2` ancora da versionare dopo v20.047-v20.049

Restano da riconciliare nel gruppo `SafetyTraining completion-v2`:

### Primo soccorso
- `agg_primo_soccorso_4h`
- `agg_primo_soccorso_a_6h`
- 6 LU complessive, con riuso delle 4 comuni.

### Spazi confinati
- `agg_spazi_confinati_4h`
- 4 LU.

### Lavori in quota
- `lav_quota`
- 8 LU;
- 8h = allocazione didattica interna SafetyTraining, non dichiarazione di minimo legale universale ex art. 77.

Dopo questo blocco resteranno le nuove famiglie:
- CSP/CSE;
- antincendio;
- ponteggi;
- lavori su funi;
- segnaletica stradale.

## Sequenza raccomandata

1. completare `completion-v2` con primo soccorso + confinati + quota;
2. riconciliare CSP/CSE;
3. riconciliare antincendio;
4. riconciliare ponteggi + funi preservando le LU condivise;
5. riconciliare segnaletica stradale;
6. rieseguire conteggio drift per `source_group`;
7. applicare/registrare le migration in ordine su Supabase dopo controllo finale;
8. eseguire security/performance advisors se viene toccato lo schema/RLS;
9. verificare CI e produzione;
10. aggiornare `VERSION_HISTORY_V20.md` e `START_HERE_COLLABORATORS.md` come documenti canonici, poi archiviare questo status come snapshot storico.
