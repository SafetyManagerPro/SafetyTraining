# SafetyTraining — Version history v20

Aggiornato: 15 ottobre 2026

Questa cronologia serve a orientare collaboratori e manutentori. La fonte canonica delle modifiche DB resta `supabase/migrations/`; qui si riassume lo scopo di ciascun blocco.

> Nota: l'ordine cronologico dei file è determinato dal timestamp nel filename. Il numero `v20_xxx` rappresenta l'evoluzione logica del progetto; alcune migrazioni (per esempio `v20_016`) sono state create cronologicamente dopo numeri superiori per correggere/integrare una fase precedente.

## Fondazioni v20

| Versione | Migration | Scopo principale |
|---|---|---|
| v20_001 | `20261013211736_v20_001_core_tenancy.sql` | fondazioni tenancy/core piattaforma |
| v20_002 | `20261013211755_v20_002_catalog.sql` | catalogo corsi e strutture collegate |
| v20_003 | `20261013211830_v20_003_delivery_tracking.sql` | erogazione e tracking attività |
| v20_004 | `20261013211854_v20_004_assessment_integration.sql` | integrazione assessment/test |
| v20_005 | `20261013211940_v20_005_private_rls_helpers.sql` | helper RLS e sicurezza privata |
| v20_006 | `20261013212757_v20_006_question_grading_risk_catalog.sql` | grading domande + catalogo rischi |
| v20_007 | `20261013212825_v20_007_content_import_metadata.sql` | metadata import contenuti |
| v20_008 | `20261013213356_v20_008_enable_temporary_http_import.sql` | supporto temporaneo import HTTP |
| v20_009 | `20261013214311_v20_009_remove_temporary_http_import.sql` | rimozione supporto temporaneo HTTP |
| v20_010 | `20261013214559_v20_010_enable_course_structure_import.sql` | import temporaneo struttura corsi |
| v20_011 | `20261013214631_v20_011_remove_course_structure_import.sql` | rimozione supporto import temporaneo |
| v20_012 | `20261013214714_v20_012_trusted_active_time.sql` | tempo attivo server-authoritative/trusted |
| v20_013 | `20261013220834_v20_013_admin_console_rls_fixes.sql` | fix RLS console admin |

## Onboarding, SafetyManager bridge e composizione

| Versione | Migration | Scopo principale |
|---|---|---|
| v20_014 | `20261014170308_v20_014_learner_onboarding_and_progress.sql` | onboarding corsista e avanzamento |
| v20_015 | `20261014172000_v20_015_safetymanager_import_bridge.sql` | bridge import con SafetyManager |
| v20_016 | `20261014195300_v20_016_fix_safetymanager_import_validation.sql` | correzione validazione import SafetyManager |
| v20_017 | `20261014181457_v20_017_safetymanager_course_catalog.sql` | catalogo corsi SafetyManager |
| v20_018 | `20261014182705_v20_018_seed_safetymanager_course_catalog.sql` | seed catalogo SafetyManager |
| v20_019 | `20261014183912_v20_019_worker_learning_unit_blueprints.sql` | blueprint LU lavoratori |
| v20_020 | `20261014185508_v20_020_risk_composition_engine.sql` | motore di composizione basato sui rischi |
| v20_021 | `20261014192009_v20_021_learning_unit_composition_v2.sql` | composizione LU v2 |
| v20_022 | `20261014192123_v20_022_prioritize_project_risks.sql` | priorità rischi di progetto |
| v20_023 | `20261014194000_v20_023_course_blueprints_and_content_profiles.sql` | blueprint corsi e profili contenuto |

## Prime famiglie didattiche e master registry

| Versione | Migration | Scopo principale |
|---|---|---|
| v20_024 | `20261014211500_v20_024_complete_emergency_course_family.sql` | completamento famiglia emergenze |
| v20_025 | `20261014221300_v20_025_first_aid_learning_units.sql` | LU primo soccorso |
| v20_026 | `20261014221500_v20_026_compose_first_aid_courses.sql` | composizione corsi primo soccorso |
| v20_027 | `20261014210826_v20_027_master_registry_variants_rules.sql` | master registry, varianti e regole |
| v20_028 | `20261014212656_v20_028_asr2025_role_registry_and_learning_units.sql` | ruoli ASR 2025 + LU |
| v20_029 | `20261014212847_v20_029_compose_asr2025_role_courses.sql` | composizione corsi ruolo ASR 2025 |
| v20_030 | `20261014213555_v20_030_confined_spaces_and_work_height.sql` | ambienti confinati e lavori in quota |
| v20_031 | `20261014214102_v20_031_equipment_asr2025_family.sql` | famiglia attrezzature ASR 2025 |
| v20_032 | `20261014214342_v20_032_worker_and_rls_updates.sql` | aggiornamenti lavoratori e RLS |
| v20_033 | `20261014214828_v20_033_course_readiness_gate.sql` | gate di readiness corso |
| v20_034 | `20261014215318_v20_034_test_registry_and_readiness.sql` | registro test e readiness |
| v20_035 | `20261014215527_v20_035_verification_path_selection.sql` | selezione percorso di verifica |

