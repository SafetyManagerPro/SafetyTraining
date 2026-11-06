# SafetyTraining — audit storico migrazioni Supabase (6 novembre 2026)

## Stato e vincoli
- Branch sorgente: `main` al commit `89bc1b048dae5e5290429760a054f00882700854`.
- Progetto: **SafetyTraining**, non SafetyManagerPro.
- **Nessuna modifica** ai dati storici, alle RLS, ai corsi, ai learner, alle funzioni, alle migrazioni già applicate o al database remoto.
- Questo è un audit di metadata in sola lettura. Lo snapshot non è un dump SQL, non include dati personali e non costituisce autorizzazione a un `db push`.

## Controllo dei version ID
- Migrazioni remote applicate: **188**.
- File SQL locali: **184**.
- Versioni presenti solo da remoto: **52**.
- Versioni presenti solo in GitHub: **48**.
- Corrispondenze nome probabili con contenuto di diversa dimensione (> 5 byte): **16**.
- Migrazioni remote senza file locale corrispondente: **2**.

Le stesse denominazioni **non garantiscono** che i contenuti SQL siano identici. Molte versioni nel repository hanno timestamp manuali diversi da quelli realmente registrati nel database. Alcune divergenze non sono cosmetiche: restaurare o rinominare ciecamente potrebbe alterare il replay o causare migrazioni duplicate.

### Migrazioni non trovate nel repository
- `20261019135645_v22_013_admin_deletion_read_only_preview.sql` (codice SQL presente solo nello storico remoto: 7934 byte)
- `20261020203108_v24_007_assisted_cleanup_audit.sql` (codice SQL presente solo nello storico remoto: 623 byte)

### Registrazioni ripetute nel database (nome identico)
- `20261017042346` — `v21_007_admin_requirement_evidence_service` (esiste una precedente registrazione con lo stesso nome)
- `20261020070604` — `v22_018_review_private_source_figures` (esiste una precedente registrazione con lo stesso nome)

### Corrispondenze da NON rinominare senza confronto SQL effettivo
| Versione remota | SQL remoto (byte) | File in repository (byte) |
|---|---:|---:|
| `20261014172843` v20_015_safetymanager_import_bridge | 17333 | 15836 |
| `20261014175935` v20_016_fix_safetymanager_import_validation | 13758 | 13864 |
| `20261014194616` v20_023_course_blueprints_and_content_profiles | 24783 | 24448 |
| `20261014200652` v20_024_complete_emergency_course_family | 17753 | 15692 |
| `20261014201746` v20_025_first_aid_learning_units | 16313 | 9818 |
| `20261014203308` v20_026_compose_first_aid_courses | 10548 | 10416 |
| `20261015170044` v20_041_dl_rspp_common_didactic_v2 | 22231 | 23830 |
| `20261015173713` v20_0439_rspp_aspp_catalog_registry | 2989 | 3208 |
| `20261015174100` v20_044_rspp_aspp_family_didactic_v2 | 26935 | 27989 |
| `20261015175301` v20_045_catalog_visibility_and_material_rpc | 3339 | 3821 |
| `20261015175352` v20_0451_catalog_rpc_security | 439 | 551 |
| `20261015191108` training_source_library_schema_v20_046 | 2154 | 11651 |
| `20261017150936` v21_023_preserve_current_company_training_history | 11323 | 10969 |
| `20261017160512` v21_024_fix_course_readiness_test_gate | 11013 | 10632 |
| `20261019142009` v22_015_revoke_direct_delete_client_roles | 2416 | 1361 |
| `20261019183150` v22_016_equipment_in_person_refresher_instructor_workshops | 9089 | 774 |

## Riproduzione dell'audit
```bash
node scripts/audit-supabase-migrations.mjs
node scripts/audit-supabase-migrations.mjs --strict
```
Il primo comando mostra il report e non modifica nulla. La modalità `--strict` segnala le differenze con un exit code non zero: **non collegarla alla CI prima della riconciliazione**, altrimenti bloccherebbe una CI oggi funzionante. L'audit non altera il comando `npm run check` né la workflow Action.

## Processo consigliato per una riconciliazione senza rischio per la produzione
1. Recuperare e confrontare **SQL esatto** e fingerprint di ciascuna migration remota con i file presenti nel repo; verificare che non vi siano dati o segreti prima di includere SQL in un repository pubblico.
2. Formare in un branch una sequenza storica riproducibile, includendo le versioni realmente applicate; trattare separatamente i due SQL mancanti e le esecuzioni ripetute.
3. Applicare la sequenza **solo a un database di test vuoto**, verificando replay, schemi, funzioni, grants, RLS e controlli di compatibilità dei corsisti interni.
4. Verificare che il diff tra lo schema riprodotto e quello di produzione sia intenzionalmente nullo (o motivare ogni differenza).
5. Approvare la PR solo dopo test CI e smoke test. **Non eseguire `db reset` o `db push` su produzione** e non riscrivere direttamente `supabase_migrations.schema_migrations` senza una verifica puntuale e un piano di rollback.

## Vincoli applicativi permanenti
- Corsisti e Corsisti interni separati, senza sincronizzazione obbligatoria.
- Importazione rapida v47.11 su richiesta, senza modificare i record sorgente né le assegnazioni già esistenti.
- Preservare dati storici, permessi e corsi frozen; mantenere indipendente SafetyManager Pro.
