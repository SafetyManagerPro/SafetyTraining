# Piano di implementazione v19 → piattaforma operativa

## Fase A — Fondazioni (questa v19)
- audit del database SafetyManager esistente;
- schema additivo LMS;
- ruoli e collegamento account↔corsista/docente;
- catalogo corsi sincronizzabile;
- learning unit versionate;
- edizioni LMS con date libere;
- tracking eventi/tempo attivo;
- banca domande e test;
- esportazione delle 90 unità attuali in formato seed.

## Fase B — Login unico e multiutente
1. creare il primo `organization_admin`;
2. collegare account esistenti a ente e ruoli;
3. introdurre progressivamente le nuove policy RLS anche sulle tabelle legacy di SafetyManager;
4. aggiungere invito corsista e collegamento `auth.users ↔ corsisti`.

> Importante: le policy legacy attuali non vanno sostituite in un solo colpo. La migrazione deve essere progressiva per non interrompere SafetyManager.

## Fase C — Catalogo corsi
- importare `DB_CORSI` da SafetyManager con lo script di sincronizzazione;
- applicare il filtro `course-scope.json`;
- escludere RSPP, ASPP, coordinatori e ambienti confinati;
- conservare ID legacy per piena compatibilità;
- versionare i programmi senza modificare retroattivamente le edizioni già avviate.

## Fase D — Learning Unit
- importare le 90 unità della v18;
- assegnare tag rischio/mansione;
- pubblicare versioni;
- comporre i primi template: lavoratori basso/medio/alto, RLS, antincendio L2 e profili comunali.

## Fase E — Portale corsista
- dashboard “I miei corsi”;
- continua da ultimo punto;
- blocco sequenziale opzionale;
- timer attivo;
- domanda di comprensione;
- avanzamento e storico attività.

## Fase F — Test
- banca domande;
- mini-check per unità;
- test finali configurabili;
- tentativi, punteggio, spiegazione e argomenti da ripassare.

## Fase G — SafetyManager Bridge
- riepilogo tempo/avanzamento/test nel gestionale;
- per i percorsi puramente interni: nessun attestato automatico;
- in futuro, solo per percorsi esplicitamente configurati come certificabili, collegamento a fascicolo/attestato/scadenza.
