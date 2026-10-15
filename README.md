# SafetyTraining — piattaforma didattica SafetyManager

SafetyTraining è la piattaforma didattica/LMS integrata con SafetyManager. Condivide database e identità con il gestionale, ma mantiene un front-end specializzato per aula, docente, corsista, Learning Unit, tracking e materiali formativi.

## Stato corrente

Versione logica migration: **v20_046** (15/10/2026).

Baseline tecnica della fase v20_046:

- catalogo DB-backed completo;
- Learning Unit versionate e riutilizzabili;
- Blueprint/regole/varianti;
- tracking tempo attivo e progressi;
- famiglie formative D.Lgs. 81/08 / ASR 2025 ampliate;
- RSPP/ASPP, DL-RSPP, CSP/CSE, confinati, quota, attrezzature e famiglie specialistiche incluse nel perimetro;
- PWA e navigazione responsive;
- Source Library con provenance fonte -> Learning Unit;
- nuovi corsi mantenuti in draft/hidden fino alla revisione.

Ultimo snapshot verificato del database live: **92 corsi attivi, 92 con materiale, 0 vuoti**.

## Prima di lavorare sul progetto

Leggere in quest'ordine:

1. [`docs/START_HERE_COLLABORATORS.md`](docs/START_HERE_COLLABORATORS.md) — stato, decisioni, principi e debito tecnico;
2. [`docs/VERSION_HISTORY_V20.md`](docs/VERSION_HISTORY_V20.md) — progressione migration/versioni;
3. [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — roadmap corrente;
4. [`docs/ARCHITECTURE_V19.md`](docs/ARCHITECTURE_V19.md) — documento storico della fondazione single database / two frontends;
5. [`docs/SECURITY_MIGRATION.md`](docs/SECURITY_MIGRATION.md) — principi RLS/multiutente.

## Architettura

```text
                   SUPABASE / AUTH
                         │
        ┌────────────────┴────────────────┐
        │                                 │
 SafetyManager Pro                  SafetyTraining
 gestione/amministrazione           didattica / LMS
        │                                 │
        └──────────── dati unici ─────────┘
```

Principio: non duplicare anagrafiche, corsi o rischi se esiste già una fonte canonica. Le Learning Unit sono componibili e possono essere riutilizzate in più corsi.

## Regole didattiche essenziali

- materiale completo per docente e corsista indipendentemente dalla modalità legale di erogazione;
- modalità di erogazione = regola/metadata, non riduzione del contenuto;
- contenuti operativi: cosa fare, come, controlli, errori, STOP, emergenza, casi;
- ogni domanda deve avere spiegazione;
- distinguere durata normativa da allocazione didattica interna;
- riutilizzare le LU comuni;
- Test Builder/finale resta sospeso finché non viene riattivato esplicitamente;
- nuove famiglie in draft/hidden fino a revisione;
- ogni fonte esterna va tracciata e verificata prima dell'uso.

## Source Library

Da `v20_046` sono presenti:

- `training_sources`;
- `learning_unit_sources`.

Le fonti vengono classificate per autorevolezza, licenza/riuso, stato normativo e finalità. Materiali senza licenza aperta verificata vengono usati come benchmark e riscritti, non copiati.

## Struttura repository

- `apps/training/` — front-end SafetyTraining;
- `packages/` — componenti/core condivisi;
- `supabase/migrations/` — fonte canonica delle migration versionate;
- `seeds/` — seed e dati di supporto;
- `tools/` — utility/import;
- `docs/` — architettura, handoff, roadmap, audit e cronologia.

## Verifiche

```bash
npm run check
npm run seed:training
```

## Nota sullo stato DB/repository

Il database live contiene alcuni grandi blocchi didattici creati direttamente in Supabase che devono ancora essere trasformati in migration idempotenti nel repository (22 corsi completati, CSP/CSE, famiglia antincendio aggiuntiva, ponteggi, funi, segnaletica stradale e alcune integrazioni evidence-based). Questo è il debito tecnico prioritario prima di accumulare molte altre famiglie.

Vedere `docs/START_HERE_COLLABORATORS.md` per il dettaglio.
