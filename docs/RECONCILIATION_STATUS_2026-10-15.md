# SafetyTraining — riconciliazione DB live → GitHub

Aggiornato: 15 ottobre 2026

## Esito

La riconciliazione dei contenuti didattici creati direttamente nel database live è **completata** per tutte le famiglie note emerse dall’audit post `v20.046`.

Stato verificato al termine del lavoro:

- **92 corsi attivi**;
- **92 corsi attivi con materiale**;
- **0 corsi attivi senza materiale**;
- **42 corsi riconciliati** rispetto al drift post-`v20.046`;
- tutti i 42 corsi riconciliati hanno ultima versione `draft`;
- tutti i 42 corsi riconciliati hanno `learner_catalog_hidden=true`;
- tutti i 42 corsi riconciliati hanno `material_complete=true`;
- Test Builder / banca domande finale resta sospeso, come da decisione di progetto.

La modalità legale di erogazione resta modellata come regola/metadata e non riduce il materiale didattico disponibile.

## Learning Unit riconciliate

Conteggio live finale per i source group interessati:

| source_group | Learning Unit |
|---|---:|
| `SafetyTraining completion-v2` | 51 |
| `SafetyTraining csp-cse-v2` | 30 |
| `SafetyTraining csp-cse-update-v2` | 10 |
| `SafetyTraining fire-v2` | 17 |
| `SafetyTraining ponteggi-v2` | 16 |
| `SafetyTraining funi-v2` | 22 |
| `SafetyTraining road-sign-v2` | 15 |
| **Totale** | **161** |

Il precedente conteggio intermedio di 151 LU era sottostimato: la verifica finale sul database live ha corretto i conteggi di antincendio, funi e segnaletica stradale.

## Migration di riconciliazione

Tutte le seguenti migration sono presenti nel repository, costruite con lookup per `stable_key`, senza UUID hardcoded e con operazioni idempotenti (`ON CONFLICT` / update deterministici):

| Versione | File | Contenuto principale |
|---|---|---|
| v20.047 | `20261015214500_v20_047_completion_equipment_updates.sql` | 13 aggiornamenti attrezzature |
| v20.048 | `20261015220000_v20_048_completion_role_updates.sql` | aggiornamenti lavoratori, preposti, dirigenti |
| v20.049 | `20261015222000_v20_049_completion_rls_updates.sql` | RLS 4h/8h con riuso LU comuni |
| v20.050a | `20261015224000_v20_050a_completion_first_aid_updates.sql` | primo soccorso 4h/6h con riuso 4 LU comuni |
| v20.050b | `20261015224500_v20_050b_completion_confined_update.sql` | aggiornamento spazi confinati + Infor.MO |
| v20.050c | `20261015225000_v20_050c_completion_work_height.sql` | lavori in quota / DPI III; 8h interne non minimo legale universale |
| v20.051 | `20261015230000_v20_051_csp_cse_reconciliation.sql` | CSP/CSE 120h + aggiornamento 40h |
| v20.052 | `20261015232000_v20_052_fire_family_reconciliation.sql` | antincendio L1/L3 + aggiornamenti L1/L2/L3 |
| v20.053a | `20261015234000_v20_053a_ponteggi_reconciliation.sql` | ponteggi 28h + aggiornamento 4h |
| v20.053b | `20261015235000_v20_053b_funi_reconciliation.sql` | funi A/B, aggiornamenti, preposto e aggiornamento |
| v20.054 | `20261015235900_v20_054_road_sign_reconciliation.sql` | segnaletica stradale lavoratori/preposti/integrazione/aggiornamenti |

## Migration history Supabase

La migration history formale Supabase è stata riallineata agli stessi timestamp e nomi fino a:

`20261015235900 — v20_054_road_sign_reconciliation`

Le migration 047–054 rappresentano contenuti che **esistevano già nel live** prima della loro formalizzazione nel repository. Per questo il flusso adottato è stato di reconciliation/repair:

1. estrazione dello stato live tramite stable key;
2. costruzione della migration idempotente;
3. esecuzione transazionale completa o rappresentativa con `BEGIN ... ROLLBACK` per validare SQL, vincoli e composizione senza alterare lo stato corretto;
4. registrazione della versione nella `supabase_migrations.schema_migrations` solo dopo la verifica di equivalenza.

Non è stato effettuato un replay cieco che duplicasse o sostituisse dati già corretti.

## Requisiti preservati

La riconciliazione mantiene:

- versioni nuove/revisionate in `draft` e learner hidden;
- riuso delle Learning Unit condivise;
- separazione fra durata normativa e allocazione didattica interna;
- pratica/addestramento come requisito reale quando previsto;
- verifica finale separata dal materiale didattico quando il live la modella così;
- Test Builder finale sospeso;
- provenance e `source_audit` già presenti nel live;
- evidence-based cases Infor.MO;
- riferimenti VVF per antincendio;
- INAIL Quaderni per cantieri/ponteggi/CSP;
- cross-check Regione Piemonte post ASR 2025;
- nessuna copia diretta di materiale privo di licenza aperta verificata.

## Riuso strutturale preservato

Esempi verificati:

- primo soccorso Gruppo A 6h riusa le 4 LU comuni del 4h e aggiunge 2 LU;
- RLS 8h riusa il nucleo delle 4 LU del percorso 4h;
- `funi_siti_32h` e `funi_alberi_32h` condividono realmente il modulo base `rope-base`;
- CSP/CSE è separato in moduli giuridico, tecnico, metodologico-organizzativo e pratico;
- `lav_quota` conserva 8h come configurazione interna/legacy e `statutory_total_duration_claim=false`.

## Menu laterale

Resta operativo il menu laterale a categorie espandibili/collassabili, alimentato dal catalogo DB completo. Le famiglie correnti sono:

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

File principali: `apps/training/sidebar-course-groups.js` e `apps/training/sidebar-course-groups.css`.

## Stato finale del drift

Per le famiglie/source group sopra elencati, **non resta alcun drift didattico live-only noto** dopo `v20.054`.

Le future modifiche ai corsi devono essere introdotte prima tramite migration/versionamento nel repository, evitando di ricreare divergenze strutturali tra Supabase live e GitHub.
