# Safety Training — Web-app locale v3

## Avvio rapido
### Metodo più semplice
1. Estrai lo ZIP.
2. Fai doppio clic su `AVVIA_SAFETY_TRAINING.bat`.
3. La web-app si apre nel browser e può essere usata senza connessione Internet.

### Metodo consigliato per modalità PWA
Se sul PC è installato Python:
1. fai doppio clic su `AVVIA_CON_SERVER_LOCALE.bat`;
2. il browser apre `http://localhost:8765`;
3. il service worker mantiene in cache i file principali.

## Cosa contiene la v2
- 8 percorsi formativi.
- 46 schede didattiche.
- Formazione generale.
- Front Office.
- Back Office.
- Polizia Locale.
- Operatori Ecologici.
- Verde Pubblico.
- Antincendio Livello 2.
- RLS.
- Modalità Aula e Modalità Docente.
- Diagrammi/infografiche SVG locali, quindi visibili offline.
- Rischi, danni, prevenzione, DPI/protezioni e procedure.
- Comportamenti corretti / da evitare.
- Casi pratici e domande all'aula.
- Mini quiz.
- Preferiti salvati nel browser.
- Ricerca globale.
- Timer.
- Avanzamento argomenti.
- Modalità Presentazione a schermo intero.
- Stampa scheda.
- Layout responsive.
- Manifest PWA e service worker per uso tramite server locale.

## Struttura dei file
- `index.html` — interfaccia
- `styles.css` — grafica
- `app.js` — navigazione e funzioni
- `data.js` — contenuti didattici
- `assets/*.svg` — schemi visuali offline
- `manifest.webmanifest` — configurazione PWA
- `sw.js` — cache offline
- `AVVIA_SAFETY_TRAINING.bat` — apertura diretta
- `AVVIA_CON_SERVER_LOCALE.bat` — server locale

## Nota normativa e progettuale
Il materiale deve essere personalizzato prima dell'uso definitivo con:
- DVR dell'ente;
- classificazione applicabile;
- mansioni e attività effettive;
- attrezzature realmente utilizzate;
- procedure interne;
- DPI assegnati;
- piano di emergenza e planimetrie;
- organigramma della sicurezza.

La durata della formazione specifica non deve essere dedotta esclusivamente dal nome della mansione.

Riferimenti principali:
- D.Lgs. 9 aprile 2008 n. 81 e s.m.i.
- Accordo Stato-Regioni 17 aprile 2025, Rep. atti n. 59/CSR, pubblicato in G.U. n. 119 del 24 maggio 2025.
- D.M. 2 settembre 2021 per formazione addetti antincendio; corso 2-FOR: 8 ore complessive, incluse 3 ore pratiche.

## Novità v3
- Modulo comune iniziale su normativa e sistema prevenzionistico.
- Datore di lavoro e dirigente.
- Preposto.
- Lavoratori.
- RSPP e ASPP.
- Medico competente e sorveglianza sanitaria.
- RLS.
- Addetti emergenze.
- Enti di vigilanza/controllo e funzioni di supporto.
- Responsabilità e apparato sanzionatorio.
- Richiamo alla modifica dell'art. 15 sulle misure contro condotte violente o moleste.
- Tutti i percorsi principali ora hanno una pianificazione temporale completa:
  - Generale: 4 ore.
  - Front Office: 4 ore nella configurazione prevista dalla presente versione.
  - Back Office: 4 ore nella configurazione prevista dalla presente versione.
  - Polizia Locale: 8 ore.
  - Operatori Ecologici: 12 ore.
  - Verde Pubblico: 8 ore.
  - Antincendio Livello 2: 8 ore.
  - RLS: 32 ore.
- Il modulo Fondamenti è una biblioteca/introduttivo comune e NON va sommato automaticamente alle durate obbligatorie.

### Avvertenza importante sulle durate della formazione specifica
La durata effettivamente applicabile va verificata sulla classificazione prevista dall'Accordo Stato-Regioni 17 aprile 2025 e sulle condizioni concrete. Per i lavoratori che non accedono ai reparti produttivi possono ricorrere condizioni che consentono il percorso di rischio basso; la scelta deve essere coerente con attività effettive e DVR.

