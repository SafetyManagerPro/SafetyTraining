# SafetyTraining — Source enrichment status

Aggiornato: 15 ottobre 2026

Questo documento traccia gli arricchimenti didattici evidence-based successivi alla riconciliazione completa DB live → repository.

## Regola operativa

Ogni nuovo arricchimento deve:
1. essere verificato su fonti autorevoli e correnti;
2. mantenere testi, scenari e schemi SafetyTraining originali;
3. registrare provenance e politica di riuso;
4. essere creato come nuova versione `draft` quando esiste già una versione pubblicata;
5. non cambiare automaticamente la composizione dei corsi pubblicati;
6. essere testato transazionalmente prima dell'applicazione;
7. essere applicato tramite migration Supabase e versionato in GitHub con timestamp coerente con la migration history.

## v20.055 — Preposto evidence enrichment

Migration:
`supabase/migrations/20261015203342_v20_055_preposto_evidence_enrichment.sql`

LU arricchite:
- `preposto:vigilanza-operativa`
- `preposto:interruzione-segnalazione`
- `preposto:comunicazione-feedback`
- `preposto:scenari-decisionali`

Principali integrazioni:
- laboratorio su deviazione occasionale → prassi tollerata;
- metodo near miss INAIL;
- decision gate CONTINUA / CORREGGI / STOP / RIPRENDI;
- laboratorio di comunicazione e feedback osservabile;
- debrief near miss orientato a barriere e piano d'azione.

Fonti principali:
- Comune di Milano, materiale preposti: benchmark didattico;
- Regione Piemonte 2025: cross-check formativo;
- INAIL Condivido: near miss.

Le v2 sono `draft`; le v1 pubblicate restano utilizzate dai corsi correnti.

## RLS v2 — famiglia completata

Tutte le 15 Learning Unit RLS legacy dispongono ora di una versione 2 `draft` con `didactic_version = rls-v2`.

### v20.056 — DVR, consultazione, near miss, comunicazione

Migration:
`supabase/migrations/20261015203806_v20_056_rls_evidence_enrichment.sql`

LU:
- `rls:dvr-rls`
- `rls:consultazione-rls`
- `rls:infortuni-rls`
- `rls:comunicazione-rls`

Nuovi strumenti:
- laboratorio lettura DVR contro lavoro reale;
- question pack per consultazione e riunione periodica;
- analisi causa-barriera dei near miss;
- modello di segnalazione verificabile e follow-up.

### v20.057 — ruolo, normativa, appalti, vigilanza

Migration:
`supabase/migrations/20261015203956_v20_057_rls_roles_interferences_enrichment.sql`

LU:
- `rls:ruolo-rls`
- `rls:normativa-rls`
- `rls:appalti-rls`
- `rls:organi-vigilanza-rls`

Nuovi strumenti:
- matrice dei confini del ruolo RLS;
- laboratorio “chi fa cosa” nel sistema prevenzionistico;
- mappa delle interferenze negli appalti;
- registro di follow-up di verbali, rilievi e prescrizioni.

### v20.058 — principi giuridici, responsabilità, sorveglianza sanitaria, psicosociale

Migration:
`supabase/migrations/20261015204152_v20_058_rls_legal_health_psychosocial_enrichment.sql`

LU:
- `rls:principi-giuridici-rls`
- `rls:sanzioni-responsabilita-rls`
- `rls:sorveglianza-sanitaria-rls`
- `rls:stress-violenza-rls`

Nuovi strumenti:
- gerarchia e lettura critica delle fonti;
- matrice obbligo/potere/omissione/ruolo RLS;
- laboratorio sulla sorveglianza sanitaria con confine privacy;
- mappa partecipativa dei rischi psicosociali;
- prevenzione di molestie, minacce e aggressioni.

Nuove fonti registrate:
- `normattiva-dlgs81-vigente`
- `inail-stress-methodology-2025`
- `inail-violence-work-2025`

### v20.059 — DPI, emergenze, rischi specifici

Migration:
`supabase/migrations/20261015204311_v20_059_rls_ppe_emergency_specific_risks_enrichment.sql`

LU:
- `rls:dpi-rls`
- `rls:emergenze-rls`
- `rls:rischi-specifici-rls`

Nuovi strumenti:
- verifica di efficacia del DPI nel compito reale e gerarchia delle misure;
- griglia di osservazione e debrief delle prove di emergenza;
- profilo di rischio specifico per attività/mansione/esposizione/misure/evidenze.

## Audit RLS finale

Esito verificato sul DB live:
- 15 LU RLS con `version_number = 2`;
- 15/15 `status = draft`;
- 15/15 `didactic_version = rls-v2`;
- 0 mismatch;
- 0 `course_module_units` collegati alle nuove v2;
- le composizioni dei corsi pubblicati restano quindi invariate;
- catalogo generale: 92 corsi attivi, 92 con materiale.

## Fonti di riferimento usate in questo blocco

- Normattiva — D.Lgs. 81/2008 consolidato e vigente;
- INAIL — corso RLS e attività di prevenzione/formazione;
- INAIL Condivido — near miss;
- INAIL — metodologia stress lavoro-correlato e aggiornamenti 2025;
- INAIL — molestie, violenze e aggressioni sul lavoro;
- Regione Emilia-Romagna — materiali delle figure della prevenzione, usati secondo policy di riuso/provenance;
- Comune di Milano SSL — benchmark didattico, con verifica separata della vigenza normativa;
- Corpo Nazionale Vigili del Fuoco — riferimento tecnico per emergenze/antincendio.

## Prossimo blocco consigliato

Proseguire con audit evidence-based delle famiglie già complete ma da rafforzare, in ordine:
1. Primo soccorso;
2. Dirigente;
3. Lavoratore generale/specifico;
4. Datore di lavoro / DL-RSPP;
5. RSPP/ASPP specialistici.

Per ogni famiglia mantenere lo stesso pattern: fonte → audit → versione draft → test → migration → GitHub → CI → audit di non-regressione.
