# SafetyTraining — Verifica pertinenza immagini (20 ottobre 2026)

## Dati verificati
- 856 tavole ricostruite e fisicamente presenti nello Storage privato; riferimenti conservati.
- 11 categorie didattiche e 13 PDF sorgente con immagini selezionate, da 14 manuali esaminati.
- 166 immagini con la stessa didascalia generica: Tavola illustrata completa (pagina scannerizzata).
- 351 record su 856 condividono 14 intestazioni ripetute almeno quattro volte. Esempi: 43 con il nome del relatore, 33 con un titolo ricorrente sulle imbracature, 32 con il solo richiamo D. Lvo 81/2008, 19 con un titolo generale PLE, oltre a 14 record senza titolo.
- 89 pagine selezionate del Manuale carrelli elevatori ricontrollate tramite due tavole di contatto, distinguendo diagrammi, schemi, frontespizi e pagine solo testuali.

## Problemi di assegnazione identificati e corretti
1. La vecchia logica collocava comunque immagini senza informazioni semantiche sufficienti, ricorrendo alla posizione della pagina nel PDF.
2. Il vecchio Graphic Pack 04 poteva aggiungere diagrammi casuali appartenenti alla stessa famiglia del corso.
3. Il vecchio catalogo di SVG originali assegnava alla prima Learning Unit le figure prive di qualsiasi corrispondenza.
4. L'adattatore del corso creava immagini generiche basandosi anche sul titolo dell'intero corso, non sul singolo argomento.

Le quattro scorciatoie non sono più usate. Adesso l'attribuzione richiede corrispondenza esplicita al corso e un termine distintivo nel titolo della Learning Unit; in caso di parità o assenza di evidenza l'immagine non compare automaticamente in proiezione né in Stampa slide.

Per il manuale Carrelli, essendo tutte le 89 didascalie generiche, è utilizzata una mappatura di tavole illustrate verificata per macrotema: tipologie, baricentro, componenti, comandi, portata, circolazione, manutenzione. Frontespizi, separatori e molte pagine a prevalenza testuale sono esclusi dalle slide, ma conservati nell'archivio di revisione.

## Inventario per categoria
| Categoria | Tavole |
|---|---:|
| Primo soccorso | 146 |
| Macchine movimento terra | 145 |
| Antincendio | 116 |
| Gru su autocarro | 90 |
| Carrelli elevatori | 89 |
| DPI e protezioni | 60 |
| Lavori in quota | 58 |
| Rischio meccanico | 43 |
| DPI III categoria | 39 |
| PLE | 37 |
| Attrezzature | 33 |
| Totale | 856 |

## Cosa NON è ancora attestato
- La revisione visiva individuale di tutte le 856 tavole e delle relative affermazioni tecniche.
- Il controllo dei diritti di pubblicazione delle immagini dei manuali di terzi.
- La prova browser autenticato e la stampa fisica di ogni slide in formato 2 per A4.
- L'approvazione del docente per immagini con descrizioni generiche o datate.

La qualità è prioritaria rispetto al numero di immagini in slide. Il materiale non assegnato resta accessibile nella biblioteca privata e non viene eliminato. Sono preservati i 27 corsi congelati, le presenze e gli attestati.

## Integrazione v24.8.3 — correzioni SVG GP02 e corso carrelli combinato
- Rilevato difetto di generazione in tutte le **48** immagini locali GP02 (16 generali, 8 carrelli, 8 PLE, 8 gru, 8 MMT): **3 etichette letterali `undefined` per SVG, 144 campi in totale**. Sostituite con descrizioni brevi per la lettura e una specifica azione preventiva attinente al titolo del disegno; non vengono introdotte portate, distanze o valori tecnici universali.
- Nei selettori GP02 il corso `attr_carrelli_all` (titolo abbreviato «Carrelli Elev. Ind + Telescopici + Rotativi») è ora riconosciuto esplicitamente come famiglia carrelli. Nel catalogo originali v23 si consente la riutilizzazione dei disegni già destinati al corso `attr_carrelli_ind`, ma soltanto quando il punteggio dell'argomento è sufficiente e univoco.
- La copertura visuale v23 non assegna più al primo topic disponibile le immagini a pari punteggio: gli abbinamenti ambigui restano sospesi.
- Aggiunti test di regressione su assenza di etichette `undefined`, associazione del corso 16h, mancata contaminazione delle famiglie e soppressione dei pareggi.
- Queste sono correzioni agli **SVG locali originali** e alla selezione; non alterano le **856** tavole PDF private, gli iscritti, le presenze, gli attestati, i 27 corsi congelati o i dati delle Learning Unit.
- Restano necessari il controllo visivo autenticato di proiezione e stampa, la validazione puntuale dei contenuti tecnici e i diritti sulle immagini PDF di terzi. **Non si dichiara certificato l'intero archivio.**

## 2026-10-20 — v24.8.4 correzione sovrapposizione immagini e stampa 1 slide per pagina
- Problema riportato nelle slide Carrelli: gallerie automatiche da 2 immagini supplementari sulle figure principali, mentre CSS globale dava 590px di altezza a ogni immagine della griglia, causando tagli e sovrapposizioni.
- Corretto il distributore didattico: ogni figura aggiuntiva, compresa la tavola PDF completa amministrativa, viene visualizzata su una propria slide Atlante, mantenendo l'immagine principale separata e il rapporto di forma con `object-fit:contain`. Nessuna immagine eliminata né esposta pubblicamente.
- Stampa slide / salva PDF: **una slide completa per pagina A4 orizzontale** (non più 2 per A4 verticale). Rendering 1600x900, cornice 270x151,875 mm, scala fisica 0,63; margini A4 10 mm. Anteprima, indicatore fogli e test aggiornati.
- CSS Atlante riorganizzato a una figura per slide, didascalie con testo a capo e altezza immagine vincolata alla cornice. Preservati corsi congelati, versione pubblicata LU, verifiche corsisti, tempi nominali e permessi. Supabase non richiede migrazioni.
- PWA `safety-training-v22-64`; verificare GitHub Actions, deploy Vercel e QA visivo in browser (inclusa prova stampa) prima della validazione finale.