## Novità v4
- Inserito il logo **CNA Avellino** in modo discreto, non invasivo, nella topbar e nella sidebar.
- Aggiunta sezione **Recenti** per riprendere rapidamente gli ultimi argomenti visitati.
- Home migliorata con ripresa rapida degli ultimi contenuti aperti.
- Aggiornato il service worker per mantenere in cache anche il logo.

## Novità v5 — didattica visuale e interattiva
- Laboratorio interattivo per Formazione Generale, Front Office, Back Office, Polizia Locale, Operatori Ecologici, Verde Pubblico, Antincendio e RLS.
- 8 scenari illustrati offline "Trova l'errore".
- Casi pratici a scelta con feedback immediato.
- Soluzioni nascoste da rivelare dopo il confronto con l'aula.
- Note docente nascoste in Modalità Aula.
- Nuova Libreria DPI con uso, controlli e richiamo alla gerarchia delle misure.
- Tutti gli asset visuali restano locali e disponibili senza Internet.

## Novità v6 — più approfondimento didattico
- Ogni argomento ha ora una spiegazione più estesa e guidata: cosa osservare, perché conta e cosa applicare.
- Nuova sezione **Fonti e approfondimenti** con riferimenti ufficiali selezionati da INAIL e Napo.
- Ogni topic mostra risorse coerenti con il contenuto, utili al docente per rafforzare la spiegazione con materiale esterno.
- Inseriti riferimenti mirati per videoterminali/uffici, raccolta rifiuti e igiene urbana, rischio biologico, aggressioni da pubblico, incendio, lavori in quota, rumore e valutazione dei rischi.
- Le risorse online richiedono connessione Internet; l'app resta comunque usabile offline per i contenuti locali.

## Novità v7 — riassunti INAIL/Napo dentro gli argomenti
- Inseriti **riassunti rielaborati** da fonti INAIL e Napo direttamente nelle schede argomento.
- Ogni topic può mostrare una sezione **Riassunto da INAIL / Napo** con punti chiave pratici.
- Aggiunta una sezione **Immagini che rendono l’idea** con schemi SVG locali per rinforzare la spiegazione.
- Le nuove immagini non copiano i materiali esterni: sono schemi originali creati per uso didattico locale.
- Restano disponibili anche i collegamenti alle **fonti ufficiali** per eventuale consultazione online.

## Novità v8 — approfondimento forte dei corsi più utili in aula
- Rafforzati in profondità i corsi: Formazione Generale, Front Office, Back Office, Operatori Ecologici e Verde Pubblico.
- Per molti argomenti è stata aggiunta una **spiegazione docente estesa** con linguaggio più discorsivo e utilizzabile in aula.
- Inseriti **errori ricorrenti**, **esempi operativi** e **sequenza consigliata per spiegare**.
- Aggiunte nuove immagini SVG originali per: emergenza, segnaletica, layout front office, evacuazione con pubblico, archivio, scala, compattatore, taglienti, igiene sporco/pulito, rischio da calore, motosega e lavoro in quota.
- I riassunti INAIL/Napo restano integrati nei topic, con una maggiore personalizzazione per i temi più usati.

## Novità v9 — completamento Polizia Locale, Antincendio, RLS e Fondamenti
- Approfondite tutte le schede di **Fondamenti normativi**, con maggiore chiarezza su datore, dirigente, preposto, lavoratore, RSPP/ASPP, medico competente, RLS, enti di controllo e sanzioni.
- Rafforzata **Polizia Locale**: rischio stradale, aggressioni, lavoro outdoor/notturno, veicoli, biologico, DPI, emergenze e stress post-evento.
- Rafforzato **Antincendio Livello 2** con spiegazioni su combustione, triangolo del fuoco, compartimentazione, allarme, GSA e pratica estintori. Integrato riferimento a materiale didattico ufficiale dei Vigili del Fuoco.
- Rafforzato l’intero percorso **RLS 32 h**: lettura DVR, consultazione, comunicazione, near miss, organi di vigilanza, sorveglianza sanitaria, DPI, DUVRI, emergenze, stress/violenza, sanzioni e modelli organizzativi.
- Aggiunte nuove immagini originali locali su sistema prevenzionistico, controlli, sanzioni, scenari stradali, conflitto, lavoro notturno, combustione, protezione antincendio, uso estintore, consultazione RLS, lettura DVR e interferenze negli appalti.

