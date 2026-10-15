# SafetyTraining — Dirigente evidence enrichment

Aggiornato: 15 ottobre 2026

La famiglia Dirigente dispone ora di una seconda versione didattica evidence-based per tutte le 8 Learning Unit. Le v2 sono `draft` e non sostituiscono automaticamente le v1 pubblicate usate dal corso corrente.

## v20.063 — decisione manageriale e controllo dei processi

Migration:
`supabase/migrations/20261015205509_v20_063_dirigente_managerial_evidence_enrichment.sql`

LU:
- `dirigente:ruolo-responsabilita-delega`
- `dirigente:dvr-misure-risorse`
- `dirigente:processi-mog-sgsl`
- `dirigente:scenario-manageriale`

Nuovi strumenti:
- matrice potere/responsabilità/risorse/escalation;
- board per trasformare misure DVR in azioni finanziate, assegnate e verificate;
- laboratorio sul punto in cui un processo perde controllo;
- control room manageriale con near miss, interferenze, formazione rinviata e azioni scadute.

## v20.064 — governance operativa

Migration:
`supabase/migrations/20261015205647_v20_064_dirigente_governance_evidence_enrichment.sql`

LU:
- `dirigente:appalti-interferenze`
- `dirigente:emergenze-organizzazione`
- `dirigente:comunicazione-formazione-consultazione`
- `dirigente:sistema-istituzionale-231-tutele`

Nuovi strumenti:
- change-control degli appalti/interferenze;
- matrice di copertura reale delle emergenze per turni, layout e lavori temporanei;
- catena decisione → informazione/formazione/addestramento → verifica competenza/applicazione;
- stress test dell’organizzazione per distinguere procedure formalmente corrette da processi realmente funzionanti.

## Fonti

- Ministero del Lavoro e delle Politiche Sociali — Accordo Stato-Regioni 17/04/2025 (`mlps-asr-2025`).
- Normattiva — D.Lgs. 81/2008 vigente (`normattiva-dlgs81-vigente`).
- INAIL — SGSL (`inail-sgsl`).
- INAIL — Condivido near miss.
- INAIL — molestie e violenze sul lavoro, dove pertinente alla governance.
- Corpo Nazionale Vigili del Fuoco — riferimento tecnico per emergenze.

## Audit finale

- 8/8 LU Dirigente con `version_number=2`.
- 8/8 `status=draft`.
- 8/8 `didactic_version=dirigente-evidence-v2`.
- 0 mismatch.
- 0 `course_module_units` collegati alle nuove v2.
- Il corso pubblicato continua quindi a usare le v1 fino a una futura promozione esplicita.
