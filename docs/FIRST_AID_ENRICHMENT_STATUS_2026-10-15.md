# SafetyTraining — Primo Soccorso evidence enrichment

Aggiornato: 15 ottobre 2026

## Stato

La famiglia Primo Soccorso è stata arricchita con contenuti evidence-based senza modificare automaticamente i corsi correnti.

### v20.060 — core
`supabase/migrations/20261015204825_v20_060_first_aid_core_evidence_enrichment.sql`

LU iniziali portate a v2 draft `first-aid-v2`:
- `primo_soccorso:allertamento-sicurezza-scena`
- `primo_soccorso:valutazione-iniziale`
- `primo_soccorso:funzioni-vitali`
- `primo_soccorso:traumi-emorragie`

Integrazioni: sicurezza scena, qualità della chiamata 112/118, riconoscimento della priorità, bridge pratico RCP/DAE, trauma/emorragia e handover.

### v20.061 — esteso + Gruppo A
`supabase/migrations/20261015205027_v20_061_first_aid_extended_evidence_enrichment.sql`

LU iniziali portate a v2 draft `first-aid-v2`:
- `primo_soccorso:traumi-scheletro-colonna`
- `primo_soccorso:traumi-torace-addome`
- `primo_soccorso:emergenze-mediche`
- `primo_soccorso:ustioni-intossicazioni-temperatura`
- `primo_soccorso:gruppo-a-rischi-specifici`
- `primo_soccorso:gruppo-a-scenari-complessi`

Integrazioni: non aggravamento del trauma, pattern di allarme senza diagnosi, esposizioni chimiche con SDS/informazioni specifiche, mappatura rischi aziendali Gruppo A e gestione di scenari con più coinvolti.

### v20.062 — aggiornamenti 4h/6h
`supabase/migrations/20261015205221_v20_062_first_aid_updates_evidence_enrichment.sql`

Le 6 LU già draft sono state arricchite in-place, mantenendo i loro `unit_version_id` usati dalle composizioni:
- `update:firstaid:scene-assessment`
- `update:firstaid:vital-functions`
- `update:firstaid:trauma-bleeding`
- `update:firstaid:medical-exposure`
- `update:firstaid:a-complex-trauma`
- `update:firstaid:a-simulation`

Nuovi strumenti: drill 60 secondi, stazione RCP/DAE con feedback, stazione trauma/emorragia, scenari malore/esposizione, coordinamento Gruppo A e rubric per simulazione integrata.

## Fonti registrate/usate

- `gu-dm388-2003` — D.M. 388/2003, fonte normativa primaria.
- `inail-primo-soccorso-2018` — manuale tecnico-didattico INAIL.
- `inail-dae-2025` — DAE nei luoghi di lavoro, policy `citation_only_reference`: sola citazione, nessuna riproduzione di testo o grafica.
- `inail-primo-soccorso-chimico-2025` — esposizioni chimiche, SDS e primo intervento specifico.
- `comune-milano-materiale-didattico` — benchmark didattico con controllo normativo separato.

## Audit finale

- 10/10 LU iniziali hanno `version_number=2`, `status=draft`, `didactic_version=first-aid-v2`.
- 6/6 LU aggiornamento hanno `status=draft`, `didactic_version=first-aid-update-v2`.
- 0 mismatch.
- 0 collegamenti `course_module_units` alle nuove v2 iniziali: i corsi iniziali correnti non sono stati promossi automaticamente.
- 10 collegamenti alle 6 LU update v1: corretti, perché le unità comuni sono riusate fra aggiornamento B/C 4h e Gruppo A 6h.
- Catalogo generale invariato: 92 corsi attivi, 92 con materiale.

## Regola di delivery

Il materiale digitale non sostituisce le esercitazioni pratiche e la verifica delle capacità previste dal percorso. Le tecniche manuali, la rianimazione e l'uso dei presidi devono essere dimostrati, esercitati e corretti in sede pratica secondo il percorso e il protocollo adottato dal soggetto formatore.
