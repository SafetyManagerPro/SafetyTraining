# SafetyTraining — riconciliazione storico migrazioni (6 novembre 2026)

## Esito

**Allineamento degli identificativi completato sul branch di audit** `audit/supabase-history-v47-20261106`.

| Verifica | Prima | Dopo sul branch |
|---|---:|---:|
| Versioni registrate in Supabase | 188 | 188 (nessuna scrittura) |
| File SQL in GitHub | 184 | 188 |
| Versioni remote prive del corrispondente file SQL | 52 | 0 |
| Versioni GitHub non registrate su Supabase | 48 | 0 |
| File con nome/timestamp non corrispondente | numerosi | 0 |

### Modifiche effettuate

- **48 file SQL storici** spostati al vero timestamp/version ID registrato da Supabase; i contenuti sono stati preservati esattamente, riutilizzando lo SHA del blob Git originale.
- **Due script mancanti** ricostruiti dal testo registrato nello storico remoto:
  - `20261019135645_v22_013_admin_deletion_read_only_preview.sql` — anteprima eliminazione in sola lettura;
  - `20261020203108_v24_007_assisted_cleanup_audit.sql` — campi di audit per pulizia dei PDF.
- **Due registrazioni ripetute** rappresentate da file distinti per timestamp, conservando lo stesso SQL idempotente: `v21_007_admin_requirement_evidence_service` e `v22_018_review_private_source_figures`.
- Aggiornati i test che leggevano i vecchi percorsi completi; lasciati invariati i contratti applicativi e l'ordinamento logico dei test.
- Aggiunto il controllo `node scripts/audit-supabase-migrations.mjs --strict` e un test strutturale in GitHub Actions.

### Verifiche sul database remoto (solo lettura)

Risultano già presenti `public.admin_delete_capabilities_v25()`, `public.admin_preview_deletion_v25(...)`, le due RPC v47.11 di importazione rapida e la colonna `public.training_integral_pdf_deleted_v24.deletion_origin`.

**Nessun DDL, nessuna modifica a `supabase_migrations`, nessun `db push` o `db reset` eseguito su produzione.** Nessun cambiamento a dati storici, corsi frozen, autorizzazioni dei corsisti, contenuti didattici o istanze SafetyManager Pro.

## Distinzione fondamentale: versioni vs SQL

Il controllo `--strict` verifica la corrispondenza **versione + nome** dei file applicati. Non richiede uguaglianza byte-per-byte tra SQL nel repository e campo `statements` dello storico remoto: diverse registrazioni contengono commenti/placeholder, mentre nel repository si trova SQL completo. Sostituire il SQL del repository con il campo `statements` danneggerebbe la riproducibilità.

Il report stampa comunque numero di corrispondenze esatte e differenze MD5. Un'uguaglianza completa dello schema risultante **richiede ancora replay su database isolato e diff con il remoto**. Lo stato `MIGRATIONS_FAILED` segnalato per il branch Supabase `main` potrebbe essere storico: non si considera risolto senza successivo controllo della sincronizzazione.

## Uso e manutenzione

```bash
node scripts/audit-supabase-migrations.mjs
node scripts/audit-supabase-migrations.mjs --strict
node --test tests/migration-version-history-v47.test.mjs
```

Quando si applicano nuove migrazioni, aggiornare la fotografia remota con la cronologia corrente. Versioni locali più recenti dello snapshot sono mostrate come `PENDING`, senza bloccare la CI; nuove versioni da sincronizzare non vengono applicate automaticamente da questo controllo. Prima di `supabase db push` in produzione, fare `supabase migration list`, `supabase db push --dry-run` e verifica che non vengano proposte migrazioni storiche.

## Limiti e sicurezza

Il passaggio ricostruisce gli identificativi senza riscrivere lo SQL storico: è la misura più prudente per sbloccare gli aggiornamenti. Non dimostra che una nuova installazione da zero replichi lo schema finale; per questo occorre una base di test non di produzione. L'attuale PR deve passare CI prima del merge; non riapplicare SQL vecchio, non correggere con `migration repair` indiscriminato e non modificare i dati dei corsisti.

