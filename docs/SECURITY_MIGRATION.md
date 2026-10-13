# Migrazione sicurezza / RLS

## Stato attuale

SafetyManager Pro utilizza già RLS, ma sulle principali tabelle operative la policy corrente è legata al singolo account amministratore. Questo non deve essere rimosso prima di avere creato e verificato il nuovo sistema di membership.

## Strategia

1. applicare la migrazione v19 **solo additiva**;
2. creare il primo `platform_membership` amministratore;
3. collegare gli eventuali account docente/corsista;
4. verificare le nuove tabelle LMS con RLS;
5. costruire nuove policy per `enti`, `aziende`, `corsisti`, `docenti`, `progetti`, `iscrizioni` basate su membership;
6. testare con almeno tre account: admin ente, admin azienda, corsista;
7. solo dopo rimuovere la policy legacy a singolo amministratore.

## Principio di isolamento

- `organization_admin`: intero ente;
- `training_manager`: gestione formazione dell'ente;
- `teacher` / `tutor`: accesso operativo alle edizioni assegnate (da restringere ulteriormente nella fase successiva);
- `company_admin`: soltanto la propria azienda;
- `learner`: soltanto le proprie iscrizioni e attività.

La v19 protegge già le nuove tabelle con questo modello, ma non altera ancora le policy del gestionale esistente.
