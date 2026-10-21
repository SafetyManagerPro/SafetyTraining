# SafetyTraining — Revisione inventario immagini, fase 2 (21 ottobre 2026)
## Perimetro verificato
- 856 tavole WebP private estratte da nove archivi ZIP, originariamente tratte da 13 dispense PDF. Tutti i 23 fogli di contatto sono stati consultati.
- 75 schede visive individuali (fase precedente, `contact_sheet_visual_inspection`).
- 555 schede con **triage visivo per gruppi di tavole**. Queste schede contengono un soggetto di famiglia e un'eventuale destinazione didattica plausibile, non certificano l'esame approfondito di ogni dettaglio della singola pagina.
- 226 schede di screening preliminare **basate su gruppo della fonte**, da esaminare puntualmente.
- Somma: 75+555+226=856, nessuna tavola assente.
## Esito della classificazione visiva (630 schede)
| Esito | Numero | Possibile azione |
|---|---:|---|
| Figura candidata con osservazione visiva individuale | 51 | Proposta su corso/modulo/argomento, NON approvazione |
| Da ridisegnare prima dell'impiego | 387 | Rielaborazione originale e verifica didattica |
| Necessaria revisione tecnico-normativa/clinica | 160 | Esperto qualificato |
| Proposta di non inserimento | 32 | Escludibile dall'amministratore senza eliminare l'originale |
| In attesa di approfondimento puntuale (livello solo-fonte) | 226 | Valutazione visiva individuale successiva |
## Verifica delle similarità
Confrontate visivamente a coppie le 57 segnalazioni precedenti di pHash vicini, e confrontate le immagini di origine anche per identità pixel: **nessuna coppia è identica pixel per pixel**. I risultati sono `shared_template_different_topic`, `related_layout_different_content` o `shared_visual_component_different_page`. Non eliminare questi file automaticamente.
## Inserimento nelle slide e nella stampa
- Nel materiale riservato amministrativo, la figura completa importata appare soltanto con una collocazione esatta, proveniente da una scelta manuale registrata o da una delle **51 candidate con scheda visiva individuale**.
- La collocazione automatica si attiva solo se il corso ha una versione pubblicata, il corso non è congelato, l'amministratore ha approvato separatamente `technical_status='approved'` e `rights_status='cleared_internal'` e la figura non è esclusa.
- Le 555 schede di gruppo, le 226 schede solo-fonte e tutte le osservazioni `redraw_first`, `expert_review`, `omit_candidate` NON generano automaticamente una figura nella lezione. Non c'è copia in corsista.
- Le altre immagini originali rimangono consultabili nella libreria amministrativa per la revisione.
- Il comando `Escludi dalle presentazioni` è reversibile e distinto da una cancellazione del file.
## Attenzioni didattiche emerse
1. Manuali carrelli/gru/PLE: presenza di pagine intere con watermark, capitoli e tabelle; preferire una illustrazione originale focalizzata sul concetto.
2. Antincendio: contenuti e riferimenti normativa storica da verificare prima di riprodurli.
3. Primo soccorso: alcuni materiali del 2015 riportano prescrizioni di farmaci, ossigeno, posizione antishock e manovre da sottoporre a valutazione sanitaria; non impiegarli direttamente come istruzioni attuali.
4. Macchine movimento terra: molte fotografie e schemi sono pertinenti per famiglie, ma la LU specifica deve essere confermata da revisione del docente.
5. Immagini similari: spesso differenze di testo e capitolo sotto layout identico; non sono copie intercambiabili.
## Fonti e tracciabilità
Archivi ZIP completi e manifest della libreria; `training_integral_pdf_visual_audit_v27`, `training_integral_pdf_screening_v28`, `training_integral_pdf_similarity_v27`, `training_integral_pdf_comparison_v28`. La selezione non modifica la fonte, il suo stato diritti, le revisioni già registrate o i 27 corsi frozen.
## Limite onesto della fase
L'intero inventario è ora coperto da una prima triage; **781 figure non hanno ancora la stessa profondità di analisi individuale delle 75 figure iniziali**. Di queste, 555 sono state classificate tramite soggetti per gruppo osservati sui fogli di contatto e 226 soltanto per la famiglia di fonte. I suggerimenti non sono certificazioni tecniche né licenze di riuso.
