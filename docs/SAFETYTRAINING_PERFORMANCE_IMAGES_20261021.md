# SafetyTraining — performance deck, leggibilità e catalogo immagini
Data: 21 ottobre 2026 · release v24.8.7

## Diagnosi tecnica
- `app.js`: `deckView()` costruiva con `buildDeck(c)` tutta la presentazione per ogni modifica dell'hash e sostituiva l'intero `app.innerHTML`. Dopo la compilazione vengono creati un numero elevato di slide e schemi per Learning Unit; operazione non necessaria per il solo avanzamento.
- `renderRoute()`: attendeva `SAFETY_INTEGRAL_PDF_V24.prepareCourse()` su ogni passo avanti/indietro, anche se nessuna immagine era cambiata.
- `integral-pdf-v24.js`: la lista privata veniva firmata per intero prima di applicare i filtri di pertinenza alle Learning Unit, con possibili decine/centinaia di URL non destinati a essere visualizzati.
- `sw.js`: l'installazione avviava il fetch concorrente di tutti gli asset, inclusi i 201 asset grafici locali, aumentando il carico iniziale su connessioni lente.
- `piramide-pericoli.svg`: il testo «INFORTUNIO GRAVE» era più largo del triangolo al vertice e varie didascalie laterali erano scritte in riga unica.

## Correzioni
1. Cache `WeakMap` del deck per oggetto corso; invalidazione ad autenticazione cambiata e dopo caricamento autorizzato di figure private. Per navigazioni interne sostituzione dell'articolo slide e dei soli dettagli footer/controlli, non più dell'intero shell.
2. Prima slide mostrata da immagini locali senza attendere le URL private; completata la selezione PDF, il deck attivo viene ricomposto preservando l'indice corrente. Il modulo PDF mantiene protezioni `platform_admin`; l'account è ricontrollato prima del refresh.
3. Placement editoriale prima di `createSignedUrls`: solo tavole con indice di Learning Unit realmente abbinato vengono firmate e messe nella cache di breve durata, non l'inventario non pertinente.
4. Service worker: precache del solo shell essenziale. Le immagini vengono richieste/cache-izzate quando servono; nessuna risorsa PDF privata entra nella cache statica.
5. Piramide disegnata con 4 livelli, testi ingranditi e centrati; «GRAVE» nel vertice e dicitura completa «INFORTUNIO GRAVE» in callout esterno; altre frasi spezzate in righe corte.
6. Frecce visibili «← Indietro» e «Avanti →» nel footer della presentazione, con disabilitazione al primo/ultimo passo; mantenute frecce laterali e tastiera.
7. Nuova pagina amministrativa **Gestione immagini** con ricerca, filtri per libreria, paginazione di 24 anteprime, conteggi dinamici e dati privati firmati solo per pagina. Elenco locale di 201 immagini da `image-library-v25.json`, generate dal pacchetto app; gli asset immutabili in deploy non sono eliminabili direttamente da UI. Per fonti PDF private: le azioni di importazione, pulizia/eliminazione e revisione rimangono nei moduli già esistenti, raggiungibili da pulsanti della nuova pagina. Non allargare i permessi di accesso.

## Verifiche
- Nuova suite `tests/deck-performance-v25.test.mjs` inclusa in `npm run check`: cache, flusso PDF, precache ridotto, pulsanti, SVG ed inventario/categorie con 201 file reali.
- Nessuna scrittura Supabase; corsi frozen, dati corsisti, frequenze, test e attestati invariati.
- Limiti: non eseguita una misurazione cronometrata su browser autenticato né prova manuale di navigazione su device lenti. Prestazioni percepite e controllo di tutte le immagini richiedono QA in situ.
