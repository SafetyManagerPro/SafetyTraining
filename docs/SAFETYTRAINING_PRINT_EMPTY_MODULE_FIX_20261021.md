# SafetyTraining — correzione stampa: modulo 1 senza Learning Unit
Data: 21 ottobre 2026.

## Origine verificata
Le versioni pubblicate di 6 corsi possiedono un modulo segnaposto storico senza alcuna Learning Unit, accanto a un modulo reale alla stessa posizione, completo di Learning Unit pubblicate. La generazione delle dispense e delle slide stampa includeva entrambi e interrompeva la stampa alla prima unità mancante.

Corsi coinvolti: aggiornamento lavoratori 6h, dirigente 6h, preposto 6h, RLS 4h, RLS 8h, lavori in quota e DPI III categoria 8h.

## Correzione
In fase di caricamento, sono ignorati esclusivamente i segnaposto vuoti con le chiavi note `dynamic_update`, `dynamic_rls_update`, `height_theory` quando esiste un modulo realmente popolato alla medesima posizione. Tutte le Learning Unit pubblicate e il contenuto stampabile vengono mantenuti.

La stampa di un modulo **realmente incompleto** continua a essere vietata: nessun testo viene inventato e non viene falsamente dichiarata la presenza di unità mancanti.

## Come stampare
1. Aprire **Amministrazione → Stampa slide** oppure **Stampa lezioni**.
2. Selezionare il corso e la versione pubblicata v2.
3. Verificare il riepilogo delle Learning Unit e l'avviso «modulo segnaposto storico omesso».
4. Dopo il controllo del caricamento immagini, utilizzare **Stampa slide / salva PDF** o **Stampa lezioni / salva PDF**.
5. In caso di altri avvisi, utilizzare il messaggio dettagliato: non saltare i controlli di presenza dei contenuti.

## Limiti
Non sono state effettuate modifiche ai dati pubblicati, ai 27 corsi congelati o alle revisioni dei diritti delle immagini. La verifica dei test automatici e il collaudo visivo con amministratore reale sono distinti.
