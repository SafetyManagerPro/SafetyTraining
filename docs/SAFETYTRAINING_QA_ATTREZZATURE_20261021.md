# SafetyTraining — QA didattico e visivo corsi attrezzature (2026-10-21)

## Perimetro del controllo
Verifica in sola lettura delle Learning Unit pubblicate nel database di produzione, delle regole di scelta immagini SVG/PDF e delle condizioni per la stampa in PDF. Famiglie: carrelli elevatori, PLE, gru per autocarro, macchine movimento terra. Nessun accesso autenticato al browser, nessuna prova fisica su macchine o attestazione di conformità; ciò richiede validazione del docente.

## Evidenze database
- Carrelli industriali semoventi 12h: 1 modulo, 8 LU pubblicate, nessuna referenza mancante.
- Carrelli industriali+telescopici+rotativi 16h: 1 modulo, 8 LU pubblicate, nessuna referenza mancante.
- PLE 10h: 1 modulo, 4 LU pubblicate, nessuna referenza mancante.
- Gru per autocarro 12h: 1 modulo, 4 LU pubblicate, nessuna referenza mancante.
- MMT combinato 16h: 1 modulo, 4 LU pubblicate, nessuna referenza mancante.
- MMT escavatori 10h: 1 modulo, 4 LU pubblicate, nessuna referenza mancante.
- Tutte le LU richieste dei 6 percorsi hanno un tempo minimo attivo positivo nel sistema, ma questa informazione **non è prova di frequenza valida né di addestramento pratico**.

## Criticità didattica prioritaria: carrelli combinati 16h
Le 8 LU del corso 16h hanno gli stessi titoli del corso industriale 12h. Nei campi `learning_unit_versions.content` di produzione del corso combinato, **0/8 LU contengono la stringa «telescop» e 0/8 contengono «rotativ»**. È una carenza di evidenza esplicita sulla specificità delle varianti; non prova che manchino eventuali sessioni pratiche documentate altrove.

L'Accordo Stato-Regioni 17 aprile 2025 (GU 119 del 24 maggio 2025) prevede il modulo teorico-tecnico di 8 ore e, per la combinazione industriali/telescopici/rotativi, un modulo pratico specifico di 8 ore, con le tre tipologie di macchine disponibili. Riferimenti:
- https://www.gazzettaufficiale.it/eli/id/2025/05/24/25A03080/SG
- https://www.lavoro.gov.it/en/node/41930
- https://www.asr2025.it/conferenza-stato-regioni-del-17-aprile-2025/

**Azione richiesta al responsabile didattico:** verificare e integrare i contenuti dedicati a telescopici e rotativi, il registro pratico e l'effettiva presenza dei tre mezzi, le prove e la valutazione del docente prima di considerare il corso completo. La revisione dei testi e la prova pratica non devono essere simulate o approvate automaticamente.

## Qualità immagini e stampa
Le immagini PDF private esaminate in precedenza (856 tavole) restano archiviate e da sottoporre a verifica di diritti e contenuto. Inventario dei candidati PDF associati: corso carrelli 16h 89, industriali 12h 122, PLE 70, gru per autocarro 123, MMT combinato 178. Questi numeri sono **candidati**, non conteggi di immagini effettivamente mostrate: il selettore di pertinenza scarta pagine ambigue, ripetute o non corrispondenti alle LU.

Implementate nel codice regole di abbinamento più puntuali per titoli pubblicati:
- Gru: «tabelle di carico», «controlli pre-utilizzo», «segnaletica gestuale»;
- PLE: «controlli» nell'unità di rischio/uso in sicurezza;
- MMT: «controlli» nell'unità sui dispositivi e verifiche.
- Inalterato l'isolamento delle famiglie e delle 27 voci di catalogo congelate.

Regressioni aggiunte alle suite già eseguite da `npm run check`: ciascuna figura supplementare occupa una slide separata, nessuna galleria forzata, figure conservate nei 4 gruppi attrezzature, dimensione 16:9 e stampa una slide per A4 orizzontale. Rimane **necessaria la prova visuale di proiezione e anteprima stampa su browser autenticato**, in particolare su immagini con didascalie lunghe e figure PDF.

## Passi del programma ancora aperti
1. QA browser e stampa fisica delle quattro famiglie attrezzature (amministratore/docente).
2. Revisione dei contenuti tecnico-normativi e dei diritti d'autore sulle figure PDF, a partire dai carrelli 16h.
3. Simulazione end-to-end con utente prova: login, presenza effettiva, test, pratica, approvazione docente, attestato; **non usare dati di corsisti reali nei test**.
4. Audit backend: aziende, corsisti, edizioni, iscrizioni, registri, report, permessi, cancellazioni e audit log.
5. Convalida di produzione e documentazione finale.

Questo rapporto non dichiara la conformità del corso né completa il collaudo visuale.
