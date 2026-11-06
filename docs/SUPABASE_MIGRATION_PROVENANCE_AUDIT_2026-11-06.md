# SafetyTraining — audit origine incongruenze migrazioni (6 novembre 2026)

## Domanda: Claude ha causato le differenze?

Non risulta **evidenza verificabile** che le difformità siano state introdotte da commit attribuiti all'account GitHub `claude`.

- GitHub restituisce 185 commit su `supabase/migrations` fino al 6 novembre 2026: **185 attribuiti a `SafetyManagerPro`**, **zero a `claude`**.
- Sono presenti quattro commit firmati `Claude`, tutti il **6 novembre 2026**, su test, stile e automazione CI; nessuno modifica file SQL.
- In Supabase `supabase_migrations.schema_migrations.created_by` è lo stesso account per tutte le 188 registrazioni: identifica l'account con cui è stata fatta l'operazione, non il modello o lo strumento utilizzato. Qualunque agente che usi quelle credenziali può risultare associato a tale account.

**Limite di attribuzione:** Claude potrebbe avere operato tramite le credenziali/account di SafetyManagerPro; né l'autore Git né `created_by` dimostrano chi abbia materialmente generato il SQL.

## Analisi temporale delle 132 differenze

Differenze tra la dimensione in byte del SQL su GitHub e quella della stringa `statements` archiviata su Supabase (snapshots 6 novembre):

| Versione datata | Differenze |
|---|---:|
| 13 ottobre | 11 |
| 14 ottobre | 19 |
| 15 ottobre | 37 |
| 16 ottobre | 34 |
| 17 ottobre | 20 |
| 18 ottobre | 3 |
| 19 ottobre | 4 |
| 20 ottobre | 1 |
| 23 ottobre | 3 |
| **Totale** | **132** |

Tutte le anomalie di contenuto riguardano **migrazioni con timestamp compresi fra il 13 e il 23 ottobre**, prima dei commit che GitHub attribuisce esplicitamente a Claude.

### Cause concrete individuate

1. **Note amministrative / migration repair:** 12 registrazioni del 15 ottobre, incluse `v20_047` e `v20_067`, contengono soltanto una nota come `-- repaired as applied`, `-- equivalent live state verified ... rollback` o similare, mentre i file sorgente contengono decine di migliaia di byte SQL. Questa è una differenza di **registrazione storica**, non una prova di errore dello schema.
2. **Correzione successiva alla registrazione:** GitHub commit `c048dfb1c3e1b93a61b8a30c02c96fb15b17be72`, 16 ottobre 04:14 UTC, titolo `Fix v20.067 medium/high worker enrichment migration`, modifica effettivamente il file `20261015211000_v20_067_worker_specific_medium_high_enrichment.sql` (144 righe aggiunte, 52 eliminate). È coerente con una riscrittura del sorgente dopo la versione storica del 15 ottobre.
3. **Differenze di formattazione:** per `v20_015_safetymanager_import_bridge` la rimozione di commenti e la normalizzazione degli spazi producono lo stesso testo SQL; in `v21_014_allow_rls_training_scope_helper` differisce il solo newline finale. Pertanto il contatore `132` è troppo grossolano per misurare un vero drift dello schema.
4. **Codice applicato recentemente coerente:** `v47_11_fast_copy_regular_learners` coincide byte-per-byte con il file sorgente.

**Non si può inferire dalla cronologia che esistano 132 differenze nelle tabelle applicative.** Un confronto schema-first su un database di test resta necessario per misurare le eventuali difformità funzionali.

## Prevenzione attiva — Git source lock

La CI precedentemente controllava gli ID e i nomi delle 188 migrazioni, ma non il SQL. Per proteggere lo storico è ora presente `docs/SUPABASE_MIGRATION_SOURCE_LOCK_2026-11-06.json`: contiene 188 impronte Git blob SHA1 dei file sorgenti **esattamente come sono sul repository dopo la riconciliazione**.

`node scripts/audit-supabase-migrations.mjs --strict` controlla:
- presenza e correttezza di versione e nome;
- integrità dei byte per ciascuna delle 188 migrazioni già applicate;
- identificativi duplicati o obsoleti;
- migrazioni nuove successive allo snapshot come `PENDING` (senza applicarle).

I test unitari verificano che il cambiamento di un solo byte in uno script storico sia riconosciuto come modifica.

### Procedura comune a Claude, ChatGPT e interventi manuali

1. Non modificare file SQL di migrazioni applicate. Una correzione dello schema deve avere **una nuova migrazione**.
2. Creare migrazioni nuove con nome/versione progressivi, in un PR, e fare review del contenuto.
3. Prima di applicare SQL alla produzione: verificare `migration list`, eseguire `db push --dry-run`, valutare il diff su un database isolato e ottenere autorizzazione specifica; **non usare `migration repair` per eludere la revisione**.
4. Dopo l'applicazione verificata, aggiornare snapshot versioni e source-lock con un PR separato, verificando ogni nuovo SQL; non riscrivere retroattivamente le 188 impronte o lo storico remoto.
5. Registrare nel PR, quando noto, lo strumento usato per sviluppare (ChatGPT / Claude / manuale) come informazione di processo. Non usare il nome del committer per dedurre automaticamente lo strumento.

**Questo audit non ha modificato alcun database, corso, utente, permesso o dato storico Supabase.** Il source-lock protegge il repository da modifiche accidentali, ma un PR che cambi contemporaneamente SQL e lock richiede review: nessuna CI locale può garantire da sola che l'autore non abbia alterato entrambi.

Riferimenti: [commit di correzione v20.067](https://github.com/SafetyManagerPro/SafetyTraining/commit/c048dfb1c3e1b93a61b8a30c02c96fb15b17be72) e [precedente riconciliazione PR #57](https://github.com/SafetyManagerPro/SafetyTraining/pull/57).
