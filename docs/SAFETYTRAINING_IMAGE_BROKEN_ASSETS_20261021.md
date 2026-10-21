# SafetyTraining — immagini mancanti nelle slide: analisi e correzione
**21 ottobre 2026, release v24.8.16**

## Problema riprodotto
Nella presentazione Carroponte / Gru a cavalletto — tutte le tipologie comando (11h), la slide di spiegazione «Tipologie, fisica e componenti del carroponte» mostrava una figura vuota e il testo «immagine non disponibile». La selezione preesistente usava il campo didattico `visual=equipment-training` come se fosse il nome di un SVG: `assets/equipment-training.svg`, non presente nel repository.

## Audit di portata
Su 661 versioni di Learning Unit pubblicate, 170 contengono una chiave visual tematica senza file specifico associato:
- 100 «equipment-training» (attrezzature)
- 46 «role-safety» (organizzazione e ruoli)
- 20 «first-aid» (primo soccorso)
- 4 «confined-space» (spazi confinati)

Le referenze esplicite di file nei campi `idea_images` e `visuals` delle LU pubblicate corrispondono a file locali esistenti. La mancanza deriva prevalentemente dal trattamento errato della **categoria**, non da un caricamento di file del database.

## Correzione
`visual-asset-guard-v32.js` contiene l'inventario reale dei 201 asset, traduce le quattro categorie in immagini validate e pertinenti a corso e argomento e ricicla il materiale authored verificato. La selezione contempla slot principale/secondario/terziario della presentazione.

Per **Carroponte** sono previste illustrazioni didattiche locali su baricentro/sollevamento, brache/accessori e delimitazione dell'area. Non sono inseriti diagrammi di portata numerica o procedure non validate.

Le schede di dettaglio del corso utilizzano lo stesso risolutore. Per i rari file statici che fallissero veramente a runtime compare uno schema generale marcato come sostitutivo; i file PDF privati e il controllo pre-stampa **non** ricevono un fallback che possa mascherare contenuti mancanti.

## Verifica consigliata
1. Ricaricare completamente la PWA, chiuderla e riaprirla se installata.
2. Aprire il corso carroponte 11h, slide 4/64 e altre slide esplicative: nessuna figura `equipment-training.svg` va richiesta.
3. Aprire uno dei corsi RSPP/ruoli, primo soccorso e spazi confinati per verificare la selezione dei temi.
4. Eseguire una stampa di slide: se mancano realmente file deve restare attivo il preflight bloccante. Non ridurre i controlli di stampa.
5. Se compaiono ancora figure vuote, controllare la richiesta fallita nella scheda Network/Console per distinguere 404, contenuto SVG non decodificabile, link privato scaduto e cache PWA non aggiornata.

**Non sono stati modificati i record LU pubblicati, le licenze, le autorizzazioni né i corsi congelati.**