## Didattica approfondita v2

| Versione | Migration | Scopo principale |
|---|---|---|
| v20_036 | `20261015104014_v20_036_general_training_didactic_v2.sql` | formazione generale v2 |
| v20_037 | `20261015132808_v20_037_preposto_didactic_v2.sql` | preposto v2 |
| v20_038 | `20261015135338_v20_038_dirigente_didactic_v2.sql` | dirigente v2 |
| v20_039 | `20261015152657_v20_039_datore_lavoro_didactic_v2.sql` | datore di lavoro v2 |
| v20_040 | `20261015162550_v20_040_datore_lavoro_update_didactic_v2.sql` | aggiornamento datore di lavoro v2 |
| v20_041 | `20261015170000_v20_041_dl_rspp_common_didactic_v2.sql` | DL-RSPP modulo comune v2 |
| v20_042 | `20261015173000_v20_042_dl_rspp_sector_didactic_v2.sql` | moduli settoriali DL-RSPP v2 |
| v20_043 | `20261015180000_v20_043_dl_rspp_update_didactic_v2.sql` | aggiornamento DL-RSPP v2 |
| v20_0439 | `20261015182500_v20_0439_rspp_aspp_catalog_registry.sql` | registrazione catalogo famiglia RSPP/ASPP |
| v20_044 | `20261015183000_v20_044_rspp_aspp_family_didactic_v2.sql` | famiglia didattica RSPP/ASPP v2 |

## Catalogo completo, PWA e provenance

| Versione | Migration | Scopo principale |
|---|---|---|
| v20_045 | `20261015190000_v20_045_catalog_visibility_and_material_rpc.sql` | RPC catalogo/materiale + visibilità completa |
| v20_0451 | `20261015190500_v20_0451_catalog_rpc_security.sql` | hardening sicurezza RPC catalogo |
| v20_046 | `20261015211500_v20_046_training_source_library.sql` | Source Library e provenance fonte -> Learning Unit |

## Stato applicativo associato alla fase v20_045/v20_046

In parallelo alle migration sono stati introdotti o consolidati:

- catalog browser DB-backed;
- Home v3;
- route libreria per stable key;
- editor admin corso migliorato;
- responsive/mobile navigation;
- manifest PWA e icone PNG reali;
- service worker aggiornato;
- Source Library con 9 fonti iniziali e mapping LU.

Baseline commit prima dei commit documentali: `06c6c10767971f302760da60d490425ffe291dc3` (`Add training source library and LU provenance mapping`). Il workflow `SafetyTraining checks` #102 su questo commit è terminato con `success`.

## Contenuti presenti nel database live ma ancora da trasformare in migration dedicate

Questa è la parte più importante da non perdere nella progressione versioni. Dopo `v20_0451` sono stati creati direttamente nel database live diversi blocchi didattici. La Source Library `v20_046` è già versionata, ma i seguenti contenuti richiedono ancora migration idempotenti nel repository:

### Completamento dei 22 corsi precedentemente vuoti

- 13 aggiornamenti attrezzature da 4h;
- `agg_lav`;
- `agg_prep`;
- `agg_dir`;
- `agg_rls_4h`;
- `agg_rls_8h`;
- `agg_primo_soccorso_4h`;
- `agg_primo_soccorso_a_6h`;
- `agg_spazi_confinati_4h`;
- `lav_quota`.

### Nuove famiglie

- CSP/CSE 120h + aggiornamento 40h;
- antincendio L1/L3 + aggiornamenti L1/L2/L3;
- ponteggi 28h + aggiornamento 4h;
- lavori su funi siti/alberi + aggiornamenti + preposto;
- segnaletica stradale lavoratore/preposto/integrazione + aggiornamenti.

### Integrazioni evidence-based

Aggiunte direttamente a Supabase, da rendere riproducibili:

- VVF su antincendio;
- INAIL Quaderni cantieri su ponteggi/CSP;
- Infor.MO Scheda 21 su carrelli;
- Infor.MO Scheda 11 su ambienti confinati;
- case method e provenance collegata.

## Regola per le prossime versioni

1. controllare la migration più recente in repository;
2. scegliere il prossimo identificatore disponibile;
3. usare timestamp reale crescente;
4. rendere i seed idempotenti (`ON CONFLICT`, lookup per stable key, niente UUID hardcoded generati altrove);
5. preservare il riuso delle LU condivise;
6. applicare/validare in Supabase;
7. eseguire advisor se si tocca schema/RLS;
8. committare la stessa migration in GitHub;
9. verificare CI;
10. aggiornare questo file quando il blocco è stabile.

## Versione logica corrente

**v20_046** è l'ultima migration formalmente versionata al 15/10/2026.

I commit di sola documentazione che seguono non cambiano automaticamente il numero di schema/contenuto `v20_xxx`.
