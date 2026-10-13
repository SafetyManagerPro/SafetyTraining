# Audit tecnico SafetyManager Pro prima della v19

## Elementi già presenti da riutilizzare
Nel progetto Supabase SafetyManagerPro sono già presenti le strutture necessarie a non duplicare il gestionale: `enti`, `aziende`, `corsisti`, `docenti`, `progetti`, `iscrizioni`, registro presenze aula (`training_sessions`, `session_attendance`, `session_attendance_events`), test digitali, audit log e motore normativo.

## Decisione v19
Le nuove tabelle sono **additive** e usano foreign key verso le tabelle esistenti. Nessuna migrazione v19 cancella o rinomina tabelle legacy.

## Criticità rilevata: RLS attuale
Le principali tabelle legacy risultano oggi protette da una policy `safety_admin_all` legata a un singolo utente amministratore. È sufficiente per l'uso attuale, ma non per vero multiutente/multiazienda.

Per evitare regressioni la v19 non sostituisce subito quelle policy. Prima introduce `platform_memberships` e i collegamenti account; successivamente, dopo bootstrap e test, le policy di SafetyManager verranno migrate a ruoli/ente/azienda.

## Conseguenza
Il passaggio a multiutente è fattibile senza duplicare il database, ma la migrazione di sicurezza deve essere graduale e testata prima di rimuovere le policy legacy.