## Novità v10 — micro-lezioni multimediali
- Introdotta la sezione **Momento video** nei topic più adatti.
- Per ogni video Napo selezionato vengono indicati: **scena consigliata**, **quando mostrarla**, **domande prima**, **cosa osservare**, **domande dopo**.
- Create 8 schede visuali originali di regia didattica per i video: valutazione rischi, violenza sul lavoro, trasporti, incendio, ergonomia/MMC, lavori in quota, rumore e prodotti chimici.
- Nei topic multimediali vengono ora mostrate fino a 2–4 immagini di supporto: schema concettuale, scenario e cue video.
- I collegamenti aprono il sito ufficiale Napo; l'app resta utilizzabile offline per tutti i contenuti locali.

## Novità v11 — consolidamento qualitativo
- Audit completo di **90 argomenti**.
- Ogni argomento dispone ora almeno di: spiegazione, rischi, prevenzione, DPI/protezioni, procedura, caso, domanda aula, quiz, riferimento normativo, immagine, sintesi da fonte esterna e spiegazione docente.
- Uniformati i topic precedentemente meno approfonditi di Front Office, Back Office, Operatori Ecologici e Verde Pubblico.
- Inserito un indicatore di **Prontezza contenuti** per ogni corso.
- Aggiunta la **Checklist docente** persistente per DVR, piano di emergenza, DPI/attrezzature, video, presenze, test ed esercitazioni pratiche.
- Migliorata la coerenza didattica con errori ricorrenti, esempi operativi e sequenze di spiegazione.

## Novità v12 — presentazione prima di tutto
- Interfaccia riorganizzata come una presentazione 16:9 da proiettare.
- Home semplificata: scegli il corso e avvia la presentazione.
- Agenda temporale esplicita per ogni corso, con orari cumulativi e durata di ogni modulo.
- Moduli rinominati in modo coerente con i contenuti effettivi.
- Slide grandi con testo leggibile da lontano e immagini molto più ampie.
- Sequenza automatica: copertina modulo → concetto → spiegazione → rischi/prevenzione → caso pratico → approfondimento.
- Navigazione con frecce, PageUp/PageDown e barra spaziatrice.
- Modalità schermo intero pensata per videoproiezione.
- Le vecchie schede restano disponibili come materiale docente, ma non sono più la modalità principale di proiezione.
- Antincendio riallineato a 4 moduli temporali 120+120+60+180 minuti.
- RLS organizzato in 4 giornate da 8 ore.


## Novità v13 — risposte nascoste e approfondimenti dentro la presentazione
- Le domande e i test proiettati mostrano inizialmente **solo domanda e opzioni**.
- Il docente può discutere con l'aula e poi premere **Mostra risposta**.
- Nei casi pratici compare una **soluzione guidata nascosta**, ricavata da procedure e misure preventive del topic.
- I quiz hanno una slide dedicata con opzioni A/B/C e risposta corretta nascosta.
- Anche le domande collegate ai video Napo possono essere discusse prima di mostrare gli spunti.
- Le vecchie schede dettagliate non sono più soltanto materiale separato: i loro approfondimenti, esempi, procedure, comportamenti corretti/errati, fonti e video sono inseriti nella sequenza di proiezione nel punto coerente del topic.
- Ogni topic è ora suddiviso in più micro-slide con **tempi progressivi interni** che, sommati, rispettano i minuti previsti per l'argomento.

## Novità v14 — layout adattivo da proiettore
- La presentazione usa una **canvas logica 1600×900 (16:9)** che viene scalata automaticamente per entrare completamente nello spazio disponibile.
- La slide rimane interamente visibile anche con browser non massimizzato o risoluzioni diverse dal proiettore.
- Aggiunto un controllo automatico di densità: se una slide eccede lo spazio disponibile, il testo viene compattato in due livelli senza tagliare il contenuto.
- Immagini molto più grandi e leggibili durante la proiezione.
- Gli approfondimenti delle vecchie schede sono ora parte integrante del deck: vengono proiettati nella sequenza del corso.
- Rischi, prevenzione, procedure e comportamenti sono stati separati in più slide per evitare schermate sovraccariche.
- I riassunti INAIL/Napo e i momenti video sono slide dedicate del corso.
- Domande, casi e test mantengono le risposte nascoste fino al click del docente.

