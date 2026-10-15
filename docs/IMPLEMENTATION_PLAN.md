# SafetyTraining — piano di implementazione corrente

Aggiornato: 15 ottobre 2026

Questo documento sostituisce la roadmap v19 originaria. Per stato e decisioni complete leggere prima `START_HERE_COLLABORATORS.md`.

## Priorità 1 — riallineare database live e repository

Creare migration idempotenti per tutti i contenuti già presenti nel database ma non ancora versionati integralmente:

- completamento dei 22 corsi precedentemente privi di materiale;
- CSP/CSE 120h + aggiornamento 40h;
- famiglia antincendio L1/L3 + aggiornamenti;
- ponteggi + aggiornamento;
- funi siti/alberi + aggiornamenti + preposto;
- segnaletica stradale lavoratore/preposto/integrazione + aggiornamenti;
- integrazioni evidence-based VVF/INAIL/Infor.MO.

Preservare il riuso delle Learning Unit condivise e non hardcodare UUID generati nel database live.

## Priorità 2 — audit didattico e fonti

Usare la Source Library per completare l'audit delle principali fonti:

- INAIL;
- Corpo Nazionale Vigili del Fuoco;
- Regione Emilia-Romagna;
- Regione Piemonte;
- Comune di Milano;
- ANFOS/Sicurezza.com come benchmark;
- altre Regioni/ASL/ATS/AUSL ed EU-OSHA quando utili.

Per ogni integrazione registrare fonte, data verifica, licenza/riuso, stato normativo e LU interessate.

## Priorità 3 — upgrade qualitativo delle Learning Unit

Trasformare progressivamente i corsi già strutturati in materiale realmente fruibile:

- procedure;
- checklist;
- diagrammi;
- casi reali/near miss;
- GO/NO-GO;
- condizioni di STOP;
- errori frequenti;
- attività docente;
- domande con spiegazione;
- takeaway finali.

La modalità di erogazione non deve nascondere o impoverire il materiale.

## Priorità 4 — authoring admin

Evolvere l'editor attuale in un vero sistema di authoring di moduli/Learning Unit con:

- editing granulare;
- versioning;
- preview docente/corsista;
- gestione fonti;
- gestione visual/asset;
- controllo minuti;
- stato draft/review/published;
- audit delle modifiche.

## Priorità 5 — famiglie specialistiche mancanti

Solo dopo il riallineamento migration, eseguire audit normativo sulle famiglie ancora mancanti, senza inventare durate minime nazionali dove non esistono.

Candidati principali:

- lavori elettrici/PES-PAV-PEI;
- amianto e ruoli specialistici;
- ulteriori rischi/settori con reale percorso formativo autonomo.

## Priorità 6 — Test Builder

**Sospeso.**

Non procedere con la banca test finale finché non viene riattivata esplicitamente. Le micro-domande nelle LU restano didattiche e devono sempre avere spiegazione.

## Priorità 7 — piattaforma e-learning completa

Obiettivo evolutivo:

- tracciamento frequenza e tempo attivo;
- percorsi e prerequisiti;
- aula/docente/corsista;
- test e verifiche quando riattivati;
- attestazione/fascicolo solo quando il percorso è configurato come certificabile;
- coesistenza cartaceo + digitale;
- supporto a processi non completamente digitalizzati quando mancano firme/hardware.

## Regola di chiusura di ogni step

Ogni blocco importante deve terminare con:

1. verifica normativa;
2. verifica contenuti/minuti;
3. migration riproducibile;
4. query di controllo DB;
5. CI GitHub verde;
6. verifica deploy/produzione se coinvolge front-end;
7. aggiornamento documentazione/version history.
