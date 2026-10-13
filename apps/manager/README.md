# SafetyManager Pro — applicazione gestionale

La v19 non duplica il codice di SafetyManager Pro. Il gestionale esistente resta nel repository `SafetyManagerPro/SafetyManager` e condivide il medesimo database Supabase con Safety Training.

Nella migrazione progressiva SafetyManager continuerà a usare `enti`, `aziende`, `corsisti`, `docenti`, `progetti`, `iscrizioni`, `training_sessions`, `session_attendance`, `test_digitali` e il motore normativo già esistenti. Le nuove tabelle LMS sono additive.
