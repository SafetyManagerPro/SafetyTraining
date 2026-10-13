# Regole di completamento — LMS interno

L'obiettivo della prima fase non è certificare normativamente il corso, ma documentare in modo affidabile che il corsista ha seguito il percorso e ha interagito con i concetti essenziali.

## Una Learning Unit non si completa solo perché è rimasta aperta

Il completamento può richiedere contemporaneamente:

1. **tempo attivo minimo**;
2. **contenuti obbligatori visualizzati**;
3. **domanda di comprensione** superata;
4. eventuali interazioni obbligatorie.

Il valore di `min_active_seconds` è configurabile per ogni unità all'interno di uno specifico corso. Non coincide necessariamente con tutta la durata didattica nominale: serve come controllo minimo anti-fruizione istantanea.

## Tempo attivo

Il client invia heartbeat al server. Il timer non deve avanzare quando:

- la scheda è nascosta;
- il browser non è in primo piano;
- non vi sono interazioni oltre la soglia di inattività configurata.

Impostazione iniziale suggerita:

- heartbeat: 30 s;
- idle timeout: 5 min;
- conferma presenza quando l'utente torna dopo una lunga inattività.

Gli eventi vengono registrati in `training_learning_events`; i secondi attivi aggregati sono mantenuti anche in `training_unit_progress` e `training_enrollments`.

## “Ho letto e capito”

Non si usa come unica evidenza una checkbox. Il flusso preferito è:

`contenuto → domanda semplice → risposta → feedback → completamento`

La risposta corretta è conservata in `training_question_keys`, separata dalla domanda pubblica, così il browser del corsista non può scaricare preventivamente tutte le soluzioni.

La RPC `training_submit_comprehension_answer`:

- verifica che la domanda appartenga all'unità;
- confronta la risposta lato server;
- registra tentativo/esito;
- restituisce solo dopo il tentativo spiegazione, soluzione pratica e regola generale.

## Stato del corso

`not_started → in_progress → completed → passed / failed`

- `completed`: tutte le unità obbligatorie sono state completate;
- `passed`: eventuale test finale superato;
- `failed`: test finale non superato secondo le regole correnti.

La certificazione è un asse separato e nella prima fase resta `not_certified`.

## Date

Le edizioni supportano:

- `immediate` — disponibile subito;
- `start_only` — disponibile da una data, nessuna fine obbligatoria;
- `window` — finestra temporale;
- `manual` — gestione manuale.

`recommended_due_at` può segnalare ritardo senza bloccare il corsista quando `block_after_due=false`.