### Ritmo temporale v14
La presentazione limita automaticamente il numero di micro-slide nei topic più brevi: gli approfondimenti più importanti restano nel percorso, ma vengono selezionati in funzione dei minuti disponibili per evitare cambi slide troppo rapidi.

## Novità v15 — revisione editoriale delle slide
- Riorganizzati i titoli dei moduli affinché descrivano realmente i contenuti inclusi.
- Introdotti titoli da proiezione più brevi, lasciando i nomi completi nell'agenda.
- La slide di apertura di ogni argomento ora presenta **un solo messaggio + immagine grande**.
- I testi lunghi vengono spezzati automaticamente in più slide, invece di ridurre il carattere.
- Rischi, misure e procedure con elenchi lunghi vengono suddivisi in più schermate leggibili.
- Uniformati i template: apertura, spiegazione, approfondimento, rischi, prevenzione, procedura, comportamenti, caso, verifica, INAIL/Napo e video.
- Rafforzata la gerarchia visiva per proiezione: titoli grandi, elenchi grandi, immagini circa metà slide.
- La compattazione tipografica resta solo come ultima protezione e non scende sotto dimensioni ragionevoli per un proiettore.
- Il footer specifica ora chiaramente che gli orari mostrati sono **tempo trascorso del corso**.

### Rifinitura v15.1
- I testi molto lunghi, compresi periodi normativi complessi, vengono spezzati anche per clausole e non possono generare una singola slide eccessivamente densa.
- Le risposte nascoste di quiz, casi e video sono ora overlay temporanei: quando sono nascoste non occupano spazio nella slide e quando vengono mostrate non spostano il layout.

## Novità v16 — risposte complete e video realmente apribili
- Ogni domanda/caso proiettato mostra, solo dopo il click del docente: risposta, spiegazione, soluzione concreta del caso e regola generale.
- Lo stesso schema è stato applicato ai mini-quiz nelle schede dettagliate e ai laboratori.
- Le immagini delle slide video sono ora cliccabili.
- I video Napo si aprono in un riquadro/modal interno alla app; dove disponibile viene usato il filmato MP4 ufficiale della scena consigliata.
- Rimane sempre un collegamento di sicurezza alla pagina ufficiale Napo.
- Corretto il collegamento generico del video Tecnostress.
- La tastiera non cambia più slide mentre il player video è aperto; ESC chiude prima il riquadro video.
- Il player viene chiuso automaticamente quando si cambia pagina/slide.


## Novità v17 — risposta su overlay, approfondimenti e nuove grafiche
- Corretto il problema delle **risposte che coprivano i pulsanti**: nelle slide la risposta ora si apre in un **overlay dedicato** con chiusura rapida.
- Ogni domanda/quiz/video mostra ora **risposta, spiegazione, soluzione del caso e soluzione generale** in una finestra separata.
- Inseriti nuovi schemi grafici originali: **organigramma della sicurezza**, **piramide dei pericoli** e **modello a farfalla del rischio**.
- Le nuove grafiche sono state integrate direttamente nella sequenza proiettata dei corsi quando pertinenti.
- Gli argomenti sono stati ampliati aggiungendo ulteriori paragrafi di approfondimento operativo e di collegamento tra rischi, misure e procedure.


## Novità v18 — cosa fare, come fare, come procedere
- Tutti gli argomenti hanno una guida operativa: prima, durante, dopo, passo-passo, se qualcosa non va, quando fermarsi, chi coinvolgere e regola da ricordare.
- In proiezione entrano tre nuove slide dedicate: **Cosa fare**, **Come fare**, **Come procedere se qualcosa non va**.
- Aggiunte le grafiche originali **Procedura operativa in 5 fasi** e **STOP → Segnala → Ripristina**.
- Le sequenze vanno sempre adattate a DVR, procedure interne, manuali e istruzioni dell’ente.
