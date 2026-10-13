# Safety Platform v19 — foundation package

Questa versione segna il passaggio da Safety Training come sola app di presentazione a una piattaforma condivisa con SafetyManager Pro.

## Cosa contiene

- `apps/training/` — Safety Training v18 preservata come player didattico;
- `apps/manager/` — nota di integrazione con il repository SafetyManager Pro esistente;
- `packages/platform-core/` — ruoli, stati, tracking client e filtro catalogo corsi;
- `supabase/migrations/2026-10-13_v19_lms_foundation.sql` — schema LMS additivo;
- `seeds/learning_units.json` — 90 Learning Unit estratte dalla v18;
- `seeds/questions_public.json` — 90 domande pubbliche;
- `seeds/question_keys_private.json` — chiavi/feedback da mantenere lato server;
- `seeds/risk_catalog.json` — primo catalogo rischi derivato dalle unità;
- `seeds/v19_content_seed.sql` — seed SQL generato;
- `tools/` — export unità, import catalogo SafetyManager e generatore seed SQL;
- `docs/` — architettura, piano, perimetro, tracking e strategia RLS.

## Decisioni v19

1. **Database unico Supabase**: si riutilizzano le tabelle SafetyManager esistenti per enti, aziende, corsisti, docenti, progetti e iscrizioni.
2. **Login unico**: `auth.users` viene collegato ai corsisti/docenti solo quando serve un account.
3. **Multiutente e multiazienda**: introdotti `platform_memberships` e ruoli per ente/azienda.
4. **Due front-end, una piattaforma**: Manager e Training restano interfacce separate sopra gli stessi dati.
5. **E-learning interno prima della certificazione**: corso seguito, tempo attivo, avanzamento, comprensione e test sono separati dallo stato di certificazione.
6. **Date libere**: un percorso può partire subito, da una data, in una finestra o manualmente, senza obbligo di generare attestati.
7. **Contenuti riutilizzabili**: le 90 schede diventano Learning Unit versionate.
8. **Risposte protette**: le soluzioni non vengono esposte nel payload pubblico della domanda.

## Importante

La migrazione SQL è stata preparata come fondazione **additiva** ma in questa consegna non è stata applicata al database di produzione. Prima dell'applicazione conviene provarla su una branch Supabase o in un ambiente di sviluppo, poi eseguire i security advisor.

La policy RLS legacy di SafetyManager legata al singolo amministratore viene volutamente lasciata intatta nella prima fase: la migrazione al vero multiutente sarà successiva al bootstrap delle membership.

## Verifiche locali

Eseguire:

```bash
npm run check
npm run seed:training
```

Per sincronizzare il catalogo corsi da una copia locale di `SafetyManager/js/data.js`:

```bash
node tools/import_safetymanager_catalog.mjs /percorso/SafetyManager/js/data.js
```